<?php
// CMS core: stored edits (text, SEO, site-wide settings) and how they are applied to a built page.
// Included by render.php and admin.php (direct access is denied in .htaccess).
//
// cms_entries rows:
//   k = "/about#3kq9x1"  kind=text   → HTML that replaces <span data-cms="/about#3kq9x1">…</span>
//   k = "global#…"       kind=text   → same, shared by every page (footer)
//   k = "seo:/about"     kind=seo    → JSON {title, description, image, noindex}
//   k = "g:announcement" kind=global → JSON {on, text, link, label, tone, id}
// published = live value (NULL = use the built default). draft = pending edit; DRAFT_RESET means
// "go back to the default when published".
declare(strict_types=1);

const DRAFT_RESET = "\0reset";

function docroot(): string
{
    return (string) realpath(dirname(__DIR__));
}

/** Allow only simple inline formatting in edited text. */
function sanitize_html(string $html): string
{
    $html = str_replace(["\r\n", "\r"], "\n", $html);
    $html = preg_replace('#<(div|p)[^>]*>#i', '', $html) ?? '';
    $html = preg_replace('#</(div|p)>#i', '<br>', $html) ?? '';
    $html = strip_tags($html, '<em><i><strong><b><br><a>');
    // Strip every attribute except a safe href on links.
    $html = preg_replace_callback('#<(em|i|strong|b|br)\b[^>]*>#i', static fn ($m) => '<' . strtolower($m[1]) . '>', $html) ?? '';
    $html = preg_replace_callback('#<a\b([^>]*)>#i', static function ($m) {
        if (preg_match('#href\s*=\s*"([^"]*)"#i', $m[1], $h) || preg_match("#href\s*=\s*'([^']*)'#i", $m[1], $h)) {
            $href = html_entity_decode($h[1], ENT_QUOTES);
            if (preg_match('#^(https?://|mailto:|tel:|/|\#)#i', $href)) {
                $ext = preg_match('#^https?://#i', $href) && !preg_match('#^https?://(www\.)?atriumad\.com#i', $href);
                return '<a href="' . htmlspecialchars($href, ENT_QUOTES) . '"' . ($ext ? ' target="_blank" rel="noopener"' : '') . '>';
            }
        }
        return '<a>';
    }, $html) ?? '';
    $html = preg_replace('#(<br>\s*)+$#', '', trim($html)) ?? '';
    return mb_substr($html, 0, 20000);
}

/** All live (or, for previews, draft-over-live) values: ['t' => [key => html], 'seo' => [path => [...]], 'g' => [name => [...]]]. */
function cms_values(bool $draft): array
{
    $out = ['t' => [], 'seo' => [], 'g' => []];
    foreach (db()->query('SELECT k, kind, published, draft FROM cms_entries') as $r) {
        $v = $r['published'];
        if ($draft && $r['draft'] !== null) {
            $v = $r['draft'] === DRAFT_RESET ? null : $r['draft'];
        }
        if ($v === null || $v === '') {
            continue;
        }
        if ($r['kind'] === 'text') {
            $out['t'][$r['k']] = $v;
        } elseif ($r['kind'] === 'seo') {
            $j = json_decode($v, true);
            if (is_array($j)) {
                $out['seo'][substr($r['k'], 4)] = $j;
            }
        } elseif ($r['kind'] === 'global') {
            $j = json_decode($v, true);
            if (is_array($j)) {
                $out['g'][substr($r['k'], 2)] = $j;
            }
        }
    }
    return $out;
}

/** Replace the inner HTML of each <span data-cms="key"> that has an edit. */
function apply_text(string $html, array $texts): string
{
    if (!$texts || !str_contains($html, 'data-cms=')) {
        return $html;
    }
    if (!preg_match_all('#<span data-cms="([^"]+)">#', $html, $m, PREG_OFFSET_CAPTURE)) {
        return $html;
    }
    // Work backwards so earlier offsets stay valid.
    for ($i = count($m[0]) - 1; $i >= 0; $i--) {
        $key = html_entity_decode($m[1][$i][0], ENT_QUOTES);
        if (!array_key_exists($key, $texts)) {
            continue;
        }
        $start = $m[0][$i][1] + strlen($m[0][$i][0]);
        $depth = 1;
        $pos = $start;
        while ($depth > 0 && preg_match('#<span\b|</span>#', $html, $t, PREG_OFFSET_CAPTURE, $pos)) {
            $depth += $t[0][0] === '</span>' ? -1 : 1;
            $pos = $t[0][1] + strlen($t[0][0]);
            if ($depth === 0) {
                $end = $t[0][1];
                $html = substr($html, 0, $start) . $texts[$key] . substr($html, $end);
            }
        }
    }
    return $html;
}

