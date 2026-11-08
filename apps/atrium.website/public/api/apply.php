<?php
// POST multipart/form-data from the careers form.
// Fields: job, name, email, phone, answers (JSON), cv (optional PDF), v, s (visitor/session ids), website (honeypot).
declare(strict_types=1);
require __DIR__ . '/lib.php';

require_post();

// Bots fill the hidden field; pretend it worked.
if (trim((string) ($_POST['website'] ?? '')) !== '') {
    json_out(200, ['ok' => true]);
}
if (over_limit('apply', 5, 60)) {
    json_out(429, ['error' => 'too_many']);
}

$job = preg_replace('/[^a-z0-9-]/', '', strtolower((string) ($_POST['job'] ?? '')));
$name = clean((string) ($_POST['name'] ?? ''), 160);
$email = clean((string) ($_POST['email'] ?? ''), 200);
$phone = clean((string) ($_POST['phone'] ?? ''), 60);
$answers = json_decode((string) ($_POST['answers'] ?? ''), true);
$visitor = valid_id((string) ($_POST['v'] ?? ''));
$session = valid_id((string) ($_POST['s'] ?? ''));

if ($job === '' || mb_strlen($name) < 2 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_out(422, ['error' => 'invalid']);
}
if (!is_array($answers) || strlen((string) $_POST['answers']) > 60000) {
    json_out(422, ['error' => 'invalid']);
}

$cvFile = null;
if (!empty($_FILES['cv']) && ($_FILES['cv']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
    $f = $_FILES['cv'];
    if ($f['error'] !== UPLOAD_ERR_OK || $f['size'] > MAX_CV_BYTES) {
        json_out(422, ['error' => 'cv']);
    }
    $head = (string) file_get_contents($f['tmp_name'], false, null, 0, 5);
    if ($head !== '%PDF-') {
        json_out(422, ['error' => 'cv']);
    }
    if (!is_dir(CV_DIR)) {
        mkdir(CV_DIR, 0750, true);
    }
    $cvFile = bin2hex(random_bytes(16)) . '.pdf';
    if (!move_uploaded_file($f['tmp_name'], CV_DIR . '/' . $cvFile)) {
        json_out(500, ['error' => 'cv_save']);
    }
}

db()->prepare('INSERT INTO applications (job, name, email, phone, data, cv_file, ip_hash, visitor) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    ->execute([$job, $name, $email, $phone, json_encode($answers, JSON_UNESCAPED_UNICODE), $cvFile, ip_hash(), $visitor]);
$id = (int) db()->lastInsertId();
record_event('application_submit', $job, $visitor, $session, '/careers');

notify('application', 'New job application: ' . $name, implode("\n", [
    'New application on www.atriumad.com',
    '',
    'Job: ' . $job,
    'Name: ' . $name,
    'Email: ' . $email,
    'Phone: ' . ($phone ?: '-'),
    'CV attached: ' . ($cvFile ? 'yes' : 'no'),
    '',
    'Open in the dashboard: https://www.atriumad.com/admin#forms/careers/' . $id,
]));

json_out(200, ['ok' => true]);
