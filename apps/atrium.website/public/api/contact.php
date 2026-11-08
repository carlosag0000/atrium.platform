<?php
// POST JSON from the /contact form: {name, email, phone, business, interest, locations, budget, message, page, v, s, website(honeypot)}.
declare(strict_types=1);
require __DIR__ . '/lib.php';

require_post();
$b = json_body();

// Bots fill the hidden field; pretend it worked.
if (trim((string) ($b['website'] ?? '')) !== '') {
    json_out(200, ['ok' => true]);
}
if (over_limit('contact', 5, 60)) {
    json_out(429, ['error' => 'too_many']);
}

$f = [
    'name' => clean((string) ($b['name'] ?? ''), 160),
    'email' => clean((string) ($b['email'] ?? ''), 200),
    'phone' => clean((string) ($b['phone'] ?? ''), 60),
    'business' => clean((string) ($b['business'] ?? ''), 200),
    'interest' => clean((string) ($b['interest'] ?? ''), 120),
    'locations' => clean((string) ($b['locations'] ?? ''), 40),
    'budget' => clean((string) ($b['budget'] ?? ''), 40),
    'message' => clean((string) ($b['message'] ?? ''), 5000),
    'page' => clean((string) ($b['page'] ?? ''), 255),
];
$visitor = valid_id((string) ($b['v'] ?? ''));
$session = valid_id((string) ($b['s'] ?? ''));

if (mb_strlen($f['name']) < 2 || !filter_var($f['email'], FILTER_VALIDATE_EMAIL) || mb_strlen($f['message']) < 5) {
    json_out(422, ['error' => 'invalid']);
}

db()->prepare('INSERT INTO contacts (form, name, email, phone, business, interest, locations, budget, message, page, visitor, ip_hash)
    VALUES (\'contact\', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    ->execute([$f['name'], $f['email'], $f['phone'], $f['business'], $f['interest'], $f['locations'], $f['budget'], $f['message'], $f['page'], $visitor, ip_hash()]);
$id = (int) db()->lastInsertId();
record_event('form_submit', 'contact', $visitor, $session, $f['page'] ?: '/contact');

$lines = [
    'New message from the contact form on www.atriumad.com',
    '',
    'Name: ' . $f['name'],
    'Email: ' . $f['email'],
    'Phone: ' . ($f['phone'] ?: '-'),
    'Business: ' . ($f['business'] ?: '-'),
    'Interested in: ' . ($f['interest'] ?: '-'),
    'Locations: ' . ($f['locations'] ?: '-'),
    'Monthly budget: ' . ($f['budget'] ?: '-'),
    '',
    $f['message'],
    '',
    'Open in the dashboard: https://www.atriumad.com/admin#forms/contact/' . $id,
];
notify('contact', 'New website message: ' . $f['name'] . ($f['business'] ? ' (' . $f['business'] . ')' : ''), implode("\n", $lines));

json_out(200, ['ok' => true]);
