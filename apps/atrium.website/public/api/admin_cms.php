<?php
// Dashboard API, part 2: website content (CMS), SEO, announcement, redirects, 404s, media,
// form builder and the activity log. Included by admin.php after sign-in ($me, $b, $isPost, $id).
declare(strict_types=1);

const MEDIA_TYPES = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif', 'image/avif' => 'avif'];
const MEDIA_MAX = 8 * 1024 * 1024;
const FORM_STATUSES = ['draft', 'live', 'closed'];
const SUB_STATUSES = ['new', 'reviewed', 'contacted', 'done', 'spam', 'archived'];

function valid_page_path(string $p): string
{
    return preg_match('#^/[A-Za-z0-9/_\-.]*$#', $p) && strlen($p) < 160 ? $p : '';
}

function cms_snapshot(string $path): array
{
    $rows = rows('SELECT k, published FROM cms_entries WHERE (path = ? OR path = ?) AND published IS NOT NULL', [$path, 'global']);
    $out = [];
    foreach ($rows as $r) {
        $out[$r['k']] = $r['published'];
    }
    return $out;
}

function slugify(string $s): string
{
    $s = strtolower(trim(preg_replace('/[^A-Za-z0-9]+/', '-', iconv('UTF-8', 'ASCII//TRANSLIT', $s) ?: $s) ?? '', '-'));
    return substr($s, 0, 60) ?: 'form';
}

function clean_fields(array $fields): array
{
    $out = [];
    $seen = [];
    foreach (array_slice($fields, 0, 80) as $f) {
        if (!is_array($f)) {
            continue;
        }
        $type = in_array($f['type'] ?? '', FIELD_TYPES_ADMIN, true) ? $f['type'] : 'text';
        $id = preg_replace('/[^a-z0-9_]/', '', strtolower((string) ($f['id'] ?? ''))) ?: 'f' . bin2hex(random_bytes(3));
        while (isset($seen[$id])) {
            $id .= 'x';
        }
        $seen[$id] = true;
        $opts = array_values(array_filter(array_map(static fn ($o) => clean((string) $o, 200), is_array($f['options'] ?? null) ? $f['options'] : []), static fn ($o) => $o !== ''));
        $out[] = [
            'id' => $id,
            'type' => $type,
            'label' => clean((string) ($f['label'] ?? ''), 300),
            'help' => clean((string) ($f['help'] ?? ''), 600),
            'placeholder' => clean((string) ($f['placeholder'] ?? ''), 200),
            'required' => !empty($f['required']) && $type !== 'section',
            'options' => array_slice($opts, 0, 50),
            'width' => ($f['width'] ?? '') === 'half' ? 'half' : 'full',
        ];
    }
    return $out;
}
const FIELD_TYPES_ADMIN = ['text', 'textarea', 'email', 'phone', 'number', 'date', 'select', 'radio', 'checkbox', 'yesno', 'section'];

