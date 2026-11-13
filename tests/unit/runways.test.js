import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { areReciprocal, bearing, designatorHeading, distanceM, layoutRunways, niceScale, parseRunwayIdent, surfaceCategory } from '../../src/lib/airports/runways.js';

describe('runway geometry', () => {
  it('measures distances and true bearings', () => {
    expect(distanceM(0, 0, 0, 1)).toBeCloseTo(111195, -1);
    expect(bearing(0, 0, 1, 0)).toBeCloseTo(0, 5);
    expect(bearing(0, 0, 0, 1)).toBeCloseTo(90, 5);
    expect(bearing(0, 0, -1, 0)).toBeCloseTo(180, 5);
    expect(bearing(0, 0, 0, -1)).toBeCloseTo(270, 5);
  });

  it('parses runway designators and checks reciprocal ends', () => {
    expect(parseRunwayIdent('09L')).toEqual({ number: 9, side: 'L' });
    expect(parseRunwayIdent('36')).toEqual({ number: 36, side: null });
    expect(parseRunwayIdent('37')).toBeNull();
    expect(parseRunwayIdent('00')).toBeNull();
    expect(parseRunwayIdent('H1')).toBeNull();
    expect(areReciprocal('09L', '27R')).toBe(true);
    expect(areReciprocal('18C', '36C')).toBe(true);
    expect(areReciprocal('04', '22')).toBe(true);
    expect(areReciprocal('09L', '27L')).toBe(false);
    expect(areReciprocal('09', '26')).toBe(false);
    expect(designatorHeading('36R')).toBe(360);
    expect(designatorHeading('N')).toBeNull();
  });

  it('normalises surfaces', () => {
    expect(['ASP', 'ASPH-G', 'Asphalt', 'BIT'].map(surfaceCategory)).toEqual(['asphalt', 'asphalt', 'asphalt', 'asphalt']);
    expect(['CON', 'concrete', 'GRS', 'GRVL', 'PEM', ''].map(surfaceCategory)).toEqual(['concrete', 'concrete', 'grass', 'gravel', 'other', 'unknown']);
  });

  it('picks round scale-bar lengths', () => {
    expect(niceScale(1234)).toBe(1000);
    expect(niceScale(2600)).toBe(2000);
    expect(niceScale(740)).toBe(500);
    expect(niceScale(0)).toBe(0);
  });

  it('lays out runways north-up and fitted to the drawing', () => {
    // A north–south runway and an east–west runway crossing near the same point
    const rows = [
      ['18', '36', 40.51, -3.5, 40.49, -3.5, 7000, 150, 'asphalt'],
      ['09', '27', 40.5, -3.51, 40.5, -3.49, 5000, 100, 'concrete'],
    ];
    const l = layoutRunways(rows, { size: 400, pad: 40 });
    const [ns, ew] = l.runways;
    expect(ns.y1).toBeLessThan(ns.y2); // the 18 end (north) is drawn above
    expect(Math.abs(ns.x1 - ns.x2)).toBeLessThan(0.001);
    expect(ew.x1).toBeLessThan(ew.x2); // the 09 end (west) is drawn on the left
    for (const r of l.runways) for (const v of [r.x1, r.x2, r.y1, r.y2]) {
      expect(v).toBeGreaterThanOrEqual(40 - 1e-6);
      expect(v).toBeLessThanOrEqual(360 + 1e-6);
    }
    expect(ns.bearing).toBeCloseTo(180, 0);
    expect(ns.widthM).toBeCloseTo(45.72, 2);
    expect(l.scale.units).toBeCloseTo(l.scale.metres / l.metresPerUnit, 6);
    expect(layoutRunways([])).toBeNull();
  });
});

describe('runway dataset', () => {
  const data = JSON.parse(fs.readFileSync('src/content/airports/runways.json', 'utf8'));
  const airports = new Set(JSON.parse(fs.readFileSync('src/content/airports/airports.json', 'utf8')).airports.map((a) => a[0]));
  it('only has listed airports, valid coordinates and known surfaces', () => {
    expect(data.source).toMatch(/OurAirports/);
    for (const [iata, rows] of Object.entries(data.runways)) {
      expect(airports.has(iata), iata).toBe(true);
      for (const r of rows) {
        expect(r).toHaveLength(9);
        expect(Math.abs(r[2]) <= 90 && Math.abs(r[4]) <= 90 && Math.abs(r[3]) <= 180 && Math.abs(r[5]) <= 180, iata).toBe(true);
        expect(['asphalt', 'concrete', 'grass', 'gravel', 'water', 'other', 'unknown']).toContain(r[8]);
      }
    }
  });
  it('matches known layouts', () => {
    expect(data.runways.MAD.map((r) => `${r[0]}/${r[1]}`).sort()).toEqual(['14L/32R', '14R/32L', '18L/36R', '18R/36L']);
    expect(data.runways.LHR.map((r) => `${r[0]}/${r[1]}`).sort()).toEqual(['09L/27R', '09R/27L']);
  });
});

describe('runway labels', () => {
  it('pushes apart labels that would overlap and keeps them inside the drawing', async () => {
    const { placeLabels } = await import('../../src/lib/airports/runways.js');
    // Two runways whose ends meet at (200, 200)
    const runways = [
      { le: '18', he: '36', x1: 200, y1: 60, x2: 200, y2: 200 },
      { le: '14', he: '32', x1: 200, y1: 200, x2: 300, y2: 300 },
    ];
    const labels = placeLabels(runways, { size: 400 });
    expect(labels.map((l) => l.id)).toEqual(['18', '36', '14', '32']);
    const [, l36, l14] = labels;
    expect(Math.abs(l36.x - l14.x) >= 30 || Math.abs(l36.y - l14.y) >= 15).toBe(true);
    const edge = placeLabels([{ le: '09', he: '27', x1: 2, y1: 200, x2: 398, y2: 200 }], { size: 400 });
    for (const l of edge) expect(l.x >= 16 && l.x <= 384).toBe(true);
  });
});
