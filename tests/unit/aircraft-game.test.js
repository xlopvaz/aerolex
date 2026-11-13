import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { flattenVariants } from '../../src/lib/aircraft/compare.js';
import { cluesRound, compareRound, createRound, photoRound } from '../../src/lib/aircraft/game.js';
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

describe('photo rounds', () => {
  const photos = Object.entries(JSON.parse(fs.readFileSync('src/content/photos/photos.json', 'utf8'))).map(([id, p]) => ({ id, ...p }));
  const familyIds = families.map((f) => f.id);

  it('always has four different families and the photo\'s family as the answer', () => {
    const rng = rngFrom(7);
    for (let i = 0; i < 300; i++) {
      const r = photoRound(photos, familyIds, rng);
      const photo = photos.find((p) => p.id === r.photo);
      expect(r.kind).toBe('photo');
      expect(r.answer).toBe(photo.family);
      expect(r.options).toHaveLength(4);
      expect(new Set(r.options).size).toBe(4);
      expect(r.options).toContain(r.answer);
    }
  });

  it('never repeats the excluded photo and covers every family', () => {
    const rng = rngFrom(11);
    const seen = new Set();
    let last = null;
    for (let i = 0; i < 400; i++) {
      const r = photoRound(photos, familyIds, rng, last);
      expect(r.photo).not.toBe(last);
      last = r.photo;
      seen.add(r.answer);
    }
    expect(seen.size).toBe(familyIds.length);
  });

  it('returns null when there is nothing to show', () => {
    expect(photoRound([], familyIds)).toBeNull();
    expect(photoRound(photos, ['a380'])).toBeNull();
  });
});
