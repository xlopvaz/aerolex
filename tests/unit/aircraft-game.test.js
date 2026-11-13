import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { flattenVariants } from '../../src/lib/aircraft/compare.js';
import { cluesRound, compareRound, createRound } from '../../src/lib/aircraft/game.js';
import { rngFrom } from '../../src/lib/practice/generate.js';

const families = fs.readdirSync('src/content/aircraft').map((f) => ({ id: f.replace('.json', ''), ...JSON.parse(fs.readFileSync(`src/content/aircraft/${f}`, 'utf8')) }));
const variants = flattenVariants(families);
const byKey = Object.fromEntries(variants.map((v) => [`${v.familyId}:${v.id}`, v]));

describe('aircraft game', () => {
  it('clue rounds always have exactly one variant matching every clue', () => {
    const rng = rngFrom(11);
    for (let n = 0; n < 300; n++) {
      const r = cluesRound(variants, rng);
      expect(r.options).toHaveLength(4);
      expect(new Set(r.options).size).toBe(4);
      const matching = r.options.filter((k) => r.clues.every((c) => byKey[k][c.key] === c.value));
      expect(matching).toEqual([r.answer]);
    }
  });
  it('compare rounds use known, different values and pick the higher one', () => {
    const rng = rngFrom(12);
    for (let n = 0; n < 300; n++) {
      const r = compareRound(variants, rng);
      const [a, b] = r.options.map((k) => byKey[k][r.metric]);
      expect(typeof a).toBe('number');
      expect(typeof b).toBe('number');
      expect(a).not.toBe(b);
      expect(byKey[r.answer][r.metric]).toBe(Math.max(a, b));
    }
  });
  it('createRound returns both kinds', () => {
    const rng = rngFrom(13);
    const kinds = new Set(Array.from({ length: 50 }, () => createRound(variants, rng).kind));
    expect([...kinds].sort()).toEqual(['clues', 'compare']);
  });
});
