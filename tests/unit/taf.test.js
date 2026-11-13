import { describe, it, expect } from 'vitest';
import { decodeTaf, conditionsAt, segments, timeAt, validityHours, offsetHours } from '../../src/lib/taf/index.js';

const MADRID = 'TAF LEMD 121700Z 1218/1324 24012KT 9999 SCT030 TX24/1315Z TN07/1306Z BECMG 1220/1222 VRB03KT TEMPO 1303/1308 3000 BR BKN008 BECMG 1310/1312 27015KT';
const SANTIAGO = 'TAF LEST 130500Z 1306/1406 21015KT 6000 -RA BKN012 TEMPO 1306/1312 3000 RA BKN006 PROB30 TEMPO 1312/1316 TSRA BKN015CB BECMG 1316/1318 30010KT 9999 NSW SCT025';
const JFK = 'TAF KJFK 131130Z 1312/1418 31012KT P6SM FEW050 FM132200 VRB04KT P6SM SKC FM140600 18008KT 5SM BR OVC015';
const codes = (r, level) => r.issues.filter((i) => i.level === level).map((i) => i.code);

describe('decodeTaf — header and periods', () => {
  const r = decodeTaf(MADRID);
  it('reads the header', () => {
    expect(r.type).toBe('TAF');
    expect(r.station).toBe('LEMD');
    expect(r.issued).toEqual({ day: 12, hour: 17, minute: 0 });
    expect(r.validity).toEqual({ from: { day: 12, hour: 18, minute: 0 }, to: { day: 13, hour: 24, minute: 0 } });
    expect(r.issues).toEqual([]);
  });
  it('splits base and change groups', () => {
    expect(r.periods.map((p) => p.kind)).toEqual(['BASE', 'BECMG', 'TEMPO', 'BECMG']);
    expect(r.periods[0].conditions).toMatchObject({ wind: { direction: 240, speed: 12 }, visibility: { value: 9999 } });
    expect(r.periods[0].conditions.clouds).toEqual([{ cover: 'SCT', height: 3000, type: null }]);
    expect(r.periods[2].conditions.weather[0].phenomena).toEqual(['BR']);
    expect(r.groups.filter((g) => g.kind === 'extremeTemp').map((g) => g.data)).toEqual([
      { which: 'TX', value: 24, at: { day: 13, hour: 15, minute: 0 } },
      { which: 'TN', value: 7, at: { day: 13, hour: 6, minute: 0 } },
    ]);
  });
  it('PROB30 TEMPO and FM groups', () => {
    const s = decodeTaf(SANTIAGO);
    expect(s.periods.map((p) => [p.kind, p.prob, p.tempo])).toEqual([['BASE', null, false], ['TEMPO', null, true], ['PROB', 30, true], ['BECMG', null, false]]);
    expect(s.issues).toEqual([]);
    const j = decodeTaf(JFK);
    expect(j.periods.map((p) => p.kind)).toEqual(['BASE', 'FM', 'FM']);
    expect(j.periods[1].from).toEqual({ day: 13, hour: 22, minute: 0 });
    expect(j.issues).toEqual([]);
  });
});

describe('timeline', () => {
  it('validity length and segments', () => {
    const r = decodeTaf(MADRID);
    expect(validityHours(r)).toBe(30);
    expect(segments(r).map((s) => [s.kind, s.start, s.end])).toEqual([['BASE', 0, 30], ['BECMG', 2, 4], ['TEMPO', 9, 14], ['BECMG', 16, 18]]);
    expect(timeAt(r, 12)).toEqual({ day: 13, hour: 6, minute: 0 });
  });
  it('conditions at 06 UTC on day 13 (lesson example)', () => {
    const r = decodeTaf(MADRID);
    const c = conditionsAt(r, 12);
    expect(c.prevailing.wind).toMatchObject({ variable: true, speed: 3 }); // first BECMG done
    expect(c.prevailing.visibility.value).toBe(9999);
    expect(c.prevailing.clouds[0]).toMatchObject({ cover: 'SCT', height: 3000 });
    expect(c.temporary).toHaveLength(1);
    expect(c.temporary[0].conditions.visibility.value).toBe(3000);
  });
  it('BECMG is in transition during its period and applied after it', () => {
    const r = decodeTaf(MADRID);
    expect(conditionsAt(r, 17).becoming).toHaveLength(1);
    expect(conditionsAt(r, 17).prevailing.wind.variable).toBe(true);
    expect(conditionsAt(r, 18).prevailing.wind).toMatchObject({ direction: 270, speed: 15 });
  });
  it('NSW clears weather and FM replaces everything', () => {
    const s = decodeTaf(SANTIAGO);
    const late = conditionsAt(s, 20);
    expect(late.prevailing.weather).toEqual([]);
    expect(late.prevailing.wind.direction).toBe(300);
    expect(conditionsAt(s, 7).temporary.map((t) => t.kind)).toEqual(['PROB']);
    const j = decodeTaf(JFK);
    const night = conditionsAt(j, 11); // 23 UTC on day 13
    expect(night.prevailing.wind.variable).toBe(true);
    expect(night.prevailing.clouds).toEqual([{ special: 'SKC' }]);
    expect(conditionsAt(j, 19).prevailing.weather[0].phenomena).toEqual(['BR']);
    expect(segments(j)[1]).toMatchObject({ start: 10, end: 18 });
  });
  it('crosses the end of the month', () => {
    const r = decodeTaf('TAF LEBL 301700Z 3018/0124 13010KT 9999 FEW030 FM302200 VRB03KT CAVOK');
    expect(r.monthDays).toBe(30);
    expect(validityHours(r)).toBe(30);
    expect(timeAt(r, 7)).toEqual({ day: 1, hour: 1, minute: 0 });
    expect(offsetHours({ day: 1, hour: 6 }, { day: 30, hour: 18 }, 30, 31)).toBe(36);
  });
});

