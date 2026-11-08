<?php
// Serves every page of the site (see /.htaccess) with the dashboard's edits applied:
// text and SEO from Website → Content, the announcement bar, and redirects / 404 logging.
// If anything here fails, the original built page is sent unchanged, so the site never goes down
// because of the CMS.
declare(strict_types=1);
define('PUBLIC_PAGE', true);

$root = (string) realpath(dirname(__DIR__));
$p = (string) ($_GET['p'] ?? '');
$is404 = $p === '__404';
$uri = (string) parse_url((string) ($_SERVER['REDIRECT_URL'] ?? $_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH);

$file = null;
if (!$is404) {
    $candidate = realpath($root . '/' . ($p === '' ? 'index' : $p) . '.html');
    if ($candidate && str_starts_with($candidate, $root . '/') && is_file($candidate)) {
        $file = $candidate;
    }
}
$path = $file ? ($p === '' ? '/' : '/' . trim($p, '/')) : $uri;
$status = $file ? 200 : 404;
$file ??= $root . '/404.html';

function send_plain(string $file, int $status): void
{
    http_response_code($status);
    header('Content-Type: text/html; charset=utf-8');
    readfile($file);
    exit;
}

try {
    require __DIR__ . '/lib.php';
    require __DIR__ . '/cms.php';

    // Redirects managed in the dashboard (Website → Redirects).
    $q = db()->prepare('SELECT id, to_url, code FROM redirects WHERE from_path = ? OR from_path = ? LIMIT 1');
    $q->execute([$path, rtrim($path, '/') ?: '/']);
    if ($r = $q->fetch()) {
        db()->prepare('UPDATE redirects SET hits = hits + 1, last_hit = UTC_TIMESTAMP() WHERE id = ?')->execute([$r['id']]);
        $qs = (string) ($_SERVER['REDIRECT_QUERY_STRING'] ?? '');
        $qs = preg_replace('/(^|&)p=[^&]*/', '', $qs) ?? '';
        $to = $r['to_url'] . ($qs !== '' && !str_contains($r['to_url'], '?') ? '?' . ltrim($qs, '&') : '');
        header('Location: ' . $to, true, in_array((int) $r['code'], [301, 302, 307, 308], true) ? (int) $r['code'] : 301);
        exit;
    }

    // Broken links report (Website → Redirects). Skip build assets and obvious bot probes.
    if ($status === 404 && strlen($path) < 190 && !preg_match('#^/(_next|api|cdn)/|\.(php|env|git|asp|cgi|sql|bak|ini|xml|txt|map)$|wp-#i', $path)) {
        $ref = mb_substr((string) ($_SERVER['HTTP_REFERER'] ?? ''), 0, 500);
        db()->prepare('INSERT INTO not_found (path, referrer) VALUES (?, ?) ON DUPLICATE KEY UPDATE hits = hits + 1, last_seen = UTC_TIMESTAMP(), referrer = IF(VALUES(referrer) <> \'\', VALUES(referrer), referrer)')
            ->execute([$path, $ref]);
    }

    $draft = ($_GET['cms'] ?? '') === 'draft' && current_user() !== null;

    // Live pages are cached until the next publish or deploy.
    $version = (string) (db()->query("SELECT v FROM settings WHERE k = 'cms_version'")->fetchColumn() ?: '0');
    $cacheDir = __DIR__ . '/cache';
    $cacheFile = $cacheDir . '/' . md5($file . '|' . filemtime($file) . '|' . $version . '|' . $path) . '.html';
    if (!$draft && is_file($cacheFile)) {
        send_plain($cacheFile, $status);
    }

    $html = render_page((string) file_get_contents($file), $file === $root . '/404.html' ? '/404' : $path, $draft);
    if ($draft) {
        $html = preg_replace('#</head>#', '<meta name="robots" content="noindex, nofollow"/></head>', $html, 1) ?? $html;
        header('Cache-Control: no-store');
    } else {
        if (!is_dir($cacheDir)) {
            @mkdir($cacheDir, 0755);
        }
        // Keep the cache small: clear it when it grows past ~500 pages.
        if (random_int(1, 200) === 1) {
            $all = glob($cacheDir . '/*.html') ?: [];
            if (count($all) > 500) {
                array_map('unlink', $all);
            }
        }
        @file_put_contents($cacheFile, $html, LOCK_EX);
    }
    http_response_code($status);
    header('Content-Type: text/html; charset=utf-8');
    echo $html;
} catch (Throwable $e) {
    error_log('render.php: ' . $e->getMessage());
    send_plain($file, $status);
}
