<?php
// Visit tracking for the public site. The browser sends small JSON beacons:
//   {t:'pv', id, v, s, n, e, p, q, ti, r, w, l, z}  a page view
//   {t:'ping', id, d, sc}                           engaged seconds and max scroll % for a page view
//   {t:'ev', v, s, p, n, l}                         a click or other event
// No cookies and no IP addresses are stored; v/s are random ids kept in the visitor's browser.
declare(strict_types=1);
require __DIR__ . '/lib.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(204);
    exit;
}
require_same_origin();

$ua = (string) ($_SERVER['HTTP_USER_AGENT'] ?? '');
if ($ua === '' || preg_match('/bot|crawl|spider|slurp|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|axios|node-fetch|go-http|java\//i', $ua)) {
    http_response_code(204);
    exit;
}
$excluded = array_filter(array_map('trim', explode(',', settings()['exclude_ips'])));
if ($excluded && in_array(client_ip(), $excluded, true)) {
    http_response_code(204);
    exit;
}

$b = json_decode((string) file_get_contents('php://input', false, null, 0, 8192), true);
if (!is_array($b)) {
    http_response_code(204);
    exit;
}
$type = (string) ($b['t'] ?? '');
$pdo = db();

if ($type === 'ping') {
    $id = valid_id((string) ($b['id'] ?? ''));
    if ($id !== '') {
        $d = max(0, min(3600 * 4, (int) ($b['d'] ?? 0)));
        $sc = max(0, min(100, (int) ($b['sc'] ?? 0)));
        $pdo->prepare('UPDATE pageviews SET duration = GREATEST(duration, ?), scroll = GREATEST(scroll, ?), last_seen = UTC_TIMESTAMP() WHERE pv = ?')
            ->execute([$d, $sc, $id]);
    }
    http_response_code(204);
    exit;
}

if (over_limit('hit', 400, 60)) {
    http_response_code(204);
    exit;
}

$visitor = valid_id((string) ($b['v'] ?? ''));
$session = valid_id((string) ($b['s'] ?? ''));
$path = clean((string) ($b['p'] ?? '/'), 255);
if ($visitor === '' || $session === '' || $path === '' || $path[0] !== '/') {
    http_response_code(204);
    exit;
}

if ($type === 'ev') {
    $name = preg_replace('/[^a-z0-9_]/', '', strtolower((string) ($b['n'] ?? '')));
    if ($name !== '') {
        record_event(substr($name, 0, 40), clean((string) ($b['l'] ?? ''), 255), $visitor, $session, $path);
    }
    http_response_code(204);
    exit;
}

if ($type !== 'pv') {
    http_response_code(204);
    exit;
}

$id = valid_id((string) ($b['id'] ?? ''));
if ($id === '') {
    http_response_code(204);
    exit;
}

// Referrer and campaign.
$ref = clean((string) ($b['r'] ?? ''), 500);
$refHost = '';
if ($ref !== '') {
    $refHost = strtolower((string) parse_url($ref, PHP_URL_HOST));
    $refHost = preg_replace('/^www\./', '', $refHost) ?? '';
    if ($refHost === 'atriumad.com') {
        $ref = '';
        $refHost = '';
    }
}
parse_str(ltrim(clean((string) ($b['q'] ?? ''), 500), '?'), $qs);
$utm = static fn (string $k): string => mb_strtolower(clean(is_string($qs[$k] ?? null) ? $qs[$k] : '', 120));
$utmSource = $utm('utm_source') ?: (isset($qs['gclid']) ? 'google' : (isset($qs['fbclid']) ? 'facebook' : ''));
$utmMedium = $utm('utm_medium') ?: (isset($qs['gclid']) ? 'cpc' : '');
$utmCampaign = $utm('utm_campaign');

