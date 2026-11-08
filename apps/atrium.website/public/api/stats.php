<?php
// Analytics queries for the dashboard. Included by admin.php only (direct access is denied in .htaccess).
declare(strict_types=1);

const GOALS = [
    'form_submit' => 'Contact form sent',
    'application_submit' => 'Job application sent',
    'cal_click' => 'Booking button clicked',
    'email_click' => 'Email link clicked',
    'phone_click' => 'Phone link clicked',
];

function rows(string $sql, array $params = []): array
{
    $q = db()->prepare($sql);
    $q->execute($params);
    return $q->fetchAll();
}

function one(string $sql, array $params = []): array
{
    return rows($sql, $params)[0] ?? [];
}

/** [from, to, prevFrom, prevTo] as Y-m-d in the site timezone. Defaults to the last 30 days. */
function date_range(): array
{
    $tz = site_tz();
    $today = new DateTimeImmutable('today', $tz);
    $parse = static function (string $s) use ($tz): ?DateTimeImmutable {
        $d = DateTimeImmutable::createFromFormat('!Y-m-d', $s, $tz);
        return $d ?: null;
    };
    $to = $parse((string) ($_GET['to'] ?? '')) ?? $today;
    $from = $parse((string) ($_GET['from'] ?? '')) ?? $to->modify('-29 days');
    if ($from > $to) {
        [$from, $to] = [$to, $from];
    }
    if ($from < $to->modify('-3 years')) {
        $from = $to->modify('-3 years');
    }
    $days = (int) $from->diff($to)->days + 1;
    $prevTo = $from->modify('-1 day');
    $prevFrom = $prevTo->modify('-' . ($days - 1) . ' days');
    return [$from->format('Y-m-d'), $to->format('Y-m-d'), $prevFrom->format('Y-m-d'), $prevTo->format('Y-m-d')];
}

function goal_in(): string
{
    return "'" . implode("','", array_keys(GOALS)) . "'";
}

