import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { cockpitProblems, inRect, itemAt, nextQuestion, rectCenter, rectsOverlap } from '../../src/lib/cockpit/cockpit.js';

const data = JSON.parse(fs.readFileSync('src/content/cockpits/cockpits.json', 'utf8'));
const sources = JSON.parse(fs.readFileSync('src/content/sources/sources.json', 'utf8'));
const terms = new Set(fs.readdirSync('src/content/dictionary').map((f) => f.replace(/\.json$/, '')));
const bilingual = (v, where) => {
  expect(typeof v?.es === 'string' && v.es.trim().length > 0, `${where} es`).toBe(true);
  expect(typeof v?.en === 'string' && v.en.trim().length > 0, `${where} en`).toBe(true);
};

describe('cockpit geometry', () => {
  it('hit-tests rectangles', () => {
    expect(inRect([10, 10, 20, 20], 10, 30)).toBe(true);
    expect(inRect([10, 10, 20, 20], 31, 15)).toBe(false);
    expect(rectsOverlap([0, 0, 10, 10], [5, 5, 10, 10])).toBe(true);
    expect(rectsOverlap([0, 0, 10, 10], [10, 0, 10, 10])).toBe(false);
    expect(rectCenter([0, 0, 10, 20])).toEqual([5, 10]);
    const items = [{ id: 'a', shapes: [[0, 0, 10, 10], [50, 50, 10, 10]] }, { id: 'b', shapes: [[20, 0, 10, 10]] }];
    expect(itemAt(items, 55, 55)?.id).toBe('a');
    expect(itemAt(items, 25, 5)?.id).toBe('b');
    expect(itemAt(items, 40, 40)).toBeNull();
  });

  it('asks every item once before repeating, never twice in a row', () => {
    const items = ['a', 'b', 'c', 'd'].map((id) => ({ id }));
    let asked = [];
    const seen = [];
    let n = 0;
    const rng = () => ((n = (n * 7 + 3) % 10) / 10);
    for (let i = 0; i < 4; i++) ({ asked } = nextQuestion(items, rng, asked)), seen.push(asked[asked.length - 1]);
    expect(new Set(seen).size).toBe(4);
    const { id } = nextQuestion(items, rng, asked);
    expect(id).not.toBe(seen[3]);
  });

  it('reports bad definitions', () => {
    expect(cockpitProblems({ items: [{ id: 'a', shapes: [[0, 0, 10, 10]] }, { id: 'a', shapes: [[5, 5, 10, 10]] }] }, [100, 100])).toEqual(['duplicate id a', 'a overlaps a']);
    expect(cockpitProblems({ items: [{ id: 'x', shapes: [[95, 0, 10, 10]] }] }, [100, 100])).toHaveLength(1);
  });
});

describe('cockpit content', () => {
  for (const [key, c] of Object.entries(data.cockpits)) {
    it(`${key}: valid drawing, bilingual texts, real terms and sources`, () => {
      expect(cockpitProblems(c, data.viewBox)).toEqual([]);
      bilingual(c.name, `${key} name`);
      bilingual(c.intro, `${key} intro`);
      expect(c.review.status).toBe('draft');
      expect(c.items.length).toBeGreaterThanOrEqual(8);
      for (const z of c.zones) bilingual(z.label, `${key} zone ${z.id}`);
      const itemSources = new Set();
      for (const i of c.items) {
        bilingual(i.name, `${key}.${i.id} name`);
        bilingual(i.text, `${key}.${i.id} text`);
        if (i.compare !== null) bilingual(i.compare, `${key}.${i.id} compare`);
        expect(i.sources.length, `${key}.${i.id} sources`).toBeGreaterThan(0);
        for (const s of i.sources) {
          expect(sources[s], `${key}.${i.id} source ${s}`).toBeTruthy();
          itemSources.add(s);
        }
        for (const t of i.terms) expect(terms.has(t), `${key}.${i.id} term ${t}`).toBe(true);
      }
      // The page lists the cockpit's sources: every item source must be among them
      for (const s of itemSources) expect(c.sources, `${key} sources list`).toContain(s);
    });
  }
});
