<?php
// Shared helpers for the website backend (visit tracking, forms, dashboard). Runs on Hostinger PHP 8.3.
// Secrets live in config.php on the server only (see config.example.php); it is never committed.

declare(strict_types=1);

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'lib.php') {
    http_response_code(404);
    exit;
}

$config = require __DIR__ . '/config.php';

// Public pages rendered by render.php must stay indexable; every API response is private.
if (!defined('PUBLIC_PAGE')) {
    header('X-Robots-Tag: noindex, nofollow');
    header('Cache-Control: no-store');
    header('Referrer-Policy: same-origin');
}
header('X-Content-Type-Options: nosniff');

const SCHEMA_VERSION = '4';
// CVs from the careers form live next to the original careers endpoint, behind "Require all denied".
define('CV_DIR', dirname(__DIR__) . '/careers-api/uploads');
const MAX_CV_BYTES = 5 * 1024 * 1024;
const SITE_ORIGINS = ['https://www.atriumad.com', 'https://atriumad.com'];

function db(): PDO
{
    static $pdo = null;
    global $config;
    if ($pdo !== null) {
        return $pdo;
    }
    $pdo = new PDO(
        'mysql:host=127.0.0.1;port=3306;dbname=' . $config['db_name'] . ';charset=utf8mb4',
        $config['db_user'],
        $config['db_pass'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
    $pdo->exec("SET time_zone = '+00:00'");
    $version = null;
    try {
        $version = $pdo->query("SELECT v FROM settings WHERE k = 'schema'")->fetchColumn();
    } catch (PDOException $e) {
        $version = null;
    }
    if ($version !== SCHEMA_VERSION) {
        migrate($pdo);
    }
    return $pdo;
}

function migrate(PDO $pdo): void
{
    $t = 'CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci';
    $pdo->exec("CREATE TABLE IF NOT EXISTS settings (k VARCHAR(60) PRIMARY KEY, v TEXT NOT NULL) $t");
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(200) NOT NULL UNIQUE,
        name VARCHAR(120) NOT NULL DEFAULT '',
        role VARCHAR(10) NOT NULL DEFAULT 'viewer',
        pass_hash VARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME NULL
    ) $t");
    $pdo->exec("CREATE TABLE IF NOT EXISTS pageviews (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        pv CHAR(16) NOT NULL,
        ts DATETIME NOT NULL,
        last_seen DATETIME NOT NULL,
        day DATE NOT NULL,
        hour TINYINT UNSIGNED NOT NULL,
        visitor CHAR(16) NOT NULL,
        session CHAR(16) NOT NULL,
        is_new TINYINT(1) NOT NULL DEFAULT 0,
        is_entry TINYINT(1) NOT NULL DEFAULT 0,
        path VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL DEFAULT '',
        ref_host VARCHAR(190) NOT NULL DEFAULT '',
        ref VARCHAR(500) NOT NULL DEFAULT '',
        channel VARCHAR(20) NOT NULL DEFAULT 'Direct',
        utm_source VARCHAR(120) NOT NULL DEFAULT '',
        utm_medium VARCHAR(120) NOT NULL DEFAULT '',
        utm_campaign VARCHAR(120) NOT NULL DEFAULT '',
        country CHAR(2) NOT NULL DEFAULT '',
        tz VARCHAR(64) NOT NULL DEFAULT '',
        lang VARCHAR(16) NOT NULL DEFAULT '',
        device VARCHAR(10) NOT NULL DEFAULT '',
        browser VARCHAR(30) NOT NULL DEFAULT '',
        os VARCHAR(30) NOT NULL DEFAULT '',
        screen SMALLINT UNSIGNED NOT NULL DEFAULT 0,
        duration INT UNSIGNED NOT NULL DEFAULT 0,
        scroll TINYINT UNSIGNED NOT NULL DEFAULT 0,
        UNIQUE KEY (pv), INDEX (ts), INDEX (day), INDEX (visitor), INDEX (session), INDEX (path(100)), INDEX (last_seen)
    ) $t");
    $pdo->exec("CREATE TABLE IF NOT EXISTS events (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        ts DATETIME NOT NULL,
        day DATE NOT NULL,
        visitor CHAR(16) NOT NULL DEFAULT '',
        session CHAR(16) NOT NULL DEFAULT '',
        path VARCHAR(255) NOT NULL DEFAULT '',
        name VARCHAR(40) NOT NULL,
        label VARCHAR(255) NOT NULL DEFAULT '',
        INDEX (day), INDEX (name), INDEX (visitor), INDEX (session)
    ) $t");
    $pdo->exec("CREATE TABLE IF NOT EXISTS contacts (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        form VARCHAR(40) NOT NULL DEFAULT 'contact',
        name VARCHAR(160) NOT NULL,
        email VARCHAR(200) NOT NULL,
        phone VARCHAR(60) NOT NULL DEFAULT '',
        business VARCHAR(200) NOT NULL DEFAULT '',
        interest VARCHAR(120) NOT NULL DEFAULT '',
        locations VARCHAR(40) NOT NULL DEFAULT '',
        budget VARCHAR(40) NOT NULL DEFAULT '',
        message TEXT NOT NULL,
        page VARCHAR(255) NOT NULL DEFAULT '',
        visitor CHAR(16) NOT NULL DEFAULT '',
        status VARCHAR(20) NOT NULL DEFAULT 'new',
        notes TEXT NULL,
        ip_hash CHAR(64) NOT NULL DEFAULT '',
        INDEX (created_at), INDEX (status)
    ) $t");
    // The careers tables already exist on the live server; create them on a fresh install.
    $pdo->exec("CREATE TABLE IF NOT EXISTS applications (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        job VARCHAR(80) NOT NULL,
        name VARCHAR(160) NOT NULL,
        email VARCHAR(200) NOT NULL,
        phone VARCHAR(60) NOT NULL DEFAULT '',
        status VARCHAR(20) NOT NULL DEFAULT 'nuevo',
        data LONGTEXT NOT NULL,
        cv_file VARCHAR(120) NULL,
        notes TEXT NULL,
        ip_hash CHAR(64) NOT NULL,
        INDEX (job), INDEX (created_at)
    ) $t");
    $pdo->exec("CREATE TABLE IF NOT EXISTS rate_events (
        ip_hash CHAR(64) NOT NULL,
        kind VARCHAR(20) NOT NULL,
        at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX (ip_hash, kind, at)
    ) CHARACTER SET utf8mb4");
    // CMS, forms, media, redirects, activity (schema 4).
    $pdo->exec("CREATE TABLE IF NOT EXISTS cms_entries (
        k VARCHAR(191) PRIMARY KEY,
        path VARCHAR(191) NOT NULL,
        kind VARCHAR(10) NOT NULL DEFAULT 'text',
        published MEDIUMTEXT NULL,
        draft MEDIUMTEXT NULL,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_by VARCHAR(200) NOT NULL DEFAULT '',
        INDEX (path)
    ) $t");
    $pdo->exec("CREATE TABLE IF NOT EXISTS cms_revisions (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        ts DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        user_email VARCHAR(200) NOT NULL DEFAULT '',
        path VARCHAR(191) NOT NULL,
        note VARCHAR(255) NOT NULL DEFAULT '',
        data MEDIUMTEXT NOT NULL,
        INDEX (path)
    ) $t");
    $pdo->exec("CREATE TABLE IF NOT EXISTS redirects (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        from_path VARCHAR(191) NOT NULL UNIQUE,
        to_url VARCHAR(500) NOT NULL,
        code SMALLINT UNSIGNED NOT NULL DEFAULT 301,
        hits INT UNSIGNED NOT NULL DEFAULT 0,
        last_hit DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) $t");
    $pdo->exec("CREATE TABLE IF NOT EXISTS not_found (
        path VARCHAR(191) PRIMARY KEY,
        hits INT UNSIGNED NOT NULL DEFAULT 1,
        first_seen DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_seen DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        referrer VARCHAR(500) NOT NULL DEFAULT ''
    ) $t");
    $pdo->exec("CREATE TABLE IF NOT EXISTS media (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        file VARCHAR(120) NOT NULL,
        original VARCHAR(255) NOT NULL DEFAULT '',
        mime VARCHAR(60) NOT NULL,
        size INT UNSIGNED NOT NULL,
        width INT UNSIGNED NOT NULL DEFAULT 0,
        height INT UNSIGNED NOT NULL DEFAULT 0,
        alt VARCHAR(255) NOT NULL DEFAULT '',
        uploaded_by VARCHAR(200) NOT NULL DEFAULT ''
    ) $t");
    $pdo->exec("CREATE TABLE IF NOT EXISTS forms (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(80) NOT NULL UNIQUE,
        title VARCHAR(200) NOT NULL,
        description TEXT NULL,
        fields MEDIUMTEXT NOT NULL,
        settings TEXT NOT NULL,
        status VARCHAR(10) NOT NULL DEFAULT 'draft',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) $t");
    $pdo->exec("CREATE TABLE IF NOT EXISTS form_submissions (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        form_id INT UNSIGNED NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        name VARCHAR(200) NOT NULL DEFAULT '',
        email VARCHAR(200) NOT NULL DEFAULT '',
        data MEDIUMTEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'new',
        notes TEXT NULL,
        visitor CHAR(16) NOT NULL DEFAULT '',
        ip_hash CHAR(64) NOT NULL DEFAULT '',
        INDEX (form_id), INDEX (created_at)
    ) $t");
    $pdo->exec("CREATE TABLE IF NOT EXISTS activity (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        ts DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        user_email VARCHAR(200) NOT NULL DEFAULT '',
        action VARCHAR(60) NOT NULL,
        detail VARCHAR(500) NOT NULL DEFAULT '',
        INDEX (ts)
    ) $t");
    $cols = $pdo->query("SHOW COLUMNS FROM applications LIKE 'visitor'")->fetchAll();
    if (!$cols) {
        $pdo->exec("ALTER TABLE applications ADD COLUMN visitor CHAR(16) NOT NULL DEFAULT ''");
    }
    $pdo->prepare("REPLACE INTO settings (k, v) VALUES ('schema', ?)")->execute([SCHEMA_VERSION]);
}

// ── Settings ─────────────────────────────────────────────────────────────────

const SETTING_DEFAULTS = [
    'site_name' => 'Atrium',
    'timezone' => 'America/Chicago',
    'notify_email' => '',
    'notify_contact' => '1',
    'notify_application' => '1',
    'exclude_ips' => '',
];

function settings(): array
{
    static $cache = null;
    if ($cache === null) {
        $cache = SETTING_DEFAULTS;
        foreach (db()->query('SELECT k, v FROM settings') as $row) {
            if (array_key_exists($row['k'], SETTING_DEFAULTS)) {
                $cache[$row['k']] = $row['v'];
            }
        }
    }
    return $cache;
}

function site_tz(): DateTimeZone
{
    try {
        return new DateTimeZone(settings()['timezone']);
    } catch (Exception $e) {
        return new DateTimeZone('America/Chicago');
    }
}

// ── HTTP helpers ─────────────────────────────────────────────────────────────

function json_out(int $status, array $body): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_body(): array
{
    $body = json_decode((string) file_get_contents('php://input'), true);
    return is_array($body) ? $body : [];
}

function client_ip(): string
{
    return (string) ($_SERVER['REMOTE_ADDR'] ?? '');
}

function ip_hash(): string
{
    global $config;
    return hash('sha256', client_ip() . '|' . $config['salt']);
}

function require_same_origin(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '' && !in_array($origin, SITE_ORIGINS, true)) {
        json_out(403, ['error' => 'origin']);
    }
}

