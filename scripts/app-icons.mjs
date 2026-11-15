#!/usr/bin/env node
/**
 * Generates the home-screen icons in public/icons/ from the AeroLex mark (same paths as
 * public/favicon.svg), so the site looks like an app when added to an iPhone, iPad or Android
 * home screen:
 *   apple-touch-icon.png  180×180  iOS / iPadOS (full-bleed: the system rounds the corners)
 *   icon-192.png          192×192  web app manifest
 *   icon-512.png          512×512  web app manifest
 *   icon-maskable-512.png 512×512  web app manifest, purpose "maskable" (mark inside the safe zone)
 * Run when the brand changes:  node scripts/app-icons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const OUT = path.resolve('public', 'icons');

/** The mark from favicon.svg, drawn in a 48×48 box. */
const MARK = `
  <path d="M7 43 21 9.5M41 43 27 9.5" stroke="#5B9BFF" stroke-width="4"/>
  <path d="M12.6 30.5h22.8" stroke="#5B9BFF" stroke-width="3.6"/>
  <path d="M24 42v-5.2M24 26.6v-3.4M24 19.8v-2.2" stroke="#22D3EE" stroke-width="2.8"/>
  <path d="M19.6 6.4 24 2.8l4.4 3.6" stroke="#E25CF0" stroke-width="3"/>`;

/**
 * Full-bleed icon at 1024 px; `markScale` is the share of the side taken by the mark.
 * Grid and glow repeat the look of the social preview card (scripts/og-image.mjs).
 */
function iconSvg(markScale) {
  const S = 1024;
  const box = S * markScale;
  const k = box / 48;
  const x = (S - box) / 2;
  const y = (S - box) / 2 + S * 0.01; // optical centring: the mark is heavier at the bottom
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#132A52"/>
      <stop offset="1" stop-color="#0A1628"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.78" cy="0.12" r="0.75">
      <stop offset="0" stop-color="#5B9BFF" stop-opacity="0.32"/>
      <stop offset="1" stop-color="#5B9BFF" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
      <path d="M64 0H0V64" fill="none" stroke="#5B9BFF" stroke-opacity="0.08" stroke-width="2"/>
    </pattern>
  </defs>
  <rect width="${S}" height="${S}" fill="url(#bg)"/>
  <rect width="${S}" height="${S}" fill="url(#grid)"/>
  <rect width="${S}" height="${S}" fill="url(#glow)"/>
  <g fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(${x} ${y}) scale(${k})">${MARK}
  </g>
</svg>`;
}

const ICONS = [
  { file: 'apple-touch-icon.png', size: 180, scale: 0.6 },
  { file: 'icon-192.png', size: 192, scale: 0.6 },
  { file: 'icon-512.png', size: 512, scale: 0.6 },
  // Maskable: launchers may crop to a circle of 80 % of the side, so the mark stays well inside.
  { file: 'icon-maskable-512.png', size: 512, scale: 0.46 },
];

fs.mkdirSync(OUT, { recursive: true });
for (const { file, size, scale } of ICONS) {
  await sharp(Buffer.from(iconSvg(scale))).resize(size, size).png({ compressionLevel: 9 }).toFile(path.join(OUT, file));
  console.log(`public/icons/${file} (${size}×${size})`);
}
