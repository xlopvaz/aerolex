#!/usr/bin/env node
/**
 * Writes dist/sitemap.xml after the build (npm run build runs it), from what the compiled pages
 * declare: every page with a canonical URL is listed with its hreflang alternates. Pages without
 * a canonical (the language redirect at the root, the 404) or marked noindex are left out.
 * Usage: node scripts/build-sitemap.mjs [distDir]
 */
import fs from 'node:fs';
import path from 'node:path';
import { pageLinks, sitemapXml } from './lib/sitemap.mjs';

const DIST = path.resolve(process.argv[2] ?? 'dist');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const pages = [];
for (const file of walk(DIST).filter((f) => f.endsWith('.html'))) {
  const { canonical, alternates, noindex } = pageLinks(fs.readFileSync(file, 'utf8'));
  if (canonical && !noindex) pages.push({ loc: canonical, alternates });
}
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemapXml(pages));
console.log(`sitemap.xml: ${pages.length} pages`);