switch ($action) {
    // ── Content ─────────────────────────────────────────────────────────────
    case 'cms_pages':
        $counts = [];
        foreach (rows('SELECT path, SUM(published IS NOT NULL) live, SUM(draft IS NOT NULL) drafts, MAX(updated_at) updated FROM cms_entries GROUP BY path') as $r) {
            $counts[$r['path']] = $r;
        }
        $seo = [];
        foreach (rows("SELECT k FROM cms_entries WHERE kind = 'seo' AND published IS NOT NULL") as $r) {
            $seo[substr($r['k'], 4)] = true;
        }
        $views = [];
        [$from, $to] = [date('Y-m-d', strtotime('-30 days')), date('Y-m-d', strtotime('+1 day'))];
        foreach (rows('SELECT path, COUNT(*) n FROM pageviews WHERE day BETWEEN ? AND ? GROUP BY path', [$from, $to]) as $r) {
            $views[$r['path']] = (int) $r['n'];
        }
        $pages = [];
        foreach (site_pages() as $path => $title) {
            $c = $counts[$path] ?? null;
            $pages[] = [
                'path' => $path,
                'title' => $title,
                'edits' => (int) ($c['live'] ?? 0),
                'drafts' => (int) ($c['drafts'] ?? 0),
                'updated' => utc_iso($c['updated'] ?? null),
                'seo' => isset($seo[$path]),
                'views' => $views[$path] ?? 0,
            ];
        }
        $g = $counts['global'] ?? null;
        json_out(200, ['pages' => $pages, 'global' => ['edits' => (int) ($g['live'] ?? 0), 'drafts' => (int) ($g['drafts'] ?? 0)]]);

    case 'cms_page':
        $path = valid_page_path((string) ($_GET['path'] ?? ''));
        if ($path === '') {
            json_out(422, ['error' => 'path']);
        }
        $entries = [];
        foreach (rows('SELECT k, kind, published, draft, updated_at, updated_by FROM cms_entries WHERE path IN (?, ?, ?)', [$path, 'global', 'seo:' . $path]) as $r) {
            $r['draft'] = $r['draft'] === DRAFT_RESET ? '__reset__' : $r['draft'];
            $r['updated_at'] = utc_iso($r['updated_at']);
            $entries[] = $r;
        }
        $revs = rows('SELECT id, ts, user_email, note FROM cms_revisions WHERE path = ? ORDER BY id DESC LIMIT 50', [$path]);
        json_out(200, ['path' => $path, 'entries' => $entries, 'revisions' => array_map(static fn ($r) => array_merge($r, ['id' => (int) $r['id'], 'ts' => utc_iso($r['ts'])]), $revs)]);

    case 'cms_save':
        post_only($isPost);
        need('editor', $me);
        $path = valid_page_path((string) ($b['path'] ?? ''));
        if ($path === '') {
            json_out(422, ['error' => 'path']);
        }
        $n = 0;
        foreach ((is_array($b['texts'] ?? null) ? $b['texts'] : []) as $key => $html) {
            $key = (string) $key;
            $scope = str_starts_with($key, 'global#') ? 'global' : $path;
            if (!str_starts_with($key, $scope . '#') || strlen($key) > 190) {
                continue;
            }
            $draft = $html === null ? DRAFT_RESET : sanitize_html((string) $html);
            db()->prepare("INSERT INTO cms_entries (k, path, kind, draft, updated_by) VALUES (?, ?, 'text', ?, ?)
                ON DUPLICATE KEY UPDATE draft = VALUES(draft), updated_at = CURRENT_TIMESTAMP, updated_by = VALUES(updated_by)")
                ->execute([$key, $scope, $draft, $me['email']]);
            $n++;
        }
        if (is_array($b['seo'] ?? null)) {
            $s = $b['seo'];
            $seo = array_filter([
                'title' => clean((string) ($s['title'] ?? ''), 200),
                'description' => clean((string) ($s['description'] ?? ''), 400),
                'image' => clean((string) ($s['image'] ?? ''), 500),
                'noindex' => !empty($s['noindex']),
            ]);
            db()->prepare("INSERT INTO cms_entries (k, path, kind, draft, updated_by) VALUES (?, ?, 'seo', ?, ?)
                ON DUPLICATE KEY UPDATE draft = VALUES(draft), updated_at = CURRENT_TIMESTAMP, updated_by = VALUES(updated_by)")
                ->execute(['seo:' . $path, 'seo:' . $path, $seo ? json_encode($seo, JSON_UNESCAPED_UNICODE) : DRAFT_RESET, $me['email']]);
            $n++;
        }
        json_out(200, ['ok' => true, 'saved' => $n]);

    case 'cms_publish':
        post_only($isPost);
        need('editor', $me);
        $path = valid_page_path((string) ($b['path'] ?? ''));
        if ($path === '') {
            json_out(422, ['error' => 'path']);
        }
        $scopes = [$path, 'global', 'seo:' . $path];
        $pending = (int) one('SELECT COUNT(*) n FROM cms_entries WHERE path IN (?, ?, ?) AND draft IS NOT NULL', $scopes)['n'];
        if ($pending === 0) {
            json_out(200, ['ok' => true, 'published' => 0]);
        }
        $pdo = db();
        $pdo->beginTransaction();
        $pdo->prepare('UPDATE cms_entries SET published = IF(draft = ?, NULL, draft), draft = NULL, updated_by = ? WHERE path IN (?, ?, ?) AND draft IS NOT NULL')
            ->execute([DRAFT_RESET, $me['email'], ...$scopes]);
        $pdo->exec('DELETE FROM cms_entries WHERE published IS NULL AND draft IS NULL');
        $snap = cms_snapshot($path);
        $seoNow = one('SELECT published FROM cms_entries WHERE k = ?', ['seo:' . $path])['published'] ?? null;
        if ($seoNow !== null) {
            $snap['seo:' . $path] = $seoNow;
        }
        $pdo->prepare('INSERT INTO cms_revisions (user_email, path, note, data) VALUES (?, ?, ?, ?)')
            ->execute([$me['email'], $path, clean((string) ($b['note'] ?? ''), 255) ?: "$pending change" . ($pending === 1 ? '' : 's'), json_encode($snap, JSON_UNESCAPED_UNICODE)]);
        $pdo->commit();
        cms_bump();
        log_activity($me, 'content.publish', "$path ($pending change" . ($pending === 1 ? '' : 's') . ')');
        json_out(200, ['ok' => true, 'published' => $pending]);

    case 'cms_discard':
        post_only($isPost);
        need('editor', $me);
        $path = valid_page_path((string) ($b['path'] ?? ''));
        db()->prepare('UPDATE cms_entries SET draft = NULL WHERE path IN (?, ?, ?)')->execute([$path, 'global', 'seo:' . $path]);
        db()->exec('DELETE FROM cms_entries WHERE published IS NULL AND draft IS NULL');
        json_out(200, ['ok' => true]);

    case 'cms_restore':
        post_only($isPost);
        need('editor', $me);
        $rev = one('SELECT path, data FROM cms_revisions WHERE id = ?', [$id]);
        if (!$rev) {
            json_out(404, ['error' => 'not_found']);
        }
        $path = $rev['path'];
        $data = json_decode($rev['data'], true) ?: [];
        // Load the old version as a draft: you review it on the page, then publish.
        foreach (rows('SELECT k FROM cms_entries WHERE path IN (?, ?, ?) AND published IS NOT NULL', [$path, 'global', 'seo:' . $path]) as $r) {
            if (!array_key_exists($r['k'], $data)) {
                db()->prepare('UPDATE cms_entries SET draft = ? WHERE k = ?')->execute([DRAFT_RESET, $r['k']]);
            }
        }
        foreach ($data as $k => $v) {
            $kind = str_starts_with($k, 'seo:') ? 'seo' : 'text';
            $scope = $kind === 'seo' ? $k : (str_starts_with($k, 'global#') ? 'global' : $path);
            db()->prepare('INSERT INTO cms_entries (k, path, kind, draft, updated_by) VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE draft = VALUES(draft), updated_at = CURRENT_TIMESTAMP, updated_by = VALUES(updated_by)')
                ->execute([$k, $scope, $kind, $v, $me['email']]);
        }
        json_out(200, ['ok' => true, 'path' => $path]);

    case 'cms_globals':
        $g = one("SELECT published FROM cms_entries WHERE k = 'g:announcement'");
        json_out(200, ['announcement' => json_decode((string) ($g['published'] ?? '{}'), true) ?: new stdClass()]);

    case 'cms_globals_save':
        post_only($isPost);
        need('editor', $me);
        $a = is_array($b['announcement'] ?? null) ? $b['announcement'] : [];
        $link = clean((string) ($a['link'] ?? ''), 500);
        if ($link !== '' && !preg_match('#^(https?://|/|mailto:|tel:)#i', $link)) {
            json_out(422, ['error' => 'link']);
        }
        $ends = clean((string) ($a['ends'] ?? ''), 40);
        if ($ends !== '' && strtotime($ends) === false) {
            json_out(422, ['error' => 'ends']);
        }
        $val = [
            'on' => !empty($a['on']),
            'style' => ($a['style'] ?? '') === 'pill' ? 'pill' : 'banner',
            'where' => ($a['where'] ?? '') === 'all' ? 'all' : 'home',
            'title' => clean((string) ($a['title'] ?? ''), 60),
            'ends' => $ends !== '' ? gmdate('Y-m-d\TH:i:s\Z', (int) strtotime($ends)) : '',
            'text' => clean((string) ($a['text'] ?? ''), 200),
            'link' => $link,
            'label' => clean((string) ($a['label'] ?? ''), 40),
            'tone' => in_array($a['tone'] ?? '', ['mint', 'dark', 'amber'], true) ? $a['tone'] : 'mint',
            'id' => substr(md5((string) ($a['title'] ?? '') . (string) ($a['text'] ?? '') . $link), 0, 8),
        ];
        db()->prepare("INSERT INTO cms_entries (k, path, kind, published, updated_by) VALUES ('g:announcement', 'g', 'global', ?, ?)
            ON DUPLICATE KEY UPDATE published = VALUES(published), updated_at = CURRENT_TIMESTAMP, updated_by = VALUES(updated_by)")
            ->execute([json_encode($val, JSON_UNESCAPED_UNICODE), $me['email']]);
        cms_bump();
        log_activity($me, 'announcement.' . ($val['on'] ? 'on' : 'off'), $val['text']);
        json_out(200, ['ok' => true]);

    // ── Redirects & 404s ────────────────────────────────────────────────────
    case 'redirects':
        $r = rows('SELECT id, from_path, to_url, code, hits, last_hit, created_at FROM redirects ORDER BY from_path');
        $nf = rows('SELECT path, hits, first_seen, last_seen, referrer FROM not_found ORDER BY last_seen DESC LIMIT 300');
        json_out(200, [
            'redirects' => array_map(static fn ($x) => array_merge($x, ['id' => (int) $x['id'], 'code' => (int) $x['code'], 'hits' => (int) $x['hits'], 'last_hit' => utc_iso($x['last_hit']), 'created_at' => utc_iso($x['created_at'])]), $r),
            'not_found' => array_map(static fn ($x) => array_merge($x, ['hits' => (int) $x['hits'], 'first_seen' => utc_iso($x['first_seen']), 'last_seen' => utc_iso($x['last_seen'])]), $nf),
        ]);

    case 'redirect_save':
        post_only($isPost);
        need('editor', $me);
        $from = '/' . ltrim(clean((string) ($b['from'] ?? ''), 190), '/');
        $from = $from === '/' ? '/' : rtrim($from, '/');
        $to = clean((string) ($b['to'] ?? ''), 500);
        $code = in_array((int) ($b['code'] ?? 301), [301, 302], true) ? (int) $b['code'] : 301;
        if (!preg_match('#^/[^\s?#]*$#', $from) || $from === '/' || !preg_match('#^(https?://|/)#', $to) || $to === $from) {
            json_out(422, ['error' => 'invalid']);
        }
        if ($id) {
            db()->prepare('UPDATE redirects SET from_path = ?, to_url = ?, code = ? WHERE id = ?')->execute([$from, $to, $code, $id]);
        } else {
            db()->prepare('INSERT INTO redirects (from_path, to_url, code) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE to_url = VALUES(to_url), code = VALUES(code)')->execute([$from, $to, $code]);
        }
        db()->prepare('DELETE FROM not_found WHERE path = ?')->execute([$from]);
        cms_bump();
        log_activity($me, 'redirect.save', "$from → $to ($code)");
        json_out(200, ['ok' => true]);

    case 'redirect_delete':
        post_only($isPost);
        need('editor', $me);
        $r = one('SELECT from_path, to_url FROM redirects WHERE id = ?', [$id]);
        db()->prepare('DELETE FROM redirects WHERE id = ?')->execute([$id]);
        cms_bump();
        log_activity($me, 'redirect.delete', ($r['from_path'] ?? '') . ' → ' . ($r['to_url'] ?? ''));
        json_out(200, ['ok' => true]);

    case 'notfound_dismiss':
        post_only($isPost);
        need('editor', $me);
        if (!empty($b['all'])) {
            db()->exec('DELETE FROM not_found');
        } else {
            db()->prepare('DELETE FROM not_found WHERE path = ?')->execute([(string) ($b['path'] ?? '')]);
        }
        json_out(200, ['ok' => true]);

    // ── Media ───────────────────────────────────────────────────────────────
    case 'media':
        $rows = rows('SELECT id, created_at, file, original, mime, size, width, height, alt, uploaded_by FROM media ORDER BY id DESC LIMIT 500');
        json_out(200, ['items' => array_map(static fn ($r) => array_merge($r, ['id' => (int) $r['id'], 'size' => (int) $r['size'], 'width' => (int) $r['width'], 'height' => (int) $r['height'], 'url' => '/uploads/' . $r['file'], 'created_at' => utc_iso($r['created_at'])]), $rows)]);

    case 'media_upload':
        post_only($isPost);
        need('editor', $me);
        $f = $_FILES['file'] ?? null;
        if (!$f || ($f['error'] ?? 1) !== UPLOAD_ERR_OK) {
            json_out(422, ['error' => 'upload']);
        }
        if ($f['size'] > MEDIA_MAX) {
            json_out(413, ['error' => 'too_big']);
        }
        $info = @getimagesize($f['tmp_name']);
        $mime = $info['mime'] ?? '';
        if (!$info || !isset(MEDIA_TYPES[$mime])) {
            json_out(415, ['error' => 'type']);
        }
        $dirRel = date('Y/m');
        $dir = docroot() . '/uploads/' . $dirRel;
        if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
            json_out(500, ['error' => 'mkdir']);
        }
        $base = slugify(pathinfo((string) $f['name'], PATHINFO_FILENAME));
        $name = $base . '-' . bin2hex(random_bytes(3)) . '.' . MEDIA_TYPES[$mime];
        if (!move_uploaded_file($f['tmp_name'], "$dir/$name")) {
            json_out(500, ['error' => 'save']);
        }
        @chmod("$dir/$name", 0644);
        db()->prepare('INSERT INTO media (file, original, mime, size, width, height, alt, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
            ->execute(["$dirRel/$name", clean((string) $f['name'], 255), $mime, (int) $f['size'], (int) $info[0], (int) $info[1], clean((string) ($_POST['alt'] ?? ''), 255), $me['email']]);
        log_activity($me, 'media.upload', "$dirRel/$name");
        json_out(200, ['ok' => true, 'url' => "/uploads/$dirRel/$name"]);

    case 'media_update':
        post_only($isPost);
        need('editor', $me);
        db()->prepare('UPDATE media SET alt = ? WHERE id = ?')->execute([clean((string) ($b['alt'] ?? ''), 255), $id]);
        json_out(200, ['ok' => true]);

    case 'media_delete':
        post_only($isPost);
        need('editor', $me);
        $m = one('SELECT file FROM media WHERE id = ?', [$id]);
        if ($m) {
            $path = realpath(docroot() . '/uploads/' . $m['file']);
            if ($path && str_starts_with($path, docroot() . '/uploads/')) {
                @unlink($path);
            }
            db()->prepare('DELETE FROM media WHERE id = ?')->execute([$id]);
            log_activity($me, 'media.delete', $m['file']);
        }
        json_out(200, ['ok' => true]);

    // ── Forms ───────────────────────────────────────────────────────────────
    case 'forms':
        $custom = rows('SELECT f.id, f.slug, f.title, f.status, f.updated_at, COUNT(s.id) total, SUM(s.status = \'new\') fresh, MAX(s.created_at) last
            FROM forms f LEFT JOIN form_submissions s ON s.form_id = f.id GROUP BY f.id ORDER BY f.id DESC');
        $contact = one("SELECT COUNT(*) total, SUM(status = 'new') fresh, MAX(created_at) last FROM contacts");
        $apps = one("SELECT COUNT(*) total, SUM(status = 'nuevo') fresh, MAX(created_at) last FROM applications");
        json_out(200, [
            'builtin' => [
                ['key' => 'contact', 'title' => 'Contact form', 'where' => '/contact', 'total' => (int) $contact['total'], 'new' => (int) $contact['fresh'], 'last' => utc_iso($contact['last'])],
                ['key' => 'careers', 'title' => 'Job applications', 'where' => '/careers/account-manager-95fc33', 'total' => (int) $apps['total'], 'new' => (int) $apps['fresh'], 'last' => utc_iso($apps['last'])],
            ],
            'custom' => array_map(static fn ($r) => ['id' => (int) $r['id'], 'slug' => $r['slug'], 'title' => $r['title'], 'status' => $r['status'], 'updated_at' => utc_iso($r['updated_at']), 'total' => (int) $r['total'], 'new' => (int) $r['fresh'], 'last' => utc_iso($r['last'])], $custom),
        ]);

    case 'form_get':
        $f = one('SELECT * FROM forms WHERE id = ?', [$id]);
        if (!$f) {
            json_out(404, ['error' => 'not_found']);
        }
        $f['id'] = (int) $f['id'];
        $f['fields'] = json_decode($f['fields'], true) ?: [];
        $f['settings'] = json_decode($f['settings'], true) ?: new stdClass();
        json_out(200, ['form' => $f]);

    case 'form_save':
        post_only($isPost);
        need('editor', $me);
        $title = clean((string) ($b['title'] ?? ''), 200);
        if ($title === '') {
            json_out(422, ['error' => 'title']);
        }
        $slug = slugify((string) ($b['slug'] ?? '') ?: $title);
        $taken = one('SELECT id FROM forms WHERE slug = ? AND id <> ?', [$slug, $id]);
        if ($taken) {
            $slug .= '-' . bin2hex(random_bytes(2));
        }
        $s = is_array($b['settings'] ?? null) ? $b['settings'] : [];
        $notify = clean((string) ($s['notify'] ?? ''), 500);
        foreach (array_filter(array_map('trim', explode(',', $notify))) as $addr) {
            if (!filter_var($addr, FILTER_VALIDATE_EMAIL)) {
                json_out(422, ['error' => 'email']);
            }
        }
        $settingsJson = json_encode([
            'submit_label' => clean((string) ($s['submit_label'] ?? ''), 40) ?: 'Send',
            'success_title' => clean((string) ($s['success_title'] ?? ''), 120) ?: 'Thank you!',
            'success_message' => clean((string) ($s['success_message'] ?? ''), 1000) ?: "We've received your answers.",
            'closed_message' => clean((string) ($s['closed_message'] ?? ''), 500) ?: 'This form is no longer accepting answers.',
            'notify' => $notify,
        ], JSON_UNESCAPED_UNICODE);
        $fieldsJson = json_encode(clean_fields(is_array($b['fields'] ?? null) ? $b['fields'] : []), JSON_UNESCAPED_UNICODE);
        $status = in_array($b['status'] ?? '', FORM_STATUSES, true) ? $b['status'] : 'draft';
        $desc = clean((string) ($b['description'] ?? ''), 3000);
        if ($id) {
            db()->prepare('UPDATE forms SET slug = ?, title = ?, description = ?, fields = ?, settings = ?, status = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?')
                ->execute([$slug, $title, $desc, $fieldsJson, $settingsJson, $status, $id]);
        } else {
            db()->prepare('INSERT INTO forms (slug, title, description, fields, settings, status, updated_at) VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())')
                ->execute([$slug, $title, $desc, $fieldsJson, $settingsJson, $status]);
            $id = (int) db()->lastInsertId();
        }
        log_activity($me, 'form.save', "$title ($status)");
        json_out(200, ['ok' => true, 'id' => $id, 'slug' => $slug]);

    case 'form_delete':
        post_only($isPost);
        need('editor', $me);
        $f = one('SELECT title FROM forms WHERE id = ?', [$id]);
        db()->prepare('DELETE FROM form_submissions WHERE form_id = ?')->execute([$id]);
        db()->prepare('DELETE FROM forms WHERE id = ?')->execute([$id]);
        log_activity($me, 'form.delete', (string) ($f['title'] ?? $id));
        json_out(200, ['ok' => true]);

    case 'form_subs':
        $fid = (int) ($_GET['form'] ?? 0);
        $rows = rows('SELECT id, created_at, name, email, status, LEFT(data, 400) preview FROM form_submissions WHERE form_id = ? ORDER BY id DESC LIMIT 2000', [$fid]);
        json_out(200, ['items' => array_map(static function ($r) {
            $first = '';
            if (preg_match_all('/"value":"((?:[^"\\\\]|\\\\.)*)"/', (string) $r['preview'], $m)) {
                $first = implode(' · ', array_slice(array_filter(array_map(static fn ($v) => json_decode('"' . $v . '"') ?? $v, $m[1])), 0, 3));
            }
            return ['id' => (int) $r['id'], 'created_at' => utc_iso($r['created_at']), 'name' => $r['name'] ?: ($r['email'] ?: 'Answer #' . $r['id']), 'email' => $r['email'], 'status' => $r['status'], 'preview' => $first];
        }, $rows), 'statuses' => SUB_STATUSES]);

    case 'form_sub_get':
        $r = one('SELECT * FROM form_submissions WHERE id = ?', [$id]);
        if (!$r) {
            json_out(404, ['error' => 'not_found']);
        }
        unset($r['ip_hash']);
        $r['id'] = (int) $r['id'];
        $r['created_at'] = utc_iso($r['created_at']);
        $r['data'] = json_decode($r['data'], true) ?: [];
        json_out(200, ['item' => $r, 'journey' => journey($r['visitor']), 'statuses' => SUB_STATUSES]);

    case 'form_sub_update':
        post_only($isPost);
        need('editor', $me);
        if (isset($b['status'])) {
            if (!in_array($b['status'], SUB_STATUSES, true)) {
                json_out(422, ['error' => 'status']);
            }
            db()->prepare('UPDATE form_submissions SET status = ? WHERE id = ?')->execute([$b['status'], $id]);
        }
        if (isset($b['notes'])) {
            db()->prepare('UPDATE form_submissions SET notes = ? WHERE id = ?')->execute([clean((string) $b['notes'], 5000), $id]);
        }
        json_out(200, ['ok' => true]);

    case 'form_sub_delete':
        post_only($isPost);
        need('editor', $me);
        db()->prepare('DELETE FROM form_submissions WHERE id = ?')->execute([$id]);
        log_activity($me, 'form.answer.delete', "#$id");
        json_out(200, ['ok' => true]);

    case 'form_export':
        $fid = (int) ($_GET['form'] ?? 0);
        $f = one('SELECT slug, fields FROM forms WHERE id = ?', [$fid]);
        if (!$f) {
            json_out(404, ['error' => 'not_found']);
        }
        $fields = array_values(array_filter(json_decode($f['fields'], true) ?: [], static fn ($x) => ($x['type'] ?? '') !== 'section'));
        $out = [];
        foreach (rows('SELECT id, created_at, status, notes, data FROM form_submissions WHERE form_id = ? ORDER BY id DESC', [$fid]) as $r) {
            $byId = [];
            foreach (json_decode($r['data'], true) ?: [] as $a) {
                $byId[$a['id']] = $a['value'];
            }
            $row = [$r['id'], $r['created_at'], $r['status']];
            foreach ($fields as $fl) {
                $row[] = $byId[$fl['id']] ?? '';
            }
            $row[] = $r['notes'];
            $out[] = $row;
        }
        csv_out('atrium-form-' . $f['slug'] . '.csv', array_merge(['ID', 'Received (UTC)', 'Status'], array_map(static fn ($x) => $x['label'], $fields), ['Notes']), $out);

    // ── Insights (blog) ─────────────────────────────────────────────────────
    case 'posts':
        $views = [];
        foreach (rows("SELECT path, COUNT(*) n FROM pageviews WHERE path LIKE '/insights/%' GROUP BY path") as $r) {
            $views[substr($r['path'], 10)] = (int) $r['n'];
        }
        $rows = rows('SELECT id, slug, title, category, status, published_at, updated_at, updated_by, cover, focus_keyword, CHAR_LENGTH(content) len FROM posts ORDER BY COALESCE(published_at, updated_at) DESC');
        json_out(200, [
            'items' => array_map(static fn ($r) => [
                'id' => (int) $r['id'], 'slug' => $r['slug'], 'title' => $r['title'], 'category' => $r['category'], 'cover' => $r['cover'],
                'status' => $r['status'] === 'published' && $r['published_at'] && strtotime($r['published_at'] . ' UTC') > time() ? 'scheduled' : $r['status'],
                'published_at' => utc_iso($r['published_at']), 'updated_at' => utc_iso($r['updated_at']), 'updated_by' => $r['updated_by'],
                'views' => $views[$r['slug']] ?? 0, 'keyword' => $r['focus_keyword'],
            ], $rows),
            'categories' => array_column(rows("SELECT DISTINCT category FROM posts WHERE category <> '' ORDER BY category"), 'category'),
        ]);

    case 'post_get':
        $r = one('SELECT * FROM posts WHERE id = ?', [$id]);
        if (!$r) {
            json_out(404, ['error' => 'not_found']);
        }
        $r['id'] = (int) $r['id'];
        $r['published_at'] = utc_iso($r['published_at']);
        $r['updated_at'] = utc_iso($r['updated_at']);
        $r['created_at'] = utc_iso($r['created_at']);
        json_out(200, ['post' => $r]);

    case 'post_save':
        post_only($isPost);
        need('editor', $me);
        $title = clean((string) ($b['title'] ?? ''), 250);
        if ($title === '') {
            json_out(422, ['error' => 'title']);
        }
        $slug = post_slug((string) ($b['slug'] ?? '') ?: $title);
        if (one('SELECT id FROM posts WHERE slug = ? AND id <> ?', [$slug, $id])) {
            json_out(409, ['error' => 'slug']);
        }
        $status = in_array($b['status'] ?? '', ['draft', 'published'], true) ? $b['status'] : 'draft';
        $when = clean((string) ($b['published_at'] ?? ''), 40);
        $publishedAt = $when !== '' && strtotime($when) !== false ? gmdate('Y-m-d H:i:s', (int) strtotime($when)) : null;
        if ($status === 'published' && $publishedAt === null) {
            $prev = one('SELECT published_at FROM posts WHERE id = ?', [$id]);
            $publishedAt = $prev['published_at'] ?? gmdate('Y-m-d H:i:s');
        }
        $cover = clean((string) ($b['cover'] ?? ''), 500);
        if ($cover !== '' && !preg_match('#^(https?://|/)#', $cover)) {
            json_out(422, ['error' => 'cover']);
        }
        $vals = [
            $slug, $title, clean((string) ($b['excerpt'] ?? ''), 600), sanitize_post_html((string) ($b['content'] ?? '')),
            $cover, clean((string) ($b['cover_alt'] ?? ''), 255), clean((string) ($b['category'] ?? ''), 80),
            implode(', ', array_slice(array_filter(array_map(static fn ($t) => clean($t, 40), explode(',', (string) ($b['tags'] ?? '')))), 0, 12)),
            clean((string) ($b['author'] ?? ''), 120), clean((string) ($b['seo_title'] ?? ''), 200), clean((string) ($b['seo_description'] ?? ''), 400),
            clean((string) ($b['focus_keyword'] ?? ''), 120), $status, $publishedAt, $me['email'],
        ];
        if ($id) {
            $was = one('SELECT status, slug FROM posts WHERE id = ?', [$id]);
            db()->prepare('UPDATE posts SET slug = ?, title = ?, excerpt = ?, content = ?, cover = ?, cover_alt = ?, category = ?, tags = ?, author = ?, seo_title = ?, seo_description = ?, focus_keyword = ?, status = ?, published_at = ?, updated_by = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?')
                ->execute([...$vals, $id]);
            // Keep old links working when a published article's address changes.
            if ($was && $was['status'] === 'published' && $was['slug'] !== $slug) {
                db()->prepare('INSERT INTO redirects (from_path, to_url, code) VALUES (?, ?, 301) ON DUPLICATE KEY UPDATE to_url = VALUES(to_url)')
                    ->execute(['/insights/' . $was['slug'], '/insights/' . $slug]);
            }
        } else {
            db()->prepare('INSERT INTO posts (slug, title, excerpt, content, cover, cover_alt, category, tags, author, seo_title, seo_description, focus_keyword, status, published_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
                ->execute($vals);
            $id = (int) db()->lastInsertId();
        }
        cms_bump();
        log_activity($me, 'insights.save', "$title ($status)");
        json_out(200, ['ok' => true, 'id' => $id, 'slug' => $slug]);

    case 'post_delete':
        post_only($isPost);
        need('editor', $me);
        $r = one('SELECT title FROM posts WHERE id = ?', [$id]);
        db()->prepare('DELETE FROM posts WHERE id = ?')->execute([$id]);
        cms_bump();
        log_activity($me, 'insights.delete', (string) ($r['title'] ?? $id));
        json_out(200, ['ok' => true]);

    // ── Activity ────────────────────────────────────────────────────────────
    case 'activity':
        $rows = rows('SELECT id, ts, user_email, action, detail FROM activity ORDER BY id DESC LIMIT 300');
        json_out(200, ['items' => array_map(static fn ($r) => array_merge($r, ['id' => (int) $r['id'], 'ts' => utc_iso($r['ts'])]), $rows)]);
}
