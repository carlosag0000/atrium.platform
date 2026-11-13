<?php
// Insights (blog): storage, HTML for the list and article pages, RSS feed and sitemap.
// Included by render.php, insights.php and admin_cms.php (direct access is denied in .htaccess).
//
// Pages are built by Next as shells (/insights and /insights/post). render.php fills them with the
// HTML below and puts the same HTML in window.__INSIGHTS__, so search engines get full articles and
// React hydrates without a mismatch. Styles live in globals.css under .ins-*.
declare(strict_types=1);

const SITE_URL = 'https://www.atriumad.com';
const POSTS_PER_PAGE = 12;
const RESERVED_SLUGS = ['post', 'feed', 'sitemap', 'category', 'page', 'admin'];

if (!function_exists('rows')) {
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
}

function h(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function post_slug(string $s): string
{
    $s = strtolower(trim(preg_replace('/[^A-Za-z0-9]+/', '-', iconv('UTF-8', 'ASCII//TRANSLIT', $s) ?: $s) ?? '', '-'));
    $s = substr($s, 0, 90) ?: 'post';
    return in_array($s, RESERVED_SLUGS, true) ? $s . '-1' : $s;
}

function cat_slug(string $s): string
{
    return strtolower(trim(preg_replace('/[^A-Za-z0-9]+/', '-', iconv('UTF-8', 'ASCII//TRANSLIT', $s) ?: $s) ?? '', '-'));
}

/** Allow article formatting only: headings, paragraphs, lists, quotes, links, images, code. */
function sanitize_post_html(string $html): string
{
    $allowed = [
        'h2' => [], 'h3' => [], 'h4' => [], 'p' => [], 'br' => [], 'hr' => [], 'strong' => [], 'b' => [], 'em' => [], 'i' => [],
        'u' => [], 's' => [], 'ul' => [], 'ol' => [], 'li' => [], 'blockquote' => [], 'code' => [], 'pre' => [],
        'a' => ['href', 'title'], 'img' => ['src', 'alt', 'title'], 'figure' => [], 'figcaption' => [],
        'table' => [], 'thead' => [], 'tbody' => [], 'tr' => [], 'th' => [], 'td' => [],
    ];
    $rename = ['h1' => 'h2', 'div' => 'p', 'b' => 'strong', 'i' => 'em', 'h5' => 'h4', 'h6' => 'h4'];
    $doc = new DOMDocument();
    libxml_use_internal_errors(true);
    $doc->loadHTML('<?xml encoding="UTF-8"?><body>' . $html . '</body>', LIBXML_NONET | LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
    libxml_clear_errors();
    $out = new DOMDocument();
    $root = $out->createElement('root');
    $out->appendChild($root);

    $walk = static function (DOMNode $src, DOMNode $dst) use (&$walk, $allowed, $rename, $out): void {
        foreach (iterator_to_array($src->childNodes) as $n) {
            if ($n instanceof DOMText) {
                $dst->appendChild($out->createTextNode($n->nodeValue ?? ''));
                continue;
            }
            if (!$n instanceof DOMElement) {
                continue;
            }
            $tag = strtolower($n->tagName);
            if (in_array($tag, ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'svg', 'math', 'template'], true)) {
                continue;
            }
            $tag = $rename[$tag] ?? $tag;
            if (!isset($allowed[$tag])) {
                $walk($n, $dst); // unwrap unknown tags (span, font…), keep their text
                continue;
            }
            $el = $out->createElement($tag);
            foreach ($allowed[$tag] as $attr) {
                if (!$n->hasAttribute($attr)) {
                    continue;
                }
                $v = trim($n->getAttribute($attr));
                if (in_array($attr, ['href', 'src'], true)) {
                    $ok = $attr === 'href' ? preg_match('#^(https?://|mailto:|tel:|/|\#)#i', $v) : preg_match('#^(https?://|/)#i', $v);
                    if (!$ok) {
                        continue;
                    }
                }
                $el->setAttribute($attr, mb_substr($v, 0, 1000));
            }
            if ($tag === 'a' && preg_match('#^https?://#i', $el->getAttribute('href')) && !preg_match('#^https?://(www\.)?atriumad\.com#i', $el->getAttribute('href'))) {
                $el->setAttribute('target', '_blank');
                $el->setAttribute('rel', 'noopener');
            }
            if ($tag === 'img') {
                if (!$el->getAttribute('src')) {
                    continue;
                }
                $el->setAttribute('loading', 'lazy');
                $el->setAttribute('decoding', 'async');
            }
            $dst->appendChild($el);
            $walk($n, $el);
        }
    };
    $body = $doc->getElementsByTagName('body')->item(0) ?? $doc;
    $walk($body, $root);
    $html = '';
    foreach ($root->childNodes as $c) {
        $html .= $out->saveHTML($c);
    }
    // Drop empty paragraphs left by the editor.
    $html = preg_replace('#<p>(\s|&nbsp;|<br>)*</p>#u', '', $html) ?? $html;
    return mb_substr(trim($html), 0, 400000);
}

function reading_minutes(string $html): int
{
    $words = str_word_count(strip_tags($html));
    return max(1, (int) round($words / 220));
}

/** Add ids to h2/h3 so the table of contents can link to them. Returns [html, toc]. */
function with_heading_ids(string $html): array
{
    $toc = [];
    $seen = [];
    $html = preg_replace_callback('#<(h2|h3)>(.*?)</\1>#s', static function ($m) use (&$toc, &$seen) {
        $text = trim(html_entity_decode(strip_tags($m[2]), ENT_QUOTES));
        $id = cat_slug($text) ?: 'section';
        $base = $id;
        $i = 2;
        while (isset($seen[$id])) {
            $id = $base . '-' . $i++;
        }
        $seen[$id] = true;
        $toc[] = ['level' => $m[1], 'id' => $id, 'text' => $text];
        return '<' . $m[1] . ' id="' . $id . '">' . $m[2] . '</' . $m[1] . '>';
    }, $html) ?? $html;
    return [$html, $toc];
}

function visible_where(): string
{
    return "status = 'published' AND published_at <= UTC_TIMESTAMP()";
}

function fmt_date(string $utc): string
{
    $d = new DateTimeImmutable($utc, new DateTimeZone('UTC'));
    return $d->setTimezone(site_tz())->format('M j, Y');
}

function iso_date(string $utc): string
{
    return (new DateTimeImmutable($utc, new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s\Z');
}

function post_card(array $p, bool $featured = false): string
{
    $url = '/insights/' . h($p['slug']);
    $cover = $p['cover'] ? '<a class="ins-card-media" href="' . $url . '" tabindex="-1" aria-hidden="true"><img src="' . h($p['cover']) . '" alt="" loading="' . ($featured ? 'eager' : 'lazy') . '" decoding="async"></a>' : '';
    $cat = $p['category'] ? '<a class="ins-chip" href="/insights?category=' . h(cat_slug($p['category'])) . '">' . h($p['category']) . '</a>' : '';
    return '<article class="ins-card' . ($featured ? ' ins-card-featured' : '') . '">' . $cover
        . '<div class="ins-card-body"><div class="ins-meta">' . $cat . '<span>' . h(fmt_date($p['published_at'])) . '</span><span>' . reading_minutes((string) $p['content']) . ' min read</span></div>'
        . '<h' . ($featured ? '2' : '3') . ' class="ins-card-title"><a href="' . $url . '">' . h($p['title']) . '</a></h' . ($featured ? '2' : '3') . '>'
        . ($p['excerpt'] ? '<p class="ins-card-excerpt">' . h($p['excerpt']) . '</p>' : '')
        . '<a class="ins-more" href="' . $url . '">Read the article <span aria-hidden="true">→</span></a></div></article>';
}

/** The list page body. Returns ['html' => ..., 'title' => ..., 'description' => ..., 'canonical' => ...]. */
function insights_index(string $category = '', int $page = 1): array
{
    $page = max(1, $page);
    $cats = rows('SELECT category, COUNT(*) n FROM posts WHERE ' . visible_where() . " AND category <> '' GROUP BY category ORDER BY n DESC, category");
    $catName = '';
    foreach ($cats as $c) {
        if (cat_slug($c['category']) === $category) {
            $catName = $c['category'];
        }
    }
    $where = visible_where() . ($catName !== '' ? ' AND category = ?' : '');
    $params = $catName !== '' ? [$catName] : [];
    $total = (int) one("SELECT COUNT(*) n FROM posts WHERE $where", $params)['n'];
    $offset = ($page - 1) * POSTS_PER_PAGE;
    $posts = rows("SELECT slug, title, excerpt, cover, category, content, published_at FROM posts WHERE $where ORDER BY published_at DESC LIMIT " . POSTS_PER_PAGE . " OFFSET $offset", $params);

    $chips = '<nav class="ins-filters" aria-label="Topics"><a class="ins-chip' . ($catName === '' ? ' is-active' : '') . '" href="/insights">All</a>';
    foreach ($cats as $c) {
        $s = cat_slug($c['category']);
        $chips .= '<a class="ins-chip' . ($c['category'] === $catName ? ' is-active' : '') . '" href="/insights?category=' . h($s) . '">' . h($c['category']) . ' <span>' . (int) $c['n'] . '</span></a>';
    }
    $chips .= '</nav>';

    if (!$posts) {
        $html = '<div class="ins-wrap">' . ($cats ? $chips : '') . '<div class="ins-empty"><p class="ins-empty-title">New articles are on the way.</p><p>Practical playbooks on restaurant and hospitality marketing: local SEO, reviews, content, ads and retention. <a href="/contact">Tell us what you want us to write about.</a></p></div></div>';
    } else {
        $cards = '';
        foreach ($posts as $i => $p) {
            $cards .= post_card($p, $i === 0 && $page === 1 && $catName === '');
        }
        $pages = (int) ceil($total / POSTS_PER_PAGE);
        $pager = '';
        if ($pages > 1) {
            $q = $catName !== '' ? 'category=' . cat_slug($catName) . '&' : '';
            $pager = '<nav class="ins-pager" aria-label="Pages">'
                . ($page > 1 ? '<a href="/insights?' . h($q) . 'page=' . ($page - 1) . '" rel="prev">← Newer</a>' : '<span></span>')
                . '<span>Page ' . $page . ' of ' . $pages . '</span>'
                . ($page < $pages ? '<a href="/insights?' . h($q) . 'page=' . ($page + 1) . '" rel="next">Older →</a>' : '<span></span>')
                . '</nav>';
        }
        $html = '<div class="ins-wrap">' . $chips . '<div class="ins-grid">' . $cards . '</div>' . $pager . '</div>';
    }

    $canonical = '/insights' . ($catName !== '' ? '?category=' . cat_slug($catName) : '') . ($page > 1 ? ($catName !== '' ? '&' : '?') . 'page=' . $page : '');
    return [
        'html' => $html,
        'title' => $catName !== '' ? "$catName — Insights — Atrium" : 'Insights — Hospitality Marketing Playbooks | Atrium',
        'description' => $catName !== '' ? "Articles about $catName for restaurants, hotels and food brands, from the Atrium team." : 'Practical playbooks on restaurant and hospitality marketing: local SEO, Google reviews, social content, paid ads, email and loyalty.',
        'canonical' => $canonical,
        'noindex' => $page > 1 && !$posts,
    ];
}

/** The article page body, or null when the post doesn't exist (or isn't published, unless $preview). */
function insight_post(string $slug, bool $preview = false): ?array
{
    $p = one('SELECT * FROM posts WHERE slug = ?' . ($preview ? '' : ' AND ' . visible_where()), [$slug]);
    if (!$p) {
        return null;
    }
    $published = (string) ($p['published_at'] ?: $p['created_at']);
    [$body, $toc] = with_heading_ids((string) $p['content']);
    $minutes = reading_minutes((string) $p['content']);
    $url = SITE_URL . '/insights/' . $p['slug'];

    $tocHtml = '';
    if (count($toc) >= 3) {
        $tocHtml = '<nav class="ins-toc" aria-label="In this article"><p>In this article</p><ol>';
        foreach ($toc as $t) {
            $tocHtml .= '<li class="ins-toc-' . $t['level'] . '"><a href="#' . h($t['id']) . '">' . h($t['text']) . '</a></li>';
        }
        $tocHtml .= '</ol></nav>';
    }

    $related = rows('SELECT slug, title, excerpt, cover, category, content, published_at FROM posts WHERE ' . visible_where() . ' AND slug <> ? ORDER BY (category = ?) DESC, published_at DESC LIMIT 3', [$p['slug'], $p['category']]);
    $relatedHtml = '';
    if ($related) {
        $relatedHtml = '<section class="ins-related" aria-labelledby="ins-related-title"><h2 id="ins-related-title">Keep reading</h2><div class="ins-grid">';
        foreach ($related as $r) {
            $relatedHtml .= post_card($r);
        }
        $relatedHtml .= '</div></section>';
    }

    $tags = array_filter(array_map('trim', explode(',', (string) $p['tags'])));
    $draftNote = $p['status'] !== 'published' || strtotime($published . ' UTC') > time()
        ? '<p class="ins-draft-note">Preview — this article is not public yet' . ($p['status'] === 'published' ? ' (scheduled for ' . h(fmt_date($published)) . ')' : '') . '.</p>'
        : '';

    $html = '<article class="ins-article">' . $draftNote
        . '<header class="ins-head"><a class="ins-back" href="/insights">← All insights</a>'
        . '<div class="ins-meta">' . ($p['category'] ? '<a class="ins-chip" href="/insights?category=' . h(cat_slug($p['category'])) . '">' . h($p['category']) . '</a>' : '')
        . '<time datetime="' . h(iso_date($published)) . '">' . h(fmt_date($published)) . '</time><span>' . $minutes . ' min read</span></div>'
        . '<h1 class="ins-title">' . h($p['title']) . '</h1>'
        . ($p['excerpt'] ? '<p class="ins-lede">' . h($p['excerpt']) . '</p>' : '')
        . '<p class="ins-byline">By ' . h($p['author'] ?: 'The Atrium team') . '</p></header>'
        . ($p['cover'] ? '<figure class="ins-cover"><img src="' . h($p['cover']) . '" alt="' . h($p['cover_alt']) . '" decoding="async"></figure>' : '')
        . '<div class="ins-layout">' . $tocHtml . '<div class="ins-body">' . $body
        . ($tags ? '<p class="ins-tags">' . implode('', array_map(static fn ($t) => '<span>#' . h($t) . '</span>', $tags)) . '</p>' : '')
        . '<aside class="ins-cta"><p class="ins-cta-title">Want this working for your restaurant?</p><p>Atrium runs content, local SEO, ads, reviews and retention for hospitality brands, as one team.</p><a href="/contact">Book a growth diagnostic →</a></aside>'
        . '</div></div>' . $relatedHtml . '</article>';

    $title = ($p['seo_title'] ?: $p['title']);
    $description = $p['seo_description'] ?: ($p['excerpt'] ?: mb_substr(trim(preg_replace('/\s+/', ' ', strip_tags($body)) ?? ''), 0, 155));
    $jsonLd = [
        '@context' => 'https://schema.org',
        '@type' => 'BlogPosting',
        'headline' => $p['title'],
        'description' => $description,
        'datePublished' => iso_date($published),
        'dateModified' => iso_date((string) $p['updated_at']),
        'author' => ['@type' => $p['author'] ? 'Person' : 'Organization', 'name' => $p['author'] ?: 'Atrium'],
        'publisher' => ['@type' => 'Organization', 'name' => 'Atrium', 'logo' => ['@type' => 'ImageObject', 'url' => SITE_URL . '/icon']],
        'mainEntityOfPage' => $url,
        'wordCount' => str_word_count(strip_tags($body)),
        'keywords' => implode(', ', $tags),
    ];
    if ($p['cover']) {
        $jsonLd['image'] = str_starts_with($p['cover'], '/') ? SITE_URL . $p['cover'] : $p['cover'];
    }
    if ($p['category']) {
        $jsonLd['articleSection'] = $p['category'];
    }
    return [
        'html' => $html,
        'title' => $title . (str_contains($title, 'Atrium') ? '' : ' | Atrium'),
        'description' => $description,
        'canonical' => '/insights/' . $p['slug'],
        'image' => $p['cover'] ? (str_starts_with($p['cover'], '/') ? SITE_URL . $p['cover'] : $p['cover']) : '',
        'jsonld' => $jsonLd,
        'published' => iso_date($published),
        'noindex' => $draftNote !== '',
    ];
}

/** Write title, description, canonical, Open Graph, JSON-LD and the page data into a shell page. */
function fill_insights_shell(string $html, array $page, string $kind): string
{
    $e = static fn (string $v): string => htmlspecialchars($v, ENT_QUOTES);
    $rep = static fn (string $v): string => str_replace(['\\', '$'], ['\\\\', '\$'], $v);
    $html = preg_replace('#<title>.*?</title>#s', '<title>' . $rep($e($page['title'])) . '</title>', $html, 1) ?? $html;
    // Remove the shell's own description/canonical/OG/robots tags; ours go in below.
    $html = preg_replace('#<meta (name|property)="(description|og:title|og:description|og:url|og:type|og:image|og:image:[a-z]+|twitter:title|twitter:description|twitter:image|twitter:card|robots|article:[a-z_]+)" content="[^"]*"\s*/?>#', '', $html) ?? $html;
    $html = preg_replace('#<link rel="canonical" href="[^"]*"\s*/?>#', '', $html) ?? $html;
    $url = SITE_URL . $page['canonical'];
    $tags = '<meta name="description" content="' . $e($page['description']) . '"/>'
        . '<link rel="canonical" href="' . $e($url) . '"/>'
        . '<meta property="og:title" content="' . $e($page['title']) . '"/>'
        . '<meta property="og:description" content="' . $e($page['description']) . '"/>'
        . '<meta property="og:url" content="' . $e($url) . '"/>'
        . '<meta property="og:type" content="' . ($kind === 'post' ? 'article' : 'website') . '"/>'
        . '<meta name="twitter:card" content="summary_large_image"/>'
        . '<meta name="twitter:title" content="' . $e($page['title']) . '"/>'
        . '<meta name="twitter:description" content="' . $e($page['description']) . '"/>'
        . '<link rel="alternate" type="application/rss+xml" title="Atrium Insights" href="' . SITE_URL . '/insights/feed.xml"/>';
    if (!empty($page['image'])) {
        $tags .= '<meta property="og:image" content="' . $e($page['image']) . '"/><meta name="twitter:image" content="' . $e($page['image']) . '"/>';
    }
    if (!empty($page['published'])) {
        $tags .= '<meta property="article:published_time" content="' . $e($page['published']) . '"/>';
    }
    if (!empty($page['noindex'])) {
        $tags .= '<meta name="robots" content="noindex, nofollow"/>';
    }
    if (!empty($page['jsonld'])) {
        $tags .= '<script type="application/ld+json">' . json_encode($page['jsonld'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG) . '</script>';
    }
    $data = '<script>window.__INSIGHTS__=' . json_encode(['kind' => $kind, 'html' => $page['html'], 'title' => $page['title']], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE) . '</script>';
    $html = preg_replace('#</head>#', $rep($tags . $data) . '</head>', $html, 1) ?? $html;
    // Fill the placeholder the shell renders: <div data-insights-root="list|post"></div>
    $html = preg_replace('#(<div data-insights-root="[a-z]+"[^>]*>)</div>#', '$1' . $rep($page['html']) . '</div>', $html, 1) ?? $html;
    return $html;
}

function insights_feed(): string
{
    $posts = rows('SELECT slug, title, excerpt, content, category, author, published_at FROM posts WHERE ' . visible_where() . ' ORDER BY published_at DESC LIMIT 30');
    $x = static fn (string $s): string => htmlspecialchars($s, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    $items = '';
    foreach ($posts as $p) {
        $url = SITE_URL . '/insights/' . $p['slug'];
        $items .= '<item><title>' . $x($p['title']) . '</title><link>' . $url . '</link><guid isPermaLink="true">' . $url . '</guid>'
            . '<pubDate>' . gmdate('D, d M Y H:i:s', (int) strtotime($p['published_at'] . ' UTC')) . ' GMT</pubDate>'
            . ($p['category'] ? '<category>' . $x($p['category']) . '</category>' : '')
            . '<description>' . $x($p['excerpt'] ?: mb_substr(strip_tags($p['content']), 0, 300)) . '</description></item>';
    }
    return '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>'
        . '<title>Atrium Insights</title><link>' . SITE_URL . '/insights</link><description>Hospitality marketing playbooks from Atrium.</description><language>en-us</language>'
        . '<atom:link href="' . SITE_URL . '/insights/feed.xml" rel="self" type="application/rss+xml"/>' . $items . '</channel></rss>';
}

function insights_sitemap(): string
{
    $posts = rows('SELECT slug, updated_at, published_at FROM posts WHERE ' . visible_where() . ' ORDER BY published_at DESC');
    $urls = '<url><loc>' . SITE_URL . '/insights</loc>' . ($posts ? '<lastmod>' . substr(iso_date($posts[0]['published_at']), 0, 10) . '</lastmod>' : '') . '</url>';
    foreach ($posts as $p) {
        $urls .= '<url><loc>' . SITE_URL . '/insights/' . htmlspecialchars($p['slug'], ENT_XML1) . '</loc><lastmod>' . substr(iso_date(max($p['updated_at'], $p['published_at'])), 0, 10) . '</lastmod></url>';
    }
    foreach (rows('SELECT DISTINCT category FROM posts WHERE ' . visible_where() . " AND category <> ''") as $c) {
        $urls .= '<url><loc>' . SITE_URL . '/insights?category=' . htmlspecialchars(cat_slug($c['category']), ENT_XML1) . '</loc></url>';
    }
    return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . $urls . '</urlset>';
}
