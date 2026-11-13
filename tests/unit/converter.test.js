import { describe, it, expect } from 'vitest';
import { convert, convertAll, CATEGORIES, displayDecimals } from '../../src/lib/units/converter.js';

describe('converter', () => {
  it.each([
    ['speed', 'kt', 'kmh', 1, 1.852],
    ['speed', 'mps', 'kt', 1, 1.9438444924],
    ['speed', 'mph', 'kmh', 1, 1.609344],
    ['distance', 'nm', 'km', 1, 1.852],
    ['distance', 'nm', 'sm', 1, 1.1507794480],
    ['altitude', 'ft', 'm', 10000, 3048],
    ['mass', 'lb', 'kg', 1, 0.45359237],
    ['mass', 't', 'lb', 1, 2204.6226218],
    ['pressure', 'hpa', 'inhg', 1013.25, 29.9212524],
    ['pressure', 'inhg', 'hpa', 29.92, 1013.2075],
    ['pressure', 'hpa', 'mmhg', 1013.25, 760.0000],
    ['volume', 'usgal', 'l', 1, 3.785411784],
    ['temperature', 'c', 'f', 0, 32],
    ['temperature', 'c', 'f', -40, -40],
    ['temperature', 'f', 'c', 212, 100],
    ['temperature', 'c', 'k', 15, 288.15],
  ])('%s %s→%s %d', (cat, from, to, v, expected) => {
    expect(convert(cat, from, to, v)).toBeCloseTo(expected, 3);
  });
  it('round-trips every pair', () => {
    for (const [cat, def] of Object.entries(CATEGORIES)) {
      for (const a of Object.keys(def.units)) for (const b of Object.keys(def.units)) {
        expect(convert(cat, b, a, convert(cat, a, b, 123.456))).toBeCloseTo(123.456, 6);
      }
    }
  });
  it('convertAll, invalid input and unknown units', () => {
    expect(convertAll('altitude', 'm', 1)).toEqual({ ft: 1 / 0.3048, m: 1 });
    expect(convert('speed', 'kt', 'kmh', NaN)).toBeNaN();
    expect(() => convert('speed', 'kt', 'furlong', 1)).toThrow();
    expect(displayDecimals(12345)).toBe(0);
    expect(displayDecimals(0.5)).toBe(4);
  });
});
