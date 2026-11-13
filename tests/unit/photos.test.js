import { describe, it, expect } from 'vitest';
import fs from 'node:fs';

const photos = Object.entries(JSON.parse(fs.readFileSync('src/content/photos/photos.json', 'utf8'))).map(([id, p]) => ({ id, ...p }));
const families = new Set(fs.readdirSync('src/content/aircraft').map((f) => f.replace(/\.json$/, '')));
const FREE = /^(CC0|Public domain|CC BY(-SA)? \d(\.\d)?( [a-z-]+)?)$/i;

describe('Hangar photos', () => {
  it('every family has at least three photos to learn from', () => {
    for (const f of families) expect(photos.filter((p) => p.family === f).length, f).toBeGreaterThanOrEqual(3);
  });

  it.each(photos.map((p) => [p.id, p]))('%s is freely licensed, attributed, bilingual and present', (id, p) => {
    expect(families.has(p.family)).toBe(true);
    expect(p.licence).toMatch(FREE);
    if (!/^(CC0|Public domain)$/i.test(p.licence)) expect(p.licenceUrl).toMatch(/^https:\/\/creativecommons\.org\//);
    expect(p.author.trim()).toBeTruthy();
    expect(p.pageUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    for (const f of ['alt', 'caption']) {
      expect(p[f].es.trim()).toBeTruthy();
      expect(p[f].en.trim()).toBeTruthy();
    }
    expect(fs.existsSync(`public/${p.file}`), p.file).toBe(true);
    expect(fs.existsSync(`public/${p.thumb}`), p.thumb).toBe(true);
  });

  it('orders photos within a family without gaps', () => {
    for (const f of families) {
      const orders = photos.filter((p) => p.family === f).map((p) => p.order).sort((a, b) => a - b);
      expect(orders).toEqual(orders.map((_, i) => i + 1));
    }
  });
});
