<?php
// Dashboard API for /admin. Every action except login needs a signed-in user.
// Roles: viewer (read everything), editor (also change and delete forms/applications), owner (also users and settings).
declare(strict_types=1);
require __DIR__ . '/lib.php';
require __DIR__ . '/stats.php';
require __DIR__ . '/cms.php';

const INBOX_STATUSES = ['new', 'contacted', 'qualified', 'won', 'lost', 'spam', 'archived'];
const CAREER_STATUSES = ['nuevo', 'revisar', 'entrevista', 'finalista', 'descartado', 'contratado'];

$action = (string) ($_GET['action'] ?? '');
$id = (int) ($_GET['id'] ?? 0);

// ── Auth ─────────────────────────────────────────────────────────────────────

if ($action === 'login') {
    require_post();
    if (over_limit('login_fail', 8, 15, false)) {
        json_out(429, ['error' => 'too_many']);
    }
    $b = json_body();
    $email = mb_strtolower(clean((string) ($b['email'] ?? ''), 200));
    $password = (string) ($b['password'] ?? '');
    $user = null;
    if ($email !== '' && $password !== '') {
        $q = db()->prepare('SELECT id, pass_hash FROM users WHERE email = ?');
        $q->execute([$email]);
        $row = $q->fetch();
        if ($row && password_verify($password, $row['pass_hash'])) {
            $user = (int) $row['id'];
        } elseif (!$row && (int) db()->query('SELECT COUNT(*) FROM users')->fetchColumn() === 0) {
            // First run: the owner signs in with the email and password from config.php, which creates the account.
            $okEmail = $email === mb_strtolower((string) ($config['owner_email'] ?? ''));
            $okPass = hash_equals((string) ($config['admin_password_sha256'] ?? ''), hash('sha256', $config['salt'] . '|' . $password));
            if ($okEmail && $okPass) {
                db()->prepare("INSERT INTO users (email, name, role, pass_hash) VALUES (?, 'Owner', 'owner', ?)")
                    ->execute([$email, password_hash($password, PASSWORD_DEFAULT)]);
                $user = (int) db()->lastInsertId();
            }
        }
    }
    if ($user === null) {
        over_limit('login_fail', 8, 15, true);
        usleep(400000);
        json_out(401, ['error' => 'wrong_password']);
    }
    start_admin_session();
    session_regenerate_id(true);
    $_SESSION['uid'] = $user;
    $_SESSION['expires'] = time() + 12 * 3600;
    db()->prepare('UPDATE users SET last_login = UTC_TIMESTAMP() WHERE id = ?')->execute([$user]);
    json_out(200, ['ok' => true]);
}

if ($action === 'logout') {
    start_admin_session();
    $_SESSION = [];
    session_destroy();
    json_out(200, ['ok' => true]);
}

$me = require_user('viewer');
$isPost = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
if ($isPost) {
    require_same_origin();
}
$b = $isPost ? json_body() : [];

function need(string $role, array $me): void
{
    $rank = ['viewer' => 0, 'editor' => 1, 'owner' => 2];
    if (($rank[$me['role']] ?? -1) < $rank[$role]) {
        json_out(403, ['error' => 'role']);
    }
}

function post_only(bool $isPost): void
{
    if (!$isPost) {
        json_out(405, ['error' => 'method']);
    }
}

function csv_out(string $filename, array $header, array $rows): void
{
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF");
    fputcsv($out, $header);
    foreach ($rows as $r) {
        // Neutralise spreadsheet formulas in user-submitted text.
        fputcsv($out, array_map(static fn ($v) => is_string($v) && preg_match('/^[=+\-@]/', $v) ? "'" . $v : $v, array_values($r)));
    }
    exit;
}

