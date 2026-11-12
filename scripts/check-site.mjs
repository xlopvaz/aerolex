#!/usr/bin/env node
/**
 * Post-build quality gate for the compiled site (dist/). Fails (exit 1) if:
 *  - an internal link, script, stylesheet or image points to a file that does not exist
 *  - a page is missing <html lang>, <title>, a description, or its hreflang alternates
 *  - an hreflang alternate points to a page that does not exist
 *  - a page under /es/ or /en/ has an empty <main> or placeholder text
 *
 * Usage: node scripts/check-site.mjs [distDir] [base]
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(process.argv[2] ?? 'dist');
const BASE = (process.argv[3] ?? '/aerolex/').replace(/\/?$/, '/');
const SITE = 'https://xlopvaz.github.io';
// Case-sensitive on purpose: "todo" is a normal Spanish word.
const PLACEHOLDERS = /lorem ipsum|\bTODO\b|\bFIXME\b|\bTBD\b/;

const errors = [];
const fail = (file, msg) => errors.push(`${path.relative(DIST, file)}: ${msg}`);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

/** Resolve a URL path (with base) to a file in dist, or null if missing. */
function resolveInternal(urlPath) {
  const clean = decodeURI(urlPath.split('#')[0].split('?')[0]);
  if (!clean.startsWith(BASE)) return { outside: true };
  const rel = clean.slice(BASE.length);
  const candidates = rel === '' || rel.endsWith('/')
    ? [path.join(DIST, rel, 'index.html')]
    : [path.join(DIST, rel), path.join(DIST, rel, 'index.html')];
  return { file: candidates.find((c) => fs.existsSync(c)) ?? null };
}

if (!fs.existsSync(DIST)) {
  console.error(`✗ ${DIST} does not exist. Run the build first.`);
  process.exit(1);
}

const htmlFiles = walk(DIST).filter((f) => f.endsWith('.html'));
let linkCount = 0;

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const relPage = path.relative(DIST, file).split(path.sep).join('/');
  const isContentPage = /^(es|en)\//.test(relPage);

  // Internal references
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const url = m[1];
    if (/^(https?:|mailto:|tel:|data:|blob:|#|javascript:)/.test(url)) {
      if (url.startsWith(SITE)) {
        const r = resolveInternal(new URL(url).pathname);
        if (!r.outside && !r.file) fail(file, `broken absolute link ${url}`);
      }
      continue;
    }
    linkCount++;
    if (!url.startsWith('/')) { fail(file, `relative URL "${url}" (use withBase())`); continue; }
    const r = resolveInternal(url);
    if (r.outside) fail(file, `internal URL without base "${url}"`);
    else if (!r.file) fail(file, `broken link ${url}`);
  }

  if (!/<html[^>]*\slang="(es|en)"/.test(html)) fail(file, 'missing <html lang>');
  if (!/<title>[^<]+<\/title>/.test(html)) fail(file, 'missing <title>');

  if (isContentPage) {
    const lang = relPage.slice(0, 2);
    if (!new RegExp(`<html[^>]*\\slang="${lang}"`).test(html)) fail(file, `<html lang> should be "${lang}"`);
    if (!/<meta name="description" content="[^"]+"/.test(html)) fail(file, 'missing meta description');
    for (const l of ['es', 'en', 'x-default']) {
      const m = html.match(new RegExp(`<link rel="alternate" hreflang="${l}" href="([^"]+)"`));
      if (!m) fail(file, `missing hreflang="${l}"`);
    }
    const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/);
    const text = main ? main[1].replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
    if (text.length < 80) fail(file, 'empty or near-empty <main>');
    if (PLACEHOLDERS.test(text)) fail(file, `placeholder text found: "${text.match(PLACEHOLDERS)[0]}"`);
  }
}

if (!fs.existsSync(path.join(DIST, '404.html'))) errors.push('404.html is missing');

if (errors.length) {
  console.error(`✗ Site check failed (${errors.length} problem${errors.length > 1 ? 's' : ''}):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`✓ Site check passed: ${htmlFiles.length} pages, ${linkCount} internal references, no broken links.`);