function require_post(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        json_out(405, ['error' => 'method']);
    }
    require_same_origin();
}

/** Records an event and reports whether the caller is over `$max` events of `$kind` in `$minutes`. */
function over_limit(string $kind, int $max, int $minutes, bool $record = true): bool
{
    $pdo = db();
    if (random_int(1, 50) === 1) {
        $pdo->exec('DELETE FROM rate_events WHERE at < NOW() - INTERVAL 1 DAY');
    }
    $q = $pdo->prepare('SELECT COUNT(*) FROM rate_events WHERE ip_hash = ? AND kind = ? AND at > NOW() - INTERVAL ' . (int) $minutes . ' MINUTE');
    $q->execute([ip_hash(), $kind]);
    $count = (int) $q->fetchColumn();
    if ($record) {
        $pdo->prepare('INSERT INTO rate_events (ip_hash, kind) VALUES (?, ?)')->execute([ip_hash(), $kind]);
    }
    return $count >= $max;
}

function clean(string $s, int $max): string
{
    $s = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $s) ?? '');
    return mb_substr($s, 0, $max);
}

function valid_id(string $s): string
{
    return preg_match('/^[a-z0-9]{8,16}$/', $s) ? $s : '';
}

/** Local (site timezone) date and hour for "now". */
function local_now(): array
{
    $now = new DateTimeImmutable('now', site_tz());
    return [$now->format('Y-m-d'), (int) $now->format('G')];
}

