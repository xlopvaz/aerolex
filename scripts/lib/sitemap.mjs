/** Sitemap helpers for scripts/build-sitemap.mjs (pure, unit-tested). */

const attr = (tag, name) => {
  const m = new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, 'i').exec(tag);
  return m ? m[1] : null;
};

/**
 * Reads the canonical URL and the hreflang alternates of a page from its HTML <head>.
 * @param {string} html
 * @returns {{ canonical: string | null, alternates: { lang: string, href: string }[], noindex: boolean }}
 */
export function pageLinks(html) {
  const head = html.split(/<\/head>/i)[0];
  const links = head.match(/<link\b[^>]*>/gi) ?? [];
  let canonical = null;
  const alternates = [];
  for (const l of links) {
    const rel = (attr(l, 'rel') ?? '').toLowerCase();
    if (rel === 'canonical') canonical = attr(l, 'href');
    else if (rel === 'alternate' && attr(l, 'hreflang')) alternates.push({ lang: attr(l, 'hreflang'), href: attr(l, 'href') });
  }
  const noindex = /<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(head);
  return { canonical, alternates, noindex };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Builds sitemap.xml with hreflang alternates (xhtml:link), sorted by URL.
 * @param {{ loc: string, alternates: { lang: string, href: string }[] }[]} pages
 */
export function sitemapXml(pages) {
  const urls = [...pages]
    .sort((a, b) => a.loc.localeCompare(b.loc))
    .map((p) => [
      '  <url>',
      `    <loc>${esc(p.loc)}</loc>`,
      ...p.alternates.map((a) => `    <xhtml:link rel="alternate" hreflang="${esc(a.lang)}" href="${esc(a.href)}"/>`),
      '  </url>',
    ].join('\n'));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
}
