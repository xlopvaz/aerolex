import { describe, it, expect } from 'vitest';
import { buildLiveFile, toIso, isStale, ageMinutes, metarItem, tafItem } from '../../src/lib/live/awc.js';

const stations = [{ id: 'LEMD', name: 'Madrid-Barajas' }, { id: 'LEST', name: 'Santiago' }, { id: 'KJFK', name: 'New York JFK' }];
const now = new Date('2026-11-13T07:00:00Z');

describe('AWC normalisation', () => {
  it('converts times', () => {
    expect(toIso(1763017800)).toBe('2025-11-13T07:10:00.000Z');
    expect(toIso(1763017800000)).toBe('2025-11-13T07:10:00.000Z');
    expect(toIso('2026-11-13 06:30:00')).toBe('2026-11-13T06:30:00.000Z');
    expect(toIso('2026-11-13T06:30:00Z')).toBe('2026-11-13T06:30:00.000Z');
    expect(toIso('nonsense')).toBeNull();
    expect(toIso(undefined)).toBeNull();
  });
  it('reads METAR and TAF items with alternative field names', () => {
    expect(metarItem({ rawOb: 'LEMD 130630Z 24005KT CAVOK 08/02 Q1022 NOSIG', reportTime: '2026-11-13T06:30:00.000Z' })).toEqual({ raw: 'LEMD 130630Z 24005KT CAVOK 08/02 Q1022 NOSIG', time: '2026-11-13T06:30:00.000Z' });
    expect(metarItem({ raw_text: 'X', observation_time: '2026-11-13T06:00:00Z' }).time).toBe('2026-11-13T06:00:00.000Z');
    expect(metarItem({ icaoId: 'LEMD' })).toBeNull();
    expect(tafItem({ rawTAF: 'TAF LEMD 130500Z\n  1306/1412 24008KT CAVOK', issueTime: '2026-11-13T05:00:00Z' }).raw).toBe('TAF LEMD 130500Z 1306/1412 24008KT CAVOK');
  });
  it('builds the published file, keeping the configured order and the latest report', () => {
    const metar = [
      { icaoId: 'LEMD', rawOb: 'LEMD 130600Z 24005KT CAVOK 07/02 Q1022', reportTime: '2026-11-13T06:00:00Z' },
      { icaoId: 'LEMD', rawOb: 'LEMD 130630Z 24005KT CAVOK 08/02 Q1022', reportTime: '2026-11-13T06:30:00Z' },
      { icaoId: 'KJFK', rawOb: 'KJFK 130551Z 31010KT 10SM FEW250 05/M04 A3021', obsTime: 1763013060 },
      { icaoId: 'ZZZZ', rawOb: 'ignored' },
    ];
    const taf = [{ icaoId: 'LEMD', rawTAF: 'TAF LEMD 130500Z 1306/1412 24008KT CAVOK', issueTime: '2026-11-13T05:00:00Z' }];
    const f = buildLiveFile(stations, metar, taf, now);
    expect(f.fetchedAt).toBe('2026-11-13T07:00:00.000Z');
    expect(f.stations.map((s) => s.id)).toEqual(['LEMD', 'LEST', 'KJFK']);
    expect(f.stations[0].metar.raw).toContain('130630Z');
    expect(f.stations[0].taf.raw).toBe('TAF LEMD 130500Z 1306/1412 24008KT CAVOK');
    expect(f.stations[1]).toMatchObject({ metar: null, taf: null });
    expect(f.stations[2].metar.time).toBeTruthy();
  });
  it('survives unexpected responses', () => {
    const f = buildLiveFile(stations, { error: 'x' }, null, now, ['metar: HTTP 500']);
    expect(f.stations.every((s) => s.metar === null && s.taf === null)).toBe(true);
    expect(f.errors).toEqual(['metar: HTTP 500']);
  });
  it('marks data older than 2 hours as stale', () => {
    expect(isStale('2026-11-13T05:30:00Z', now)).toBe(false);
    expect(isStale('2026-11-13T04:59:00Z', now)).toBe(true);
    expect(isStale(null, now)).toBe(true);
    expect(ageMinutes('2026-11-13T06:30:00Z', now)).toBe(30);
  });
});