function record_event(string $name, string $label, string $visitor = '', string $session = '', string $path = ''): void
{
    [$day] = local_now();
    db()->prepare('INSERT INTO events (ts, day, visitor, session, path, name, label) VALUES (UTC_TIMESTAMP(), ?, ?, ?, ?, ?, ?)')
        ->execute([$day, $visitor, $session, mb_substr($path, 0, 255), $name, mb_substr($label, 0, 255)]);
}

function log_activity(array $user, string $action, string $detail = ''): void
{
    try {
        db()->prepare('INSERT INTO activity (user_email, action, detail) VALUES (?, ?, ?)')
            ->execute([(string) ($user['email'] ?? ''), mb_substr($action, 0, 60), mb_substr($detail, 0, 500)]);
    } catch (Throwable $e) {
        // The log must never break the action it records.
    }
}

/** The signed-in user, or null (no output, no exit). Used by render.php for draft previews. */
function current_user(): ?array
{
    if (empty($_COOKIE['atr_session'])) {
        return null;
    }
    start_admin_session();
    $uid = (int) ($_SESSION['uid'] ?? 0);
    $ok = $uid !== 0 && ($_SESSION['expires'] ?? 0) >= time();
    session_write_close();
    if (!$ok) {
        return null;
    }
    $q = db()->prepare('SELECT id, email, name, role FROM users WHERE id = ?');
    $q->execute([$uid]);
    return $q->fetch() ?: null;
}

