import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { mToFt, ftToM, nmToKm, kmToNm, kgToLb, lbToKg, ktToKmh, round, feetInches } from '../../src/lib/units/convert.js';
import { METRICS, flattenVariants, leaders, diff } from '../../src/lib/aircraft/compare.js';

describe('unit conversions', () => {
  it('uses exact definitions', () => {
    expect(ftToM(1)).toBe(0.3048);
    expect(nmToKm(1)).toBe(1.852);
    expect(lbToKg(1)).toBeCloseTo(0.45359237, 10);
    expect(ktToKmh(100)).toBeCloseTo(185.2, 10);
  });
  it('round-trips', () => {
    expect(round(mToFt(ftToM(41000)), 6)).toBe(41000);
    expect(round(kmToNm(nmToKm(3450)), 6)).toBe(3450);
    expect(round(kgToLb(lbToKg(174200)), 6)).toBe(174200);
  });
  it('formats feet and inches like the manufacturers', () => {
    expect(feetInches(37.57)).toBe('123 ft 3 in');
    expect(feetInches(35.8)).toBe('117 ft 5 in');
    expect(feetInches(11.76)).toBe('38 ft 7 in');
  });
});

describe('aircraft comparison', () => {
  const families = [
    { id: 'a', manufacturer: 'A', family: {}, variants: [{ id: 'x', lengthM: 40, rangeNm: null, seatsMax: 200 }, { id: 'y', lengthM: 44, rangeNm: 3000, seatsMax: 200 }] },
    { id: 'b', manufacturer: 'B', family: {}, variants: [{ id: 'z', lengthM: 39, rangeNm: 3500, seatsMax: 180 }] },
  ];
  const all = flattenVariants(families);
  it('flattens with family info', () => expect(all.map((v) => `${v.familyId}/${v.id}`)).toEqual(['a/x', 'a/y', 'b/z']));
  it('finds leaders ignoring unknown values and keeps ties', () => {
    const l = leaders(all);
    expect(l.lengthM).toEqual(['y']);
    expect(l.rangeNm).toEqual(['z']);
    expect(l.seatsMax).toEqual(['x', 'y']);
    expect(l.mtowT).toEqual([]);
  });
  it('diff is null when a value is unknown', () => {
    expect(diff(44, 39)).toBe(5);
    expect(diff(null, 39)).toBe(null);
  });
});

describe('aircraft data', () => {
  const sources = JSON.parse(fs.readFileSync('src/content/sources/sources.json', 'utf8'));
  const files = fs.readdirSync('src/content/aircraft').filter((f) => f.endsWith('.json'));
  const fams = files.map((f) => ({ id: f.replace('.json', ''), ...JSON.parse(fs.readFileSync(`src/content/aircraft/${f}`, 'utf8')) }));

  it('family IDs never collide with pages inside the hangar section', () => {
    for (const f of fams) expect(['compare', 'comparador']).not.toContain(f.id);
  });
  it.each(fams.map((f) => [f.id, f]))('%s: variants are unique, sourced and consistent', (_id, f) => {
    const ids = new Set();
    for (const s of f.sources) expect(sources).toHaveProperty(s);
    for (const v of f.variants) {
      expect(ids.has(v.id)).toBe(false);
      ids.add(v.id);
      expect(v.sources.length).toBeGreaterThan(0);
      for (const s of v.sources) expect(sources, `${v.id}: ${s}`).toHaveProperty(s);
      // Every variant source must also be listed at family level (bibliography)
      for (const s of v.sources) expect(f.sources, `${v.id}: ${s} missing in family sources`).toContain(s);
      for (const { key } of METRICS) if (v[key] !== null) expect(typeof v[key]).toBe('number');
      if (v.rangeNm && v.rangeKm) expect(Math.abs(nmToKm(v.rangeNm) - v.rangeKm) / v.rangeKm).toBeLessThan(0.03);
      for (const d of Object.values(v.milestones)) if (d && /^\d/.test(d)) expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
