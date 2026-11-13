import { describe, it, expect } from 'vitest';
import { decodeMetar, explainGroup, explainIssue, parseWeather, tokenize } from '../../src/lib/metar/index.js';
import es from '../../src/i18n/ui/es.json';
import en from '../../src/i18n/ui/en.json';

const kinds = (r) => r.groups.map((g) => g.kind);
const find = (r, kind, section = 'main') => r.groups.find((g) => g.kind === kind && g.section === section);
const errors = (r) => r.issues.filter((i) => i.level === 'error').map((i) => i.code);
const warnings = (r) => r.issues.filter((i) => i.level === 'warning').map((i) => i.code);

describe('tokenize', () => {
  it('normalises case, spaces and the end marker, keeping positions', () => {
    const t = tokenize('metar  lemd 121830z=');
    expect(t.map((x) => x.text)).toEqual(['METAR', 'LEMD', '121830Z']);
    expect(t[1]).toMatchObject({ start: 7, end: 11 });
  });
});

describe('parseWeather', () => {
  it.each([
    ['-SHRA', { intensity: 'light', descriptor: 'SH', phenomena: ['RA'], vicinity: false }],
    ['+TSRAGR', { intensity: 'heavy', descriptor: 'TS', phenomena: ['RA', 'GR'] }],
    ['RA', { intensity: 'moderate', descriptor: null, phenomena: ['RA'] }],
    ['FZFG', { intensity: null, descriptor: 'FZ', phenomena: ['FG'] }],
    ['VCSH', { vicinity: true, descriptor: 'SH', phenomena: [] }],
    ['TS', { descriptor: 'TS', phenomena: [] }],
    ['BR', { intensity: null, phenomena: ['BR'] }],
  ])('%s', (code, expected) => expect(parseWeather(code)).toMatchObject(expected));
  it.each(['XX', 'RARA', '+', 'LEMD', 'Q1013'])('rejects %s', (code) => expect(parseWeather(code)).toBeNull());
});

describe('decodeMetar — a complete ICAO report', () => {
  const r = decodeMetar('METAR LEMD 131030Z 24012G25KT 210V280 9999 FEW030 SCT100 18/09 Q1017 NOSIG');
  it('decodes every group in order without issues', () => {
    expect(kinds(r)).toEqual(['type', 'station', 'time', 'wind', 'windVariation', 'visibility', 'clouds', 'clouds', 'temperature', 'pressure', 'trend']);
    expect(r.issues).toEqual([]);
    expect(r.type).toBe('METAR');
  });
  it('reads values correctly', () => {
    expect(find(r, 'time').data).toEqual({ day: 13, hour: 10, minute: 30 });
    expect(find(r, 'wind').data).toMatchObject({ direction: 240, speed: 12, gust: 25, unit: 'KT', variable: false, calm: false });
    expect(find(r, 'windVariation').data).toEqual({ from: 210, to: 280 });
    expect(find(r, 'visibility').data).toMatchObject({ unit: 'M', value: 9999, tenOrMore: true });
    expect(r.groups.filter((g) => g.kind === 'clouds').map((g) => g.data)).toEqual([
      { cover: 'FEW', height: 3000, type: null },
      { cover: 'SCT', height: 10000, type: null },
    ]);
    expect(find(r, 'temperature').data).toEqual({ temp: 18, dew: 9 });
    expect(find(r, 'pressure').data).toEqual({ unit: 'HPA', value: 1017 });
    expect(find(r, 'trend', 'trend').data).toEqual({ value: 'NOSIG' });
  });
  it('keeps character positions for highlighting', () => {
    const w = find(r, 'wind');
    expect('METAR LEMD 131030Z 24012G25KT'.slice(w.start, w.end)).toBe('24012G25KT');
  });
});

describe('decodeMetar — low visibility, RVR, fog and vertical visibility', () => {
  const r = decodeMetar('SPECI EGLL 130650Z 00000KT 0300 R27L/0450N R27R/P1500U R09/M0050V0200D FG VV001 07/07 Q1021');
  it('decodes calm wind, RVR groups and VV', () => {
    expect(r.type).toBe('SPECI');
    expect(find(r, 'wind').data.calm).toBe(true);
    const rvr = r.groups.filter((g) => g.kind === 'rvr').map((g) => g.data);
    expect(rvr[0]).toMatchObject({ runway: '27L', value: 450, trend: 'N', unit: 'M' });
    expect(rvr[1]).toMatchObject({ runway: '27R', value: 1500, above: true, trend: 'U' });
    expect(rvr[2]).toMatchObject({ runway: '09', value: 50, below: true, max: 200, trend: 'D' });
    expect(find(r, 'weather').data).toMatchObject({ phenomena: ['FG'] });
    expect(find(r, 'clouds').data).toEqual({ verticalVisibility: 100 });
    expect(r.issues).toEqual([]);
  });
});

