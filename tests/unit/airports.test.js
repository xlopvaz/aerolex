import { describe, it, expect } from 'vitest';
import data from '../../src/content/airports/airports.json';
import { buildAirportIndex, searchAirports, icaoRegion } from '../../src/lib/airports/search.js';

const index = buildAirportIndex(data);
const codes = (r) => r.map((a) => a.iata);

describe('airport dataset', () => {
  it('has the expected shape and well-formed codes', () => {
    expect(data.fields).toEqual(['iata', 'icao', 'name', 'city', 'country', 'size', 'lat', 'lon', 'elevationFt', 'scheduled']);
    expect(data.airports.length).toBeGreaterThan(3000);
    for (const row of data.airports) {
      expect(row[0]).toMatch(/^[A-Z0-9]{3}$/);
      if (row[1] !== null) expect(row[1]).toMatch(/^[A-Z]{4}$/);
      expect(Math.abs(row[6])).toBeLessThanOrEqual(90);
      expect(Math.abs(row[7])).toBeLessThanOrEqual(180);
      expect(data.countries[row[4]]).toBeTruthy();
    }
  });
});

describe('searchAirports', () => {
  it('exact codes first', () => {
    expect(searchAirports(index, 'mad')[0]).toMatchObject({ iata: 'MAD', icao: 'LEMD', country: 'ES' });
    expect(searchAirports(index, 'LEST')[0]).toMatchObject({ iata: 'SCQ', city: 'Santiago de Compostela' });
    expect(searchAirports(index, 'egll')[0].iata).toBe('LHR');
  });
  it('cities and names, accent-insensitive', () => {
    expect(codes(searchAirports(index, 'coruna'))).toContain('LCG');
    expect(codes(searchAirports(index, 'Vigo'))[0]).toBe('VGO');
    expect(codes(searchAirports(index, 'heathrow'))).toContain('LHR');
    expect(codes(searchAirports(index, 'new york'))).toEqual(expect.arrayContaining(['JFK', 'LGA']));
  });
  it('empty query and limit', () => {
    expect(searchAirports(index, '  ')).toEqual([]);
    expect(searchAirports(index, 'a', 5).length).toBeLessThanOrEqual(5);
  });
  it('ICAO regions', () => {
    expect(icaoRegion('LEMD')).toBe('L');
    expect(icaoRegion('KJFK')).toBe('K');
    expect(icaoRegion('XXXX')).toBeNull();
    expect(icaoRegion(null)).toBeNull();
  });
});
