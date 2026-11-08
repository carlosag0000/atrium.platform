<?php
// Public side of the form builder (Forms → New form). The page /forms?f=<slug> loads a form with
// GET ?slug=… and sends answers with POST ?slug=… (JSON {answers: {fieldId: value}, v, s, website}).
declare(strict_types=1);
require __DIR__ . '/lib.php';

const FIELD_TYPES = ['text', 'textarea', 'email', 'phone', 'number', 'date', 'select', 'radio', 'checkbox', 'yesno', 'section'];

$slug = preg_replace('/[^a-z0-9-]/', '', strtolower((string) ($_GET['slug'] ?? ''))) ?? '';
$q = db()->prepare("SELECT id, slug, title, description, fields, settings, status FROM forms WHERE slug = ?");
$q->execute([$slug]);
$form = $q->fetch();
if (!$form || $form['status'] === 'draft') {
    json_out(404, ['error' => 'not_found']);
}
$fields = json_decode($form['fields'], true) ?: [];
$settings = json_decode($form['settings'], true) ?: [];

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    json_out(200, [
        'form' => [
            'slug' => $form['slug'],
            'title' => $form['title'],
            'description' => (string) $form['description'],
            'fields' => $fields,
            'open' => $form['status'] === 'live',
            'submit_label' => (string) ($settings['submit_label'] ?? 'Send'),
            'success_title' => (string) ($settings['success_title'] ?? 'Thank you!'),
            'success_message' => (string) ($settings['success_message'] ?? "We've received your answers."),
            'closed_message' => (string) ($settings['closed_message'] ?? 'This form is no longer accepting answers.'),
        ],
    ]);
}

require_post();
if ($form['status'] !== 'live') {
    json_out(409, ['error' => 'closed']);
}
$b = json_body();
if (trim((string) ($b['website'] ?? '')) !== '') {
    json_out(200, ['ok' => true]);
}
if (over_limit('form', 10, 60)) {
    json_out(429, ['error' => 'too_many']);
}

$answers = is_array($b['answers'] ?? null) ? $b['answers'] : [];
$out = [];
$name = '';
$email = '';
$errors = [];
foreach ($fields as $f) {
    $type = (string) ($f['type'] ?? 'text');
    if ($type === 'section' || !in_array($type, FIELD_TYPES, true)) {
        continue;
    }
    $id = (string) ($f['id'] ?? '');
    $label = (string) ($f['label'] ?? $id);
    $raw = $answers[$id] ?? '';
    $options = array_map('strval', is_array($f['options'] ?? null) ? $f['options'] : []);
    if ($type === 'checkbox') {
        $vals = array_values(array_filter(array_map('strval', is_array($raw) ? $raw : []), static fn ($v) => in_array($v, $options, true)));
        $value = implode(', ', $vals);
    } else {
        $value = clean(is_scalar($raw) ? (string) $raw : '', $type === 'textarea' ? 10000 : 500);
        if ($value !== '' && in_array($type, ['select', 'radio'], true) && !in_array($value, $options, true)) {
            $value = '';
        }
        if ($value !== '' && $type === 'yesno' && !in_array($value, ['Yes', 'No'], true)) {
            $value = '';
        }
        if ($value !== '' && $type === 'email' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            $errors[] = $id;
        }
        if ($value !== '' && $type === 'number' && !is_numeric($value)) {
            $errors[] = $id;
        }
        if ($value !== '' && $type === 'date' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            $errors[] = $id;
        }
    }
    if (!empty($f['required']) && $value === '') {
        $errors[] = $id;
    }
    if ($type === 'email' && $email === '' && $value !== '') {
        $email = $value;
    }
    if ($name === '' && $value !== '' && preg_match('/\bname\b|nombre/i', $label)) {
        $name = mb_substr($value, 0, 200);
    }
    $out[] = ['id' => $id, 'label' => $label, 'value' => $value];
}
if ($errors) {
    json_out(422, ['error' => 'invalid', 'fields' => array_values(array_unique($errors))]);
}

$visitor = valid_id((string) ($b['v'] ?? ''));
$session = valid_id((string) ($b['s'] ?? ''));
db()->prepare('INSERT INTO form_submissions (form_id, name, email, data, visitor, ip_hash) VALUES (?, ?, ?, ?, ?, ?)')
    ->execute([$form['id'], $name, $email, json_encode($out, JSON_UNESCAPED_UNICODE), $visitor, ip_hash()]);
$sid = (int) db()->lastInsertId();
record_event('form_submit', $form['slug'], $visitor, $session, '/forms');

// Email the people listed on this form (or the site-wide notification address).
$to = trim((string) ($settings['notify'] ?? '')) ?: trim(settings()['notify_email']);
if ($to !== '') {
    $lines = ['New answers to "' . $form['title'] . '" on www.atriumad.com', ''];
    foreach ($out as $o) {
        $lines[] = $o['label'] . ': ' . ($o['value'] !== '' ? $o['value'] : '-');
    }
    $lines[] = '';
    $lines[] = 'Open in the dashboard: https://www.atriumad.com/admin#forms/f' . $form['id'] . '/' . $sid;
    foreach (array_filter(array_map('trim', explode(',', $to))) as $addr) {
        if (filter_var($addr, FILTER_VALIDATE_EMAIL)) {
            @mail($addr, '=?UTF-8?B?' . base64_encode('New form answers: ' . $form['title']) . '?=', implode("\n", $lines),
                ['From' => 'Atrium Website <no-reply@atriumad.com>', 'Content-Type' => 'text/plain; charset=UTF-8'], '-fno-reply@atriumad.com');
        }
    }
}

json_out(200, ['ok' => true]);