describe('decodeMetar — US format', () => {
  const r = decodeMetar('METAR KJFK 131151Z 31015G24KT 1 1/2SM -RA BR BKN008 OVC015 08/M03 A3012 RMK AO2 SLP199');
  it('handles statute miles, A-pressure, negative dew point and remarks', () => {
    expect(find(r, 'visibility').data).toMatchObject({ unit: 'SM', value: 1.5 });
    expect(find(r, 'visibility').raw).toBe('1 1/2SM');
    expect(find(r, 'temperature').data).toEqual({ temp: 8, dew: -3 });
    expect(find(r, 'pressure').data).toEqual({ unit: 'INHG', value: 30.12 });
    const rmk = r.groups.find((g) => g.kind === 'remarks');
    expect(rmk.raw).toBe('RMK AO2 SLP199');
    expect(r.issues).toEqual([]);
  });
  it.each([['10SM', 10], ['3/4SM', 0.75], ['P6SM', 6], ['M1/4SM', 0.25]])('visibility %s', (v, value) => {
    const g = find(decodeMetar(`METAR KBOS 131151Z 18005KT ${v} CLR 10/05 A3001`), 'visibility');
    expect(g.data.value).toBe(value);
  });
});

describe('decodeMetar — trend groups', () => {
  const r = decodeMetar('METAR LEST 130630Z 22018G30KT 4000 -RA BKN008 OVC015 12/11 Q1004 TEMPO FM0700 TL0900 2000 RA BKN005');
  it('decodes the trend section separately', () => {
    const trend = r.groups.filter((g) => g.section === 'trend');
    expect(trend.map((g) => g.kind)).toEqual(['trend', 'trendTime', 'trendTime', 'visibility', 'weather', 'clouds']);
    expect(trend[1].data).toEqual({ prefix: 'FM', hour: 7, minute: 0 });
    expect(r.issues).toEqual([]);
  });
  it('accepts NSW and NSC in trends', () => {
    const t = decodeMetar('METAR LEVX 130600Z 20010KT 3000 RA BKN010 14/12 Q1008 BECMG NSW NSC');
    expect(t.groups.filter((g) => g.section === 'trend').map((g) => g.data)).toEqual([{ value: 'BECMG' }, { nsw: true }, { special: 'NSC' }]);
  });
});

describe('decodeMetar — other groups', () => {
  it('CAVOK, AUTO, NDV, recent weather and wind shear', () => {
    const r = decodeMetar('METAR LECO 131200Z AUTO 03008KT CAVOK 20/12 Q1020 RETSRA WS R21');
    expect(kinds(r)).toEqual(['type', 'station', 'time', 'modifier', 'wind', 'cavok', 'temperature', 'pressure', 'recent', 'windShear']);
    expect(find(r, 'windShear').data).toEqual({ runway: '21' });
    expect(r.issues).toEqual([]);
    const n = decodeMetar('METAR LEMD 131200Z AUTO 24005KT 9999NDV NCD 22/05 Q1018');
    expect(find(n, 'visibility').data.ndv).toBe(true);
    expect(find(n, 'clouds').data).toEqual({ special: 'NCD' });
  });
  it('variable wind, metres per second, minimum visibility and CB', () => {
    const r = decodeMetar('METAR UUEE 131200Z VRB02MPS 6000 1500SW SCT020CB 05/03 Q1012');
    expect(find(r, 'wind').data).toMatchObject({ variable: true, speed: 2, unit: 'MPS' });
    expect(find(r, 'minVisibility').data).toEqual({ value: 1500, direction: 'SW' });
    expect(find(r, 'clouds').data).toEqual({ cover: 'SCT', height: 2000, type: 'CB' });
  });
  it('WS ALL RWY and COR', () => {
    const r = decodeMetar('METAR COR LEBL 131200Z 13010KT 9999 FEW020 19/12 Q1015 WS ALL RWY');
    expect(find(r, 'modifier').data.value).toBe('COR');
    expect(find(r, 'windShear').data).toEqual({ all: true });
  });
  it('NIL reports skip the missing-group warnings', () => {
    expect(decodeMetar('METAR LEMD 131200Z NIL').issues).toEqual([]);
  });
});