describe('decodeTaf — issues', () => {
  it('empty and not a TAF', () => {
    expect(codes(decodeTaf(''), 'error')).toEqual(['empty']);
    expect(codes(decodeTaf('METAR LEMD 131030Z 24012KT 9999 18/09 Q1017'), 'error')).toContain('notTaf');
  });
  it('missing validity, odd validity length, BECMG too long, outside validity, reversed', () => {
    expect(codes(decodeTaf('TAF LEMD 121700Z 24012KT 9999'), 'error')).toContain('noValidity');
    expect(codes(decodeTaf('TAF LEMD 121700Z 1218/1220 24012KT 9999'), 'warning')).toContain('validityLength');
    expect(codes(decodeTaf('TAF LEMD 121700Z 1218/1324 24012KT 9999 BECMG 1300/1306 VRB03KT'), 'warning')).toContain('becmgTooLong');
    expect(codes(decodeTaf('TAF LEMD 121700Z 1218/1324 24012KT 9999 TEMPO 1406/1408 3000'), 'warning')).toContain('outsideValidity');
    expect(codes(decodeTaf('TAF LEMD 121700Z 1218/1324 24012KT 9999 TEMPO 1308/1303 3000'), 'error')).toContain('periodReversed');
  });
  it('invalid PROB, missing change period and unknown groups', () => {
    expect(codes(decodeTaf('TAF LEMD 121700Z 1218/1324 24012KT 9999 PROB50 1303/1306 3000'), 'error')).toContain('invalid.prob');
    expect(codes(decodeTaf('TAF LEMD 121700Z 1218/1324 24012KT 9999 TEMPO 3000 BR'), 'error')).toContain('noChangePeriod');
    const u = decodeTaf('TAF LEMD 121700Z 1218/1324 24012KT 9999 QNH1012INS');
    expect(u.groups.find((g) => g.kind === 'unknown').raw).toBe('QNH1012INS');
  });
  it('AMD and NIL', () => {
    const a = decodeTaf('TAF AMD LEMD 121900Z 1218/1324 24012KT CAVOK');
    expect(a.groups.find((g) => g.kind === 'modifier').data.value).toBe('AMD');
    expect(decodeTaf('TAF LEMD 121700Z 1218/1324 NIL').issues).toEqual([]);
  });
});

import es from '../../src/i18n/ui/es.json';
import en from '../../src/i18n/ui/en.json';
import { renderTaf, tafMessages, explainTafGroup } from '../../src/lib/taf/render.js';

describe('TAF explanations and rendering', () => {
  const all = [MADRID, SANTIAGO, JFK, 'TAF AMD LEBL 301700Z 3018/0124 13010KT 9999 FEW030 PROB40 0106/0109 0800 FG ZZZ PROB50 0110/0112 3000'];
  it('every group and issue is explained in both languages, with no placeholders left', () => {
    for (const [lang, d] of [['es', es], ['en', en]]) {
      const M = tafMessages(d.metar, d.taf);
      const ui = { ...d.metarTool, ...d.tafTool };
      for (const raw of all) {
        const taf = decodeTaf(raw);
        for (const g of taf.groups) expect(explainTafGroup(g, M, lang, taf), `${lang} ${g.raw}`).not.toMatch(/\{\w+\}|undefined|NaN/);
        const out = renderTaf(taf, 5, M, lang, ui);
        for (const html of Object.values(out)) expect(String(html)).not.toMatch(/\{\w+\}|undefined|NaN/);
      }
    }
  });
  it('explains the validity and the "conditions at" panel', () => {
    const M = tafMessages(en.metar, en.taf);
    const ui = { ...en.metarTool, ...en.tafTool };
    const taf = decodeTaf(MADRID);
    expect(explainTafGroup(taf.groups.find((g) => g.kind === 'validity'), M, 'en', taf)).toBe('Valid from day 12 at 18:00 UTC to day 13 at 24:00 UTC (30 hours).');
    const at = renderTaf(taf, 12, M, 'en', ui).at;
    expect(at).toContain('Forecast for day 13 at 06:00 UTC');
    expect(at).toContain('Temporarily (TEMPO)');
    expect(at).toContain('Mist.');
  });
});
