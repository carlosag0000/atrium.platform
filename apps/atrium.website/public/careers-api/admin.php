<?php
// Admin API for the careers page. ?action=login|logout|me|list|get|update|cv
declare(strict_types=1);
require __DIR__ . '/lib.php';

const STATUSES = ['nuevo', 'revisar', 'entrevista', 'finalista', 'descartado', 'contratado'];

$action = (string) ($_GET['action'] ?? '');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($action === 'login') {
    if ($method !== 'POST') {
        json_out(405, ['error' => 'method']);
    }
    require_same_origin();
    if (over_limit('login_fail', 8, 15, false)) {
        json_out(429, ['error' => 'too_many']);
    }
    $body = json_decode((string) file_get_contents('php://input'), true);
    $password = is_array($body) ? (string) ($body['password'] ?? '') : '';
    $given = hash('sha256', $config['salt'] . '|' . $password);
    if (!hash_equals($config['admin_password_sha256'], $given)) {
        over_limit('login_fail', 8, 15, true);
        usleep(400000);
        json_out(401, ['error' => 'wrong_password']);
    }
    start_admin_session();
    session_regenerate_id(true);
    $_SESSION['admin'] = true;
    $_SESSION['expires'] = time() + 8 * 3600;
    json_out(200, ['ok' => true]);
}

if ($action === 'logout') {
    start_admin_session();
    $_SESSION = [];
    session_destroy();
    json_out(200, ['ok' => true]);
}

require_admin();

if ($action === 'me') {
    json_out(200, ['ok' => true]);
}

if ($action === 'list') {
    $rows = db()->query('SELECT id, created_at, job, name, email, phone, status, cv_file IS NOT NULL AS has_cv FROM applications ORDER BY created_at DESC')->fetchAll();
    json_out(200, ['applications' => $rows, 'statuses' => STATUSES]);
}

$id = (int) ($_GET['id'] ?? 0);

if ($action === 'get') {
    $q = db()->prepare('SELECT id, created_at, job, name, email, phone, status, data, notes, cv_file IS NOT NULL AS has_cv FROM applications WHERE id = ?');
    $q->execute([$id]);
    $row = $q->fetch();
    if (!$row) {
        json_out(404, ['error' => 'not_found']);
    }
    $row['data'] = json_decode($row['data'], true);
    json_out(200, ['application' => $row, 'statuses' => STATUSES]);
}

if ($action === 'update') {
    if ($method !== 'POST') {
        json_out(405, ['error' => 'method']);
    }
    require_same_origin();
    $body = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($body)) {
        json_out(422, ['error' => 'invalid']);
    }
    if (isset($body['status'])) {
        if (!in_array($body['status'], STATUSES, true)) {
            json_out(422, ['error' => 'status']);
        }
        db()->prepare('UPDATE applications SET status = ? WHERE id = ?')->execute([$body['status'], $id]);
    }
    if (isset($body['notes'])) {
        db()->prepare('UPDATE applications SET notes = ? WHERE id = ?')->execute([mb_substr((string) $body['notes'], 0, 5000), $id]);
    }
    json_out(200, ['ok' => true]);
}

if ($action === 'delete') {
    if ($method !== 'POST') {
        json_out(405, ['error' => 'method']);
    }
    require_same_origin();
    $q = db()->prepare('SELECT cv_file FROM applications WHERE id = ?');
    $q->execute([$id]);
    $file = $q->fetchColumn();
    if ($file) {
        @unlink(UPLOAD_DIR . '/' . basename((string) $file));
    }
    db()->prepare('DELETE FROM applications WHERE id = ?')->execute([$id]);
    json_out(200, ['ok' => true]);
}

if ($action === 'cv') {
    $q = db()->prepare('SELECT name, cv_file FROM applications WHERE id = ?');
    $q->execute([$id]);
    $row = $q->fetch();
    $path = $row && $row['cv_file'] ? UPLOAD_DIR . '/' . basename($row['cv_file']) : '';
    if ($path === '' || !is_file($path)) {
        json_out(404, ['error' => 'not_found']);
    }
    $download = 'CV - ' . preg_replace('/[^\p{L}\p{N} ._-]/u', '', $row['name']) . '.pdf';
    header('Content-Type: application/pdf');
    header("Content-Disposition: inline; filename*=UTF-8''" . rawurlencode($download));
    header('Content-Length: ' . filesize($path));
    readfile($path);
    exit;
}

json_out(400, ['error' => 'action']);