describe('decodeMetar — errors and warnings', () => {
  it('empty input', () => expect(errors(decodeMetar('  '))).toEqual(['empty']));
  it('missing station and time', () => {
    const r = decodeMetar('24010KT 9999 18/09 Q1017');
    expect(errors(r)).toEqual(expect.arrayContaining(['noStation', 'noTime']));
  });
  it('unknown groups are reported, never guessed', () => {
    const r = decodeMetar('METAR LEMD 131030Z 24012KT 9999 ZZZZZ FEW030 18/09 Q1017');
    const u = r.groups.find((g) => g.kind === 'unknown');
    expect(u.raw).toBe('ZZZZZ');
    expect(warnings(r)).toContain('unknownGroup');
  });
  it('impossible values', () => {
    expect(errors(decodeMetar('METAR LEMD 322599Z 24012KT 9999 18/09 Q1017'))).toContain('invalid.range');
    expect(errors(decodeMetar('METAR LEMD 131030Z 24012G10KT 9999 18/09 Q1017'))).toContain('invalid.gust');
    expect(errors(decodeMetar('METAR LEMD 131030Z 24012KT 9999 09/18 Q1017'))).toContain('invalid.dewAboveTemp');
    expect(errors(decodeMetar('METAR LEMD 131030Z 24012KT 9999 18/09 Q0500'))).toContain('invalid.range');
  });
  it('warnings for missing groups, CAVOK with weather, out of order and odd wind direction', () => {
    expect(warnings(decodeMetar('METAR LEMD 131030Z 9999 18/09'))).toEqual(expect.arrayContaining(['noWind', 'noPressure']));
    expect(warnings(decodeMetar('METAR LEMD 131030Z 24012KT CAVOK FEW030 18/09 Q1017'))).toContain('cavokWithWeather');
    expect(warnings(decodeMetar('METAR LEMD 131030Z 24012KT 18/09 9999 Q1017'))).toContain('outOfOrder');
    expect(warnings(decodeMetar('METAR LEMD 131030Z 24512KT 9999 18/09 Q1017'))).toContain('windNotTens');
  });
  it('a TAF pasted in the METAR decoder', () => {
    expect(errors(decodeMetar('TAF LEMD 121700Z 1218/1324 24012KT 9999 SCT030'))).toContain('isTaf');
  });
});

describe('explain', () => {
  const sample = 'METAR KJFK 131151Z VRB03KT 3/4SM R04R/1800V3000FT/U +TSRAGR VCSH FEW008 BKN020CB OVC///  M02/M05 A2992 RERA WS ALL RWY TEMPO FM1300 NSW RMK AO2';
  it('every group gets a complete explanation in both languages (no unfilled placeholders)', () => {
    for (const [lang, M] of [['es', es.metar], ['en', en.metar]]) {
      const r = decodeMetar(sample);
      for (const g of r.groups) {
        const text = explainGroup(g, M, lang);
        expect(text, `${lang} ${g.kind} ${g.raw}`).toBeTruthy();
        expect(text, `${lang} ${g.kind} ${g.raw}`).not.toMatch(/\{\w+\}|undefined|NaN/);
      }
      for (const i of decodeMetar('METAR LEMD 322599Z 24012G10KT 09/18 Q0500 ZZZ').issues) {
        expect(explainIssue(i, M)).not.toMatch(/\{\w+\}|undefined|^invalid|^no[A-Z]/);
      }
    }
  });
  it('converts units in the explanation', () => {
    const r = decodeMetar('METAR LEMD 131030Z 24010KT 9999 18/09 Q1013');
    expect(explainGroup(find(r, 'wind'), en.metar, 'en')).toBe('Wind from 240° at 10 kt (≈ 19 km/h).');
    expect(explainGroup(find(r, 'pressure'), es.metar, 'es')).toBe('QNH 1013 hPa (≈ 29,91 inHg).');
    const us = decodeMetar('METAR KJFK 131151Z 31015KT 1/2SM FG OVC002 08/08 A2992');
    expect(explainGroup(find(us, 'visibility'), en.metar, 'en')).toBe('Visibility 0.5 statute miles (≈ 800 m).');
    expect(explainGroup(find(us, 'pressure'), en.metar, 'en')).toBe('Altimeter setting 29.92 inHg (≈ 1013 hPa).');
  });
  it('builds readable weather phrases', () => {
    const w = (code, lang) => explainGroup(find(decodeMetar(`METAR LEMD 131030Z 24010KT 5000 ${code} BKN010 10/08 Q1010`), 'weather'), (lang === 'es' ? es : en).metar, lang);
    expect(w('-SHRA', 'es')).toBe('Lluvia (en forma de chubascos, intensidad ligera).');
    expect(w('-SHRA', 'en')).toBe('Rain (showers, light intensity).');
    expect(w('VCTS', 'en')).toBe('Thunderstorm in the vicinity of the aerodrome, not at it.');
    expect(w('FZFG', 'es')).toBe('Niebla (engelante).');
    expect(w('+FC', 'en')).toBe('Tornado or waterspout.');
  });
});