function totals(string $from, string $to): array
{
    $base = one('SELECT COUNT(*) pageviews, COUNT(DISTINCT visitor) visitors, COUNT(DISTINCT session) sessions,
        COUNT(DISTINCT CASE WHEN is_new = 1 THEN visitor END) new_visitors
        FROM pageviews WHERE day BETWEEN ? AND ?', [$from, $to]);
    $sess = one('SELECT COUNT(*) n, AVG(dur) avg_duration, SUM(pvs = 1) bounces
        FROM (SELECT session, COUNT(*) pvs, SUM(duration) dur FROM pageviews WHERE day BETWEEN ? AND ? GROUP BY session) s', [$from, $to]);
    $conv = one('SELECT COUNT(*) conversions, COUNT(DISTINCT session) converted_sessions FROM events
        WHERE day BETWEEN ? AND ? AND name IN (' . goal_in() . ')', [$from, $to]);
    $sessions = (int) ($base['sessions'] ?? 0);
    return [
        'visitors' => (int) ($base['visitors'] ?? 0),
        'new_visitors' => (int) ($base['new_visitors'] ?? 0),
        'sessions' => $sessions,
        'pageviews' => (int) ($base['pageviews'] ?? 0),
        'avg_duration' => (int) round((float) ($sess['avg_duration'] ?? 0)),
        'bounce_rate' => $sessions ? round(100 * (int) $sess['bounces'] / $sessions, 1) : 0,
        'pages_per_session' => $sessions ? round((int) $base['pageviews'] / $sessions, 2) : 0,
        'conversions' => (int) ($conv['conversions'] ?? 0),
        'conversion_rate' => $sessions ? round(100 * (int) $conv['converted_sessions'] / $sessions, 2) : 0,
        'leads' => (int) one('SELECT COUNT(*) n FROM contacts WHERE created_at >= ? AND created_at < ?', utc_bounds($from, $to))['n'],
        'applications' => (int) one('SELECT COUNT(*) n FROM applications WHERE created_at >= ? AND created_at < ?', utc_bounds($from, $to))['n'],
    ];
}

/** UTC datetime bounds for local days [from, to]. */
function utc_bounds(string $from, string $to): array
{
    $tz = site_tz();
    $utc = new DateTimeZone('UTC');
    $a = (new DateTimeImmutable($from . ' 00:00:00', $tz))->setTimezone($utc)->format('Y-m-d H:i:s');
    $b = (new DateTimeImmutable($to . ' 00:00:00', $tz))->modify('+1 day')->setTimezone($utc)->format('Y-m-d H:i:s');
    return [$a, $b];
}

function series(string $from, string $to): array
{
    $byDay = [];
    foreach (rows('SELECT day, COUNT(*) pageviews, COUNT(DISTINCT visitor) visitors, COUNT(DISTINCT session) sessions
        FROM pageviews WHERE day BETWEEN ? AND ? GROUP BY day', [$from, $to]) as $r) {
        $byDay[$r['day']] = $r;
    }
    $conv = [];
    foreach (rows('SELECT day, COUNT(*) n FROM events WHERE day BETWEEN ? AND ? AND name IN (' . goal_in() . ') GROUP BY day', [$from, $to]) as $r) {
        $conv[$r['day']] = (int) $r['n'];
    }
    $out = [];
    $d = new DateTimeImmutable($from);
    $end = new DateTimeImmutable($to);
    while ($d <= $end) {
        $k = $d->format('Y-m-d');
        $out[] = [
            'day' => $k,
            'visitors' => (int) ($byDay[$k]['visitors'] ?? 0),
            'pageviews' => (int) ($byDay[$k]['pageviews'] ?? 0),
            'sessions' => (int) ($byDay[$k]['sessions'] ?? 0),
            'conversions' => $conv[$k] ?? 0,
        ];
        $d = $d->modify('+1 day');
    }
    return $out;
}

function breakdown(string $col, string $from, string $to, bool $entryOnly = false, int $limit = 12): array
{
    $allowed = ['channel', 'ref_host', 'country', 'device', 'browser', 'os', 'lang', 'path', 'utm_source', 'utm_campaign'];
    if (!in_array($col, $allowed, true)) {
        return [];
    }
    $sql = "SELECT $col name, COUNT(DISTINCT visitor) visitors, COUNT(*) n FROM pageviews
        WHERE day BETWEEN ? AND ?" . ($entryOnly ? ' AND is_entry = 1' : '') . ($col === 'ref_host' || str_starts_with($col, 'utm') ? " AND $col <> ''" : '') . "
        GROUP BY $col ORDER BY visitors DESC, n DESC LIMIT " . $limit;
    return array_map(static fn ($r) => ['name' => $r['name'] === '' ? '(unknown)' : $r['name'], 'visitors' => (int) $r['visitors'], 'count' => (int) $r['n']], rows($sql, [$from, $to]));
}

function overview(): array
{
    [$from, $to, $pFrom, $pTo] = date_range();
    $pages = rows('SELECT path name, MAX(title) title, COUNT(*) count, COUNT(DISTINCT visitor) visitors FROM pageviews
        WHERE day BETWEEN ? AND ? GROUP BY path ORDER BY count DESC LIMIT 12', [$from, $to]);
    $entries = rows('SELECT path name, COUNT(*) count, COUNT(DISTINCT visitor) visitors FROM pageviews
        WHERE day BETWEEN ? AND ? AND is_entry = 1 GROUP BY path ORDER BY count DESC LIMIT 12', [$from, $to]);
    $campaigns = rows("SELECT utm_source source, utm_medium medium, utm_campaign campaign, COUNT(*) sessions, COUNT(DISTINCT visitor) visitors
        FROM pageviews WHERE day BETWEEN ? AND ? AND is_entry = 1 AND (utm_source <> '' OR utm_campaign <> '')
        GROUP BY utm_source, utm_medium, utm_campaign ORDER BY sessions DESC LIMIT 20", [$from, $to]);
    $heat = rows('SELECT DAYOFWEEK(day) dow, hour, COUNT(*) n FROM pageviews WHERE day BETWEEN ? AND ? GROUP BY dow, hour', [$from, $to]);
    $goals = [];
    foreach (rows('SELECT name, COUNT(*) n, COUNT(DISTINCT session) sessions FROM events WHERE day BETWEEN ? AND ? AND name IN (' . goal_in() . ') GROUP BY name', [$from, $to]) as $r) {
        $goals[$r['name']] = ['count' => (int) $r['n'], 'sessions' => (int) $r['sessions']];
    }
    $goalList = [];
    foreach (GOALS as $k => $label) {
        $goalList[] = ['key' => $k, 'label' => $label, 'count' => $goals[$k]['count'] ?? 0, 'sessions' => $goals[$k]['sessions'] ?? 0];
    }
    $byChannel = [];
    foreach (rows('SELECT p.channel, COUNT(DISTINCT e.session) n FROM events e
        JOIN pageviews p ON p.session = e.session AND p.is_entry = 1
        WHERE e.day BETWEEN ? AND ? AND e.name IN (' . goal_in() . ') GROUP BY p.channel', [$from, $to]) as $r) {
        $byChannel[$r['channel']] = (int) $r['n'];
    }
    $channels = array_map(static function ($c) use ($byChannel) {
        $c['conversions'] = $byChannel[$c['name']] ?? 0;
        return $c;
    }, breakdown('channel', $from, $to, true, 10));

    return [
        'range' => ['from' => $from, 'to' => $to, 'prev_from' => $pFrom, 'prev_to' => $pTo],
        'totals' => totals($from, $to),
        'previous' => totals($pFrom, $pTo),
        'series' => series($from, $to),
        'previous_series' => series($pFrom, $pTo),
        'pages' => array_map(static fn ($r) => ['name' => $r['name'], 'title' => (string) $r['title'], 'count' => (int) $r['count'], 'visitors' => (int) $r['visitors']], $pages),
        'entries' => array_map(static fn ($r) => ['name' => $r['name'], 'count' => (int) $r['count'], 'visitors' => (int) $r['visitors']], $entries),
        'channels' => $channels,
        'referrers' => breakdown('ref_host', $from, $to, true),
        'campaigns' => array_map(static fn ($r) => array_merge($r, ['sessions' => (int) $r['sessions'], 'visitors' => (int) $r['visitors']]), $campaigns),
        'countries' => breakdown('country', $from, $to),
        'devices' => breakdown('device', $from, $to),
        'browsers' => breakdown('browser', $from, $to),
        'os' => breakdown('os', $from, $to),
        'languages' => breakdown('lang', $from, $to),
        'heatmap' => array_map(static fn ($r) => ['dow' => (int) $r['dow'], 'hour' => (int) $r['hour'], 'count' => (int) $r['n']], $heat),
        'goals' => $goalList,
    ];
}

function pages_report(): array
{
    [$from, $to] = date_range();
    $p = [$from, $to];
    $rows = rows('SELECT path, MAX(title) title, COUNT(*) views, COUNT(DISTINCT visitor) visitors,
        ROUND(AVG(NULLIF(duration, 0))) avg_time, ROUND(AVG(NULLIF(scroll, 0))) avg_scroll, SUM(is_entry) entries
        FROM pageviews WHERE day BETWEEN ? AND ? GROUP BY path ORDER BY views DESC LIMIT 500', $p);
    $exits = [];
    foreach (rows('SELECT p.path, COUNT(*) n FROM pageviews p
        JOIN (SELECT MAX(id) mid FROM pageviews WHERE day BETWEEN ? AND ? GROUP BY session) x ON p.id = x.mid GROUP BY p.path', $p) as $r) {
        $exits[$r['path']] = (int) $r['n'];
    }
    $bounces = [];
    foreach (rows('SELECT p.path, COUNT(*) n FROM pageviews p
        JOIN (SELECT session FROM pageviews WHERE day BETWEEN ? AND ? GROUP BY session HAVING COUNT(*) = 1) s ON s.session = p.session
        WHERE p.day BETWEEN ? AND ? GROUP BY p.path', [$from, $to, $from, $to]) as $r) {
        $bounces[$r['path']] = (int) $r['n'];
    }
    $conv = [];
    foreach (rows('SELECT path, COUNT(*) n FROM events WHERE day BETWEEN ? AND ? AND name IN (' . goal_in() . ') GROUP BY path', $p) as $r) {
        $conv[$r['path']] = (int) $r['n'];
    }
    return [
        'range' => ['from' => $from, 'to' => $to],
        'pages' => array_map(static function ($r) use ($exits, $bounces, $conv) {
            $entries = (int) $r['entries'];
            return [
                'path' => $r['path'],
                'title' => (string) $r['title'],
                'views' => (int) $r['views'],
                'visitors' => (int) $r['visitors'],
                'avg_time' => (int) $r['avg_time'],
                'avg_scroll' => (int) $r['avg_scroll'],
                'entries' => $entries,
                'exits' => $exits[$r['path']] ?? 0,
                'bounce_rate' => $entries ? round(100 * ($bounces[$r['path']] ?? 0) / $entries, 1) : null,
                'conversions' => $conv[$r['path']] ?? 0,
            ];
        }, $rows),
    ];
}

function events_report(): array
{
    [$from, $to] = date_range();
    $names = rows('SELECT name, COUNT(*) n, COUNT(DISTINCT visitor) visitors FROM events WHERE day BETWEEN ? AND ? GROUP BY name ORDER BY n DESC', [$from, $to]);
    $labels = rows('SELECT name, label, COUNT(*) n FROM events WHERE day BETWEEN ? AND ? GROUP BY name, label ORDER BY n DESC LIMIT 200', [$from, $to]);
    $recent = rows('SELECT ts, name, label, path, visitor FROM events WHERE day BETWEEN ? AND ? ORDER BY id DESC LIMIT 100', [$from, $to]);
    return [
        'range' => ['from' => $from, 'to' => $to],
        'goals' => GOALS,
        'names' => array_map(static fn ($r) => ['name' => $r['name'], 'count' => (int) $r['n'], 'visitors' => (int) $r['visitors']], $names),
        'labels' => array_map(static fn ($r) => ['name' => $r['name'], 'label' => $r['label'], 'count' => (int) $r['n']], $labels),
        'recent' => array_map(static fn ($r) => array_merge($r, ['ts' => utc_iso($r['ts'])]), $recent),
    ];
}

function realtime(): array
{
    $active = one('SELECT COUNT(DISTINCT visitor) n FROM pageviews WHERE last_seen > UTC_TIMESTAMP() - INTERVAL 5 MINUTE');
    $pages = rows('SELECT path, COUNT(DISTINCT visitor) n FROM pageviews p
        WHERE last_seen > UTC_TIMESTAMP() - INTERVAL 5 MINUTE
        AND id = (SELECT MAX(id) FROM pageviews p2 WHERE p2.visitor = p.visitor)
        GROUP BY path ORDER BY n DESC LIMIT 20');
    $minutes = rows("SELECT DATE_FORMAT(ts, '%Y-%m-%d %H:%i:00') m, COUNT(*) n FROM pageviews
        WHERE ts > UTC_TIMESTAMP() - INTERVAL 30 MINUTE GROUP BY m");
    $feed = rows('SELECT ts, path, title, channel, ref_host, utm_source, country, device, browser, visitor, is_new FROM pageviews ORDER BY id DESC LIMIT 40');
    [$today] = local_now();
    $todayTotals = one('SELECT COUNT(*) pageviews, COUNT(DISTINCT visitor) visitors FROM pageviews WHERE day = ?', [$today]);
    return [
        'active' => (int) ($active['n'] ?? 0),
        'pages' => array_map(static fn ($r) => ['path' => $r['path'], 'visitors' => (int) $r['n']], $pages),
        'minutes' => array_map(static fn ($r) => ['minute' => utc_iso($r['m']), 'count' => (int) $r['n']], $minutes),
        'feed' => array_map(static fn ($r) => array_merge($r, ['ts' => utc_iso($r['ts']), 'is_new' => (int) $r['is_new']]), $feed),
        'today' => ['pageviews' => (int) ($todayTotals['pageviews'] ?? 0), 'visitors' => (int) ($todayTotals['visitors'] ?? 0)],
        'now' => gmdate('Y-m-d\TH:i:s\Z'),
    ];
}

function journey(string $visitor): array
{
    if ($visitor === '') {
        return ['visits' => [], 'summary' => null];
    }
    $pvs = rows('SELECT ts, session, path, title, duration, scroll, channel, ref_host, utm_source, utm_medium, utm_campaign, country, device, browser, os
        FROM pageviews WHERE visitor = ? ORDER BY id ASC LIMIT 400', [$visitor]);
    $evs = rows('SELECT ts, session, path, name, label FROM events WHERE visitor = ? ORDER BY id ASC LIMIT 200', [$visitor]);
    if (!$pvs && !$evs) {
        return ['visits' => [], 'summary' => null];
    }
    $sessions = [];
    foreach ($pvs as $p) {
        $s = $p['session'];
        if (!isset($sessions[$s])) {
            $sessions[$s] = [
                'started' => utc_iso($p['ts']),
                'channel' => $p['channel'],
                'ref_host' => $p['ref_host'],
                'campaign' => trim($p['utm_source'] . ' / ' . $p['utm_medium'] . ' / ' . $p['utm_campaign'], ' /'),
                'device' => $p['device'],
                'browser' => $p['browser'],
                'os' => $p['os'],
                'country' => $p['country'],
                'steps' => [],
            ];
        }
        $sessions[$s]['steps'][] = ['ts' => utc_iso($p['ts']), 'type' => 'page', 'path' => $p['path'], 'title' => $p['title'], 'duration' => (int) $p['duration'], 'scroll' => (int) $p['scroll']];
    }
    foreach ($evs as $e) {
        $s = $e['session'];
        if (!isset($sessions[$s])) {
            $sessions[$s] = ['started' => utc_iso($e['ts']), 'channel' => '', 'ref_host' => '', 'campaign' => '', 'device' => '', 'browser' => '', 'os' => '', 'country' => '', 'steps' => []];
        }
        $sessions[$s]['steps'][] = ['ts' => utc_iso($e['ts']), 'type' => 'event', 'path' => $e['path'], 'name' => $e['name'], 'label' => $e['label']];
    }
    foreach ($sessions as &$s) {
        usort($s['steps'], static fn ($a, $b) => strcmp($a['ts'], $b['ts']));
    }
    unset($s);
    $visits = array_values($sessions);
    usort($visits, static fn ($a, $b) => strcmp($a['started'], $b['started']));
    $first = $pvs[0] ?? null;
    return [
        'visits' => $visits,
        'summary' => [
            'first_seen' => $visits[0]['started'],
            'first_channel' => $first['channel'] ?? '',
            'first_referrer' => $first['ref_host'] ?? '',
            'visits' => count($visits),
            'pageviews' => count($pvs),
            'time' => array_sum(array_map(static fn ($p) => (int) $p['duration'], $pvs)),
        ],
    ];
}

function utc_iso(?string $ts): string
{
    return $ts ? str_replace(' ', 'T', $ts) . 'Z' : '';
}