// ── Notifications ────────────────────────────────────────────────────────────

function notify(string $kind, string $subject, string $text): bool
{
    $s = settings();
    $to = trim($s['notify_email']);
    if ($to === '' || ($kind !== 'test' && ($s['notify_' . $kind] ?? '0') !== '1')) {
        return false;
    }
    $ok = true;
    foreach (array_filter(array_map('trim', explode(',', $to))) as $addr) {
        if (!filter_var($addr, FILTER_VALIDATE_EMAIL)) {
            continue;
        }
        $headers = [
            'From' => 'Atrium Website <no-reply@atriumad.com>',
            'Content-Type' => 'text/plain; charset=UTF-8',
            'X-Mailer' => 'atrium-site',
        ];
        $ok = mail($addr, '=?UTF-8?B?' . base64_encode($subject) . '?=', $text, $headers, '-fno-reply@atriumad.com') && $ok;
    }
    return $ok;
}

// ── Dashboard auth ───────────────────────────────────────────────────────────

const ROLES = ['owner', 'editor', 'viewer'];

function start_admin_session(): void
{
    session_name('atr_session');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
}

/** Returns the signed-in user row, or sends 401. `$min` is the lowest role allowed. */
function require_user(string $min = 'viewer'): array
{
    start_admin_session();
    $uid = (int) ($_SESSION['uid'] ?? 0);
    if ($uid === 0 || ($_SESSION['expires'] ?? 0) < time()) {
        json_out(401, ['error' => 'auth']);
    }
    $q = db()->prepare('SELECT id, email, name, role FROM users WHERE id = ?');
    $q->execute([$uid]);
    $user = $q->fetch();
    if (!$user) {
        $_SESSION = [];
        json_out(401, ['error' => 'auth']);
    }
    $_SESSION['expires'] = time() + 12 * 3600;
    $rank = array_flip(array_reverse(ROLES)); // viewer 0, editor 1, owner 2
    if (($rank[$user['role']] ?? -1) < $rank[$min]) {
        json_out(403, ['error' => 'role']);
    }
    // Free the session lock so parallel dashboard requests don't queue behind each other.
    session_write_close();
    return $user;
}
