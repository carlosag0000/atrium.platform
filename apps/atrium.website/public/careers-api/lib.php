<?php
// Shared helpers for the careers API (applications + admin). Runs on Hostinger PHP.
// Secrets live in config.php on the server only (see config.example.php); it is never committed.

declare(strict_types=1);

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'lib.php') {
    http_response_code(404);
    exit;
}

$config = require __DIR__ . '/config.php';

header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

const UPLOAD_DIR = __DIR__ . '/uploads';
const MAX_CV_BYTES = 5 * 1024 * 1024;

function db(): PDO
{
    static $pdo = null;
    global $config;
    if ($pdo === null) {
        $pdo = new PDO(
            'mysql:host=127.0.0.1;port=3306;dbname=' . $config['db_name'] . ';charset=utf8mb4',
            $config['db_user'],
            $config['db_pass'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
        );
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
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $pdo->exec("CREATE TABLE IF NOT EXISTS rate_events (
            ip_hash CHAR(64) NOT NULL,
            kind VARCHAR(20) NOT NULL,
            at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX (ip_hash, kind, at)
        ) CHARACTER SET utf8mb4");
    }
    return $pdo;
}

function json_out(int $status, array $body): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

function ip_hash(): string
{
    global $config;
    return hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|' . $config['salt']);
}

/** Records an event and reports whether the caller is over `$max` events of `$kind` in `$minutes`. */
function over_limit(string $kind, int $max, int $minutes, bool $record = true): bool
{
    $pdo = db();
    $pdo->exec('DELETE FROM rate_events WHERE at < NOW() - INTERVAL 1 DAY');
    $q = $pdo->prepare('SELECT COUNT(*) FROM rate_events WHERE ip_hash = ? AND kind = ? AND at > NOW() - INTERVAL ' . (int) $minutes . ' MINUTE');
    $q->execute([ip_hash(), $kind]);
    $count = (int) $q->fetchColumn();
    if ($record) {
        $pdo->prepare('INSERT INTO rate_events (ip_hash, kind) VALUES (?, ?)')->execute([ip_hash(), $kind]);
    }
    return $count >= $max;
}

function start_admin_session(): void
{
    session_name('atrium_careers');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/careers-api/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
}

function require_admin(): void
{
    start_admin_session();
    if (empty($_SESSION['admin']) || ($_SESSION['expires'] ?? 0) < time()) {
        json_out(401, ['error' => 'auth']);
    }
    $_SESSION['expires'] = time() + 8 * 3600;
}

function require_same_origin(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '' && !in_array($origin, ['https://www.atriumad.com', 'https://atriumad.com'], true)) {
        json_out(403, ['error' => 'origin']);
    }
}