function apply_seo(string $html, array $seo, string $path): string
{
    $s = $seo[$path] ?? null;
    if (!$s) {
        return $html;
    }
    $e = static fn (string $v): string => htmlspecialchars($v, ENT_QUOTES);
    $setMeta = static function (string $html, string $attr, string $name, string $value) use ($e): string {
        $tag = '<meta ' . $attr . '="' . $name . '" content="' . $e($value) . '"/>';
        $re = '#<meta ' . $attr . '="' . preg_quote($name, '#') . '" content="[^"]*"\s*/?>#';
        if (preg_match($re, $html)) {
            return preg_replace($re, str_replace(['\\', '$'], ['\\\\', '\$'], $tag), $html, 1) ?? $html;
        }
        return preg_replace('#</head>#', $tag . '</head>', $html, 1) ?? $html;
    };
    if (!empty($s['title'])) {
        $html = preg_replace('#<title>.*?</title>#s', '<title>' . str_replace(['\\', '$'], ['\\\\', '\$'], $e($s['title'])) . '</title>', $html, 1) ?? $html;
        $html = $setMeta($html, 'property', 'og:title', $s['title']);
        $html = $setMeta($html, 'name', 'twitter:title', $s['title']);
    }
    if (!empty($s['description'])) {
        $html = $setMeta($html, 'name', 'description', $s['description']);
        $html = $setMeta($html, 'property', 'og:description', $s['description']);
        $html = $setMeta($html, 'name', 'twitter:description', $s['description']);
    }
    if (!empty($s['image'])) {
        $img = str_starts_with($s['image'], '/') ? 'https://www.atriumad.com' . $s['image'] : $s['image'];
        $html = $setMeta($html, 'property', 'og:image', $img);
        $html = $setMeta($html, 'name', 'twitter:image', $img);
    }
    if (!empty($s['noindex'])) {
        $html = preg_replace('#<meta name="robots" content="[^"]*"\s*/?>#', '', $html) ?? $html;
        $html = preg_replace('#</head>#', '<meta name="robots" content="noindex, nofollow"/></head>', $html, 1) ?? $html;
    }
    return $html;
}

/** The page with every edit applied, plus window.__CMS__ so React hydrates the same text. */
function render_page(string $html, string $path, bool $draft): string
{
    $v = cms_values($draft);
    $html = apply_text($html, $v['t']);
    $html = apply_seo($html, $v['seo'], $path);
    $payload = [
        't' => $v['t'],
        'seo' => array_map(static fn ($s) => array_intersect_key($s, ['title' => 1, 'description' => 1]), $v['seo']),
        'g' => $v['g'],
    ];
    if (!$payload['t'] && !$payload['seo'] && !$payload['g']) {
        return $html;
    }
    $script = '<script>window.__CMS__=' . json_encode($payload, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE) . '</script>';
    $out = preg_replace('#<head>#', '<head>' . str_replace(['\\', '$'], ['\\\\', '\$'], $script), $html, 1);
    return $out ?? $html;
}

/** Every built page: [path => title]. */
function site_pages(): array
{
    $root = docroot();
    $pages = [];
    $skip = ['api', 'careers-api', 'cdn', '_next', 'media', 'images', 'videos', 'fonts', 'uploads', 'logos', 'testimonials', 'textures'];
    $dir = new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS);
    $filter = new RecursiveCallbackFilterIterator($dir, static function (SplFileInfo $f) use ($root, $skip) {
        if ($f->isDir()) {
            return dirname($f->getPathname()) !== $root || !in_array($f->getFilename(), $skip, true);
        }
        return str_ends_with($f->getFilename(), '.html');
    });
    $it = new RecursiveIteratorIterator($filter);
    foreach ($it as $f) {
        $rel = substr($f->getPathname(), strlen($root));
        if (!str_ends_with($rel, '.html') || preg_match('#^/(api|careers-api|cdn|_next|media)/#', $rel)) {
            continue;
        }
        $path = $rel === '/index.html' ? '/' : substr($rel, 0, -5);
        if (in_array($path, ['/404', '/_not-found', '/admin', '/forms'], true)) {
            continue;
        }
        $head = (string) file_get_contents($f->getPathname(), false, null, 0, 20000);
        $title = preg_match('#<title>(.*?)</title>#s', $head, $t) ? html_entity_decode($t[1], ENT_QUOTES) : $path;
        $pages[$path] = $title;
    }
    ksort($pages);
    return $pages;
}

/** Bump the content version so cached pages are rebuilt. */
function cms_bump(): void
{
    db()->prepare("REPLACE INTO settings (k, v) VALUES ('cms_version', ?)")->execute([(string) time()]);
}