switch ($action) {
    case 'me':
        $inboxNew = (int) db()->query("SELECT COUNT(*) FROM contacts WHERE status = 'new'")->fetchColumn();
        $careersNew = (int) db()->query("SELECT COUNT(*) FROM applications WHERE status = 'nuevo'")->fetchColumn();
        $formsNew = (int) db()->query("SELECT COUNT(*) FROM form_submissions WHERE status = 'new'")->fetchColumn();
        $drafts = (int) db()->query('SELECT COUNT(*) FROM cms_entries WHERE draft IS NOT NULL')->fetchColumn();
        $broken = (int) db()->query('SELECT COUNT(*) FROM not_found')->fetchColumn();
        json_out(200, ['user' => $me, 'badges' => ['inbox' => $inboxNew, 'careers' => $careersNew, 'forms' => $inboxNew + $careersNew + $formsNew, 'drafts' => $drafts, 'broken' => $broken], 'timezone' => settings()['timezone']]);

    case 'password':
        post_only($isPost);
        $next = (string) ($b['next'] ?? '');
        $q = db()->prepare('SELECT pass_hash FROM users WHERE id = ?');
        $q->execute([$me['id']]);
        if (!password_verify((string) ($b['current'] ?? ''), (string) $q->fetchColumn())) {
            json_out(400, ['error' => 'wrong_password']);
        }
        if (mb_strlen($next) < 10) {
            json_out(422, ['error' => 'too_short']);
        }
        db()->prepare('UPDATE users SET pass_hash = ? WHERE id = ?')->execute([password_hash($next, PASSWORD_DEFAULT), $me['id']]);
        json_out(200, ['ok' => true]);

    case 'profile':
        post_only($isPost);
        db()->prepare('UPDATE users SET name = ? WHERE id = ?')->execute([clean((string) ($b['name'] ?? ''), 120), $me['id']]);
        json_out(200, ['ok' => true]);

    // ── Analytics ───────────────────────────────────────────────────────────
    case 'overview':
        json_out(200, overview());
    case 'pages':
        json_out(200, pages_report());
    case 'events':
        json_out(200, events_report());
    case 'realtime':
        json_out(200, realtime());
    case 'journey':
        json_out(200, journey(valid_id((string) ($_GET['visitor'] ?? ''))));
    case 'export_daily':
        [$from, $to] = date_range();
        csv_out("atrium-traffic-$from-to-$to.csv", ['Day', 'Visitors', 'Pageviews', 'Sessions', 'Conversions'], series($from, $to));
    case 'export_pages':
        $r = pages_report();
        csv_out('atrium-pages-' . $r['range']['from'] . '-to-' . $r['range']['to'] . '.csv',
            ['Path', 'Title', 'Views', 'Visitors', 'Avg time (s)', 'Avg scroll %', 'Entries', 'Exits', 'Bounce rate %', 'Conversions'], $r['pages']);

    // ── Inbox (contact form) ────────────────────────────────────────────────
    case 'inbox':
        $rows = rows('SELECT id, created_at, form, name, email, phone, business, interest, status, LEFT(message, 160) preview FROM contacts ORDER BY id DESC LIMIT 1000');
        json_out(200, ['items' => array_map(static fn ($r) => array_merge($r, ['id' => (int) $r['id'], 'created_at' => utc_iso($r['created_at'])]), $rows), 'statuses' => INBOX_STATUSES]);

    case 'inbox_get':
        $r = one('SELECT * FROM contacts WHERE id = ?', [$id]);
        if (!$r) {
            json_out(404, ['error' => 'not_found']);
        }
        unset($r['ip_hash']);
        $r['id'] = (int) $r['id'];
        $r['created_at'] = utc_iso($r['created_at']);
        json_out(200, ['item' => $r, 'journey' => journey($r['visitor']), 'statuses' => INBOX_STATUSES]);

    case 'inbox_update':
        post_only($isPost);
        need('editor', $me);
        if (isset($b['status'])) {
            if (!in_array($b['status'], INBOX_STATUSES, true)) {
                json_out(422, ['error' => 'status']);
            }
            db()->prepare('UPDATE contacts SET status = ? WHERE id = ?')->execute([$b['status'], $id]);
        }
        if (isset($b['notes'])) {
            db()->prepare('UPDATE contacts SET notes = ? WHERE id = ?')->execute([clean((string) $b['notes'], 5000), $id]);
        }
        json_out(200, ['ok' => true]);

    case 'inbox_delete':
        post_only($isPost);
        need('editor', $me);
        db()->prepare('DELETE FROM contacts WHERE id = ?')->execute([$id]);
        log_activity($me, 'inbox.delete', "#$id");
        json_out(200, ['ok' => true]);

    case 'inbox_export':
        csv_out('atrium-contact-messages.csv',
            ['ID', 'Received (UTC)', 'Status', 'Name', 'Email', 'Phone', 'Business', 'Interest', 'Locations', 'Budget', 'Message', 'Page', 'Notes'],
            rows('SELECT id, created_at, status, name, email, phone, business, interest, locations, budget, message, page, notes FROM contacts ORDER BY id DESC'));

    // ── Careers ─────────────────────────────────────────────────────────────
    case 'apps':
        $rows = rows('SELECT id, created_at, job, name, email, phone, status, cv_file IS NOT NULL has_cv FROM applications ORDER BY created_at DESC');
        json_out(200, ['items' => array_map(static fn ($r) => array_merge($r, ['id' => (int) $r['id'], 'has_cv' => (int) $r['has_cv'], 'created_at' => utc_iso($r['created_at'])]), $rows), 'statuses' => CAREER_STATUSES]);

    case 'app_get':
        $r = one('SELECT id, created_at, job, name, email, phone, status, data, notes, visitor, cv_file IS NOT NULL has_cv FROM applications WHERE id = ?', [$id]);
        if (!$r) {
            json_out(404, ['error' => 'not_found']);
        }
        $r['id'] = (int) $r['id'];
        $r['has_cv'] = (int) $r['has_cv'];
        $r['created_at'] = utc_iso($r['created_at']);
        $r['data'] = json_decode($r['data'], true);
        json_out(200, ['item' => $r, 'journey' => journey((string) $r['visitor']), 'statuses' => CAREER_STATUSES]);

    case 'app_update':
        post_only($isPost);
        need('editor', $me);
        if (isset($b['status'])) {
            if (!in_array($b['status'], CAREER_STATUSES, true)) {
                json_out(422, ['error' => 'status']);
            }
            db()->prepare('UPDATE applications SET status = ? WHERE id = ?')->execute([$b['status'], $id]);
        }
        if (isset($b['notes'])) {
            db()->prepare('UPDATE applications SET notes = ? WHERE id = ?')->execute([clean((string) $b['notes'], 5000), $id]);
        }
        json_out(200, ['ok' => true]);

    case 'app_delete':
        post_only($isPost);
        need('editor', $me);
        $file = one('SELECT cv_file FROM applications WHERE id = ?', [$id])['cv_file'] ?? null;
        if ($file) {
            @unlink(CV_DIR . '/' . basename((string) $file));
        }
        db()->prepare('DELETE FROM applications WHERE id = ?')->execute([$id]);
        log_activity($me, 'careers.delete', "#$id");
        json_out(200, ['ok' => true]);

    case 'cv':
        $r = one('SELECT name, cv_file FROM applications WHERE id = ?', [$id]);
        $path = $r && $r['cv_file'] ? CV_DIR . '/' . basename($r['cv_file']) : '';
        if ($path === '' || !is_file($path)) {
            json_out(404, ['error' => 'not_found']);
        }
        $download = 'CV - ' . preg_replace('/[^\p{L}\p{N} ._-]/u', '', $r['name']) . '.pdf';
        header('Content-Type: application/pdf');
        header("Content-Disposition: inline; filename*=UTF-8''" . rawurlencode($download));
        header('Content-Length: ' . filesize($path));
        readfile($path);
        exit;

    case 'apps_export':
        $out = [];
        foreach (rows('SELECT id, created_at, job, status, name, email, phone, cv_file IS NOT NULL has_cv, notes, data FROM applications ORDER BY id DESC') as $r) {
            $answers = [];
            foreach ((json_decode($r['data'], true)['sections'] ?? []) as $sec) {
                foreach ($sec['items'] ?? [] as $it) {
                    if (($it['value'] ?? '') !== '') {
                        $answers[] = $it['label'] . ': ' . $it['value'];
                    }
                }
            }
            unset($r['data']);
            $r['has_cv'] = $r['has_cv'] ? 'yes' : 'no';
            $r['answers'] = implode("\n", $answers);
            $out[] = $r;
        }
        csv_out('atrium-job-applications.csv', ['ID', 'Received (UTC)', 'Job', 'Status', 'Name', 'Email', 'Phone', 'CV', 'Notes', 'Answers'], $out);

    // ── Team ────────────────────────────────────────────────────────────────
    case 'users':
        need('owner', $me);
        $rows = rows('SELECT id, email, name, role, created_at, last_login FROM users ORDER BY id');
        json_out(200, ['items' => array_map(static fn ($r) => array_merge($r, ['id' => (int) $r['id'], 'created_at' => utc_iso($r['created_at']), 'last_login' => utc_iso($r['last_login'])]), $rows), 'roles' => ROLES]);

    case 'user_create':
        post_only($isPost);
        need('owner', $me);
        $email = mb_strtolower(clean((string) ($b['email'] ?? ''), 200));
        $role = (string) ($b['role'] ?? 'viewer');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !in_array($role, ROLES, true)) {
            json_out(422, ['error' => 'invalid']);
        }
        if (one('SELECT id FROM users WHERE email = ?', [$email])) {
            json_out(409, ['error' => 'exists']);
        }
        $temp = temp_password();
        db()->prepare('INSERT INTO users (email, name, role, pass_hash) VALUES (?, ?, ?, ?)')
            ->execute([$email, clean((string) ($b['name'] ?? ''), 120), $role, password_hash($temp, PASSWORD_DEFAULT)]);
        log_activity($me, 'team.add', "$email ($role)");
        json_out(200, ['ok' => true, 'temp_password' => $temp]);

    case 'user_update':
        post_only($isPost);
        need('owner', $me);
        $target = one('SELECT id, role FROM users WHERE id = ?', [$id]);
        if (!$target) {
            json_out(404, ['error' => 'not_found']);
        }
        if (isset($b['role'])) {
            if (!in_array($b['role'], ROLES, true)) {
                json_out(422, ['error' => 'invalid']);
            }
            $owners = (int) db()->query("SELECT COUNT(*) FROM users WHERE role = 'owner'")->fetchColumn();
            if ($target['role'] === 'owner' && $b['role'] !== 'owner' && $owners <= 1) {
                json_out(409, ['error' => 'last_owner']);
            }
            db()->prepare('UPDATE users SET role = ? WHERE id = ?')->execute([$b['role'], $id]);
            log_activity($me, 'team.role', "#$id → {$b['role']}");
        }
        if (!empty($b['reset'])) {
            $temp = temp_password();
            db()->prepare('UPDATE users SET pass_hash = ? WHERE id = ?')->execute([password_hash($temp, PASSWORD_DEFAULT), $id]);
            json_out(200, ['ok' => true, 'temp_password' => $temp]);
        }
        json_out(200, ['ok' => true]);

    case 'user_delete':
        post_only($isPost);
        need('owner', $me);
        if ($id === (int) $me['id']) {
            json_out(409, ['error' => 'self']);
        }
        $gone = one('SELECT email FROM users WHERE id = ?', [$id]);
        db()->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
        log_activity($me, 'team.remove', (string) ($gone['email'] ?? $id));
        json_out(200, ['ok' => true]);

    // ── Settings ────────────────────────────────────────────────────────────
    case 'settings':
        need('owner', $me);
        json_out(200, ['settings' => settings(), 'your_ip' => client_ip(), 'timezones' => DateTimeZone::listIdentifiers()]);

    case 'settings_save':
        post_only($isPost);
        need('owner', $me);
        $s = $b['settings'] ?? [];
        if (!is_array($s)) {
            json_out(422, ['error' => 'invalid']);
        }
        foreach (SETTING_DEFAULTS as $k => $_) {
            if (!array_key_exists($k, $s)) {
                continue;
            }
            $v = clean((string) $s[$k], 1000);
            if ($k === 'timezone' && !in_array($v, DateTimeZone::listIdentifiers(), true)) {
                json_out(422, ['error' => 'timezone']);
            }
            if ($k === 'notify_email' && $v !== '') {
                foreach (array_map('trim', explode(',', $v)) as $addr) {
                    if (!filter_var($addr, FILTER_VALIDATE_EMAIL)) {
                        json_out(422, ['error' => 'email']);
                    }
                }
            }
            db()->prepare('REPLACE INTO settings (k, v) VALUES (?, ?)')->execute([$k, $v]);
        }
        log_activity($me, 'settings.save');
        json_out(200, ['ok' => true]);

    case 'test_email':
        post_only($isPost);
        need('owner', $me);
        $sent = notify('test', 'Test notification from your website dashboard', "This is a test from https://www.atriumad.com/admin.\nNew contact messages and job applications will arrive like this.");
        json_out($sent ? 200 : 400, ['ok' => $sent]);
}

require __DIR__ . '/admin_cms.php';

json_out(400, ['error' => 'action']);

function temp_password(): string
{
    $alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $s = '';
    for ($i = 0; $i < 14; $i++) {
        $s .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    }
    return $s;
}
