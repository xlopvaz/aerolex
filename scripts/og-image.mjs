#!/usr/bin/env node
/**
 * Generates the default social preview images (Open Graph, 1200×630) in public/og/:
 * aerolex-es.png and aerolex-en.png. Renders an HTML card with the site's own fonts and
 * colours in headless Chrome (Playwright, a dev dependency) and saves a screenshot.
 * Run when the brand or tagline changes:  node scripts/og-image.mjs
 * Texts come from src/i18n/ui/*.json (meta.ogTitle, meta.ogSubtitle).
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

// Fonts are inlined as data URLs: the card is rendered from a string, so it cannot load local files.
const font = (pkg, file) => `data:font/woff2;base64,${fs.readFileSync(path.resolve('node_modules', pkg, 'files', file)).toString('base64')}`;
const fonts = `
@font-face { font-family: 'SG'; font-weight: 700; src: url('${font('@fontsource/space-grotesk', 'space-grotesk-latin-700-normal.woff2')}') format('woff2'); }
@font-face { font-family: 'Inter'; font-weight: 100 900; src: url('${font('@fontsource-variable/inter', 'inter-latin-wght-normal.woff2')}') format('woff2'); }
@font-face { font-family: 'JB'; font-weight: 400; src: url('${font('@fontsource/jetbrains-mono', 'jetbrains-mono-latin-400-normal.woff2')}') format('woff2'); }`;

const card = (t) => `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; background: #0A1628; color: #E8EEF8; font-family: Inter, sans-serif; position: relative; overflow: hidden; }
.grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(91,155,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(91,155,255,.07) 1px, transparent 1px); background-size: 48px 48px; }
.glow { position: absolute; width: 900px; height: 900px; right: -300px; top: -350px; background: radial-gradient(circle, rgba(91,155,255,.28), transparent 60%); }
.wrap { position: absolute; left: 88px; top: 92px; right: 88px; }
.brand { display: flex; align-items: center; gap: 22px; }
.word { font-family: SG; font-weight: 700; font-size: 92px; letter-spacing: -3px; }
.word span { color: #5B9BFF; }
h1 { font-family: SG; font-weight: 700; font-size: 58px; line-height: 1.08; letter-spacing: -1.5px; margin-top: 54px; max-width: 900px; }
p { font-size: 30px; color: #A9B8CF; margin-top: 26px; max-width: 920px; line-height: 1.35; }
.tag { position: absolute; left: 88px; bottom: 64px; font-family: JB; font-size: 24px; color: #22D3EE; letter-spacing: 1px; }
</style></head><body><div class="grid"></div><div class="glow"></div>
<div class="wrap"><div class="brand">
<svg width="104" height="104" viewBox="0 0 48 48"><g fill="none" stroke-linecap="round" stroke-linejoin="round">
<path d="M7 43 21 9.5M41 43 27 9.5" stroke="#5B9BFF" stroke-width="3.6"/><path d="M12.6 30.5h22.8" stroke="#5B9BFF" stroke-width="3.2"/>
<path d="M24 42v-5.2M24 26.6v-3.4M24 19.8v-2.2" stroke="#22D3EE" stroke-width="2.4"/><path d="M19.6 6.4 24 2.8l4.4 3.6" stroke="#E25CF0" stroke-width="2.6"/></g></svg>
<div class="word">Aero<span>Lex</span></div></div>
<h1>${t.title}</h1><p>${t.subtitle}</p></div>
<div class="tag">ES · EN &nbsp;—&nbsp; xlopvaz.github.io/aerolex</div></body></html>`;

fs.mkdirSync('public/og', { recursive: true });
const browser = await chromium.launch(process.env.CI ? {} : { channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const lang of ['es', 'en']) {
  const ui = JSON.parse(fs.readFileSync(`src/i18n/ui/${lang}.json`, 'utf8'));
  await page.setContent(card({ title: ui.meta.ogTitle, subtitle: ui.meta.ogSubtitle }), { waitUntil: 'load' });
  await page.evaluate(async () => { await Promise.all(['700 40px SG', '400 20px JB', '400 20px Inter'].map((f) => document.fonts.load(f))); await document.fonts.ready; });
  await page.screenshot({ path: `public/og/aerolex-${lang}.png` });
  console.log(`public/og/aerolex-${lang}.png`);
}
await browser.close();
