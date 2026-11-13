<?php
// Public Insights endpoints:
//   ?feed=1                  RSS feed            (served at /insights/feed.xml)
//   ?sitemap=1               articles sitemap    (served at /insights/sitemap.xml)
//   ?latest=N                newest articles as JSON (Resources menu)
//   ?list=1&category=&page=  list page HTML as JSON (client-side navigation to /insights)
//   ?post=slug               article HTML as JSON (fallback when a page is opened without render.php)
declare(strict_types=1);
define('PUBLIC_PAGE', true);
require __DIR__ . '/lib.php';
require __DIR__ . '/blog.php';

if (isset($_GET['feed'])) {
    header('Content-Type: application/rss+xml; charset=utf-8');
    header('Cache-Control: public, max-age=600');
    echo insights_feed();
    exit;
}
if (isset($_GET['sitemap'])) {
    header('Content-Type: application/xml; charset=utf-8');
    header('Cache-Control: public, max-age=600');
    echo insights_sitemap();
    exit;
}
header('Cache-Control: public, max-age=120');
if (isset($_GET['latest'])) {
    $n = max(1, min(6, (int) $_GET['latest']));
    $posts = rows('SELECT slug, title, excerpt, cover, cover_alt, category, published_at FROM posts WHERE ' . visible_where() . ' ORDER BY published_at DESC LIMIT ' . $n);
    json_out(200, ['posts' => array_map(static fn ($p) => [
        'url' => '/insights/' . $p['slug'], 'title' => $p['title'], 'excerpt' => $p['excerpt'], 'cover' => $p['cover'],
        'cover_alt' => $p['cover_alt'], 'category' => $p['category'], 'date' => fmt_date($p['published_at']),
    ], $posts)]);
}
if (isset($_GET['list'])) {
    $page = insights_index(preg_replace('/[^a-z0-9-]/', '', (string) ($_GET['category'] ?? '')) ?? '', (int) ($_GET['page'] ?? 1));
    json_out(200, ['html' => $page['html'], 'title' => $page['title']]);
}
if (isset($_GET['post'])) {
    $p = insight_post(preg_replace('/[^a-z0-9-]/', '', (string) $_GET['post']) ?? '');
    $p ? json_out(200, ['html' => $p['html'], 'title' => $p['title']]) : json_out(404, ['error' => 'not_found']);
}
json_out(400, ['error' => 'action']);