function channel(string $host, string $source, string $medium): string
{
    if (preg_match('/^(cpc|ppc|paid|paidsearch|paidsocial|paid_social|ads?|display|cpm)$/', $medium)) {
        return 'Paid';
    }
    if (preg_match('/e-?mail|newsletter|sms/', $medium . ' ' . $source)) {
        return 'Email';
    }
    $h = $host !== '' ? $host : $source;
    if ($h === '') {
        return 'Direct';
    }
    if (preg_match('/(^|\.)(google|bing|duckduckgo|yahoo|ecosia|baidu|yandex|brave|search\.)/', $h)) {
        return 'Search';
    }
    if (preg_match('/chatgpt|openai|perplexity|claude\.ai|gemini|copilot|you\.com|phind/', $h)) {
        return 'AI';
    }
    if (preg_match('/facebook|fb\.|instagram|^t\.co$|twitter|^x\.com|linkedin|lnkd|tiktok|youtube|pinterest|reddit|threads|whatsapp|snapchat|^ig$|^fb$|^meta$/', $h)) {
        return 'Social';
    }
    return $host !== '' ? 'Referral' : 'Campaign';
}
$channel = channel($refHost, $utmSource, $utmMedium);

// Browser, OS, device.
$browser = match (true) {
    (bool) preg_match('/Edg\//', $ua) => 'Edge',
    (bool) preg_match('/OPR\/|Opera/', $ua) => 'Opera',
    (bool) preg_match('/SamsungBrowser/', $ua) => 'Samsung Internet',
    (bool) preg_match('/FBAN|FBAV|Instagram/', $ua) => 'In-app (Meta)',
    (bool) preg_match('/CriOS|Chrome\//', $ua) => 'Chrome',
    (bool) preg_match('/FxiOS|Firefox\//', $ua) => 'Firefox',
    (bool) preg_match('/Safari\//', $ua) => 'Safari',
    default => 'Other',
};
$os = match (true) {
    (bool) preg_match('/iPhone|iPad|iPod/', $ua) => 'iOS',
    (bool) preg_match('/Android/', $ua) => 'Android',
    (bool) preg_match('/Windows/', $ua) => 'Windows',
    (bool) preg_match('/CrOS/', $ua) => 'ChromeOS',
    (bool) preg_match('/Mac OS X|Macintosh/', $ua) => 'macOS',
    (bool) preg_match('/Linux/', $ua) => 'Linux',
    default => 'Other',
};
$screen = max(0, min(10000, (int) ($b['w'] ?? 0)));
$device = match (true) {
    (bool) preg_match('/iPad|Tablet/', $ua) || ($os === 'Android' && !preg_match('/Mobile/', $ua)) => 'Tablet',
    (bool) preg_match('/Mobi|iPhone|Android/', $ua) => 'Mobile',
    $screen > 0 && $screen < 768 => 'Mobile',
    default => 'Desktop',
};

// Country from the browser's timezone (no IP lookup).
$tz = clean((string) ($b['z'] ?? ''), 64);
$country = '';
if ($tz !== '' && in_array($tz, DateTimeZone::listIdentifiers(), true)) {
    $loc = (new DateTimeZone($tz))->getLocation();
    $country = is_array($loc) && preg_match('/^[A-Z]{2}$/', (string) ($loc['country_code'] ?? '')) ? $loc['country_code'] : '';
}
$lang = preg_replace('/[^A-Za-z-]/', '', clean((string) ($b['l'] ?? ''), 16)) ?? '';

[$day, $hour] = local_now();
$pdo->prepare('INSERT IGNORE INTO pageviews
    (pv, ts, last_seen, day, hour, visitor, session, is_new, is_entry, path, title, ref_host, ref, channel, utm_source, utm_medium, utm_campaign, country, tz, lang, device, browser, os, screen)
    VALUES (?, UTC_TIMESTAMP(), UTC_TIMESTAMP(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    ->execute([
        $id, $day, $hour, $visitor, $session, empty($b['n']) ? 0 : 1, empty($b['e']) ? 0 : 1,
        $path, clean((string) ($b['ti'] ?? ''), 255), $refHost, $ref, $channel,
        $utmSource, $utmMedium, $utmCampaign, $country, $tz, $lang, $device, $browser, $os, $screen,
    ]);

http_response_code(204);
