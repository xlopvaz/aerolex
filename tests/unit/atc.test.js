import { describe, it, expect } from 'vitest';
import { normalisePhraseology as N, checkReadback, firstWrongElement } from '../../src/lib/atc/readback.js';
import data from '../../src/content/samples/atc.json';
import es from '../../src/i18n/ui/es.json';
import en from '../../src/i18n/ui/en.json';

describe('normalisePhraseology', () => {
  it.each([
    ['Climb flight level eight zero', 'climb fl 80'],
    ['climb FL80', 'climb fl 80'],
    ['squawk four five two one', 'squawk 4521'],
    ['squawk 4521', 'squawk 4521'],
    ['Departure one two zero decimal four five', 'departure 120.45'],
    ['departure 120.45', 'departure 120.45'],
    ['runway three two right', 'runway 32r'],
    ['Runway 32R', 'runway 32r'],
    ['QNH one zero one tree', 'qnh 1013'],
    ['heading niner zero', 'heading 90'],
    ['five thousand feet', '5000 feet'],
    ['two thousand five hundred feet', '2500 feet'],
    ['ROSAL one alpha departure', 'rosal 1a departure'],
    ['via taxiway Alpha', 'via taxiway a'],
    ['cleared for take-off', 'cleared for take off'],
    ['Lexair one two three.', 'lexair 123'],
  ])('%s → %s', (input, expected) => expect(N(input)).toBe(expected));
});

const steps = data.scenarios.flatMap((s) => s.steps);

describe('scenario content', () => {
  it('every model read-back contains its elements and ends with the callsign', () => {
    for (const s of steps) {
      const r = checkReadback(s.readback, s, data.callsign);
      expect(r.ok, `${s.id}: ${JSON.stringify(r)}`).toBe(true);
      expect(r.callsignLast, s.id).toBe(true);
    }
  });
  it('every wrong read-back fails exactly on its declared element', () => {
    for (const s of steps) expect(firstWrongElement(s.wrong.text, s), s.id).toBe(s.wrong.key);
  });
  it('every element key has a label in both languages', () => {
    for (const s of steps) for (const e of s.elements) {
      expect(es.atc.elements[e.key], e.key).toBeTruthy();
      expect(en.atc.elements[e.key], e.key).toBeTruthy();
    }
  });
});

describe('checkReadback', () => {
  const step = steps.find((s) => s.id === 'clearance');
  it('accepts digits and words, any order', () => {
    expect(checkReadback('Squawk 4521, FL80, cleared Madrid ROSAL 1A, Lexair 123', step, data.callsign).ok).toBe(true);
  });
  it('reports the missing or wrong elements and the callsign', () => {
    const r = checkReadback('Cleared ROSAL one alpha, flight level eight zero, squawk four five one two', step, data.callsign);
    expect(r.elements).toEqual([{ key: 'route', ok: true }, { key: 'level', ok: true }, { key: 'squawk', ok: false }]);
    expect(r.callsign).toBe(false);
    expect(r.ok).toBe(false);
  });
  it('"Roger" is never a valid read-back', () => {
    expect(checkReadback('Roger, Lexair one two three', step, data.callsign).ok).toBe(false);
  });
});
