import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { ROUTES } from '../../src/i18n/routes.js';

const courses = Object.fromEntries(fs.readdirSync('src/content/courses').map((f) => [f.replace(/\.json$/, ''), JSON.parse(fs.readFileSync(`src/content/courses/${f}`, 'utf8'))]));
const notes = fs.readdirSync('src/content/notes').map((f) => ({ file: f, ...JSON.parse(fs.readFileSync(`src/content/notes/${f}`, 'utf8')) }));
const text = (v, where) => {
  for (const l of ['es', 'en']) expect(typeof v?.[l] === 'string' && v[l].trim().length > 10, `${where} ${l}`).toBe(true);
};

describe('course notes', () => {
  it('every course has notes, and every notes file belongs to a course', () => {
    expect(notes.map((n) => n.course).sort()).toEqual(Object.keys(courses).sort());
    for (const n of notes) expect(n.file, n.course).toBe(`${n.course}.json`);
  });

  for (const n of notes) {
    it(`${n.course}: one entry per lesson, in course order, bilingual, as a draft`, () => {
      expect(n.lessons.map((l) => l.lesson)).toEqual(courses[n.course].lessons);
      expect(n.review.status).toBe('draft');
      for (const l of n.lessons) {
        text(l.key, `${n.course}/${l.lesson} key`);
        expect(l.points.length, `${n.course}/${l.lesson} points`).toBeGreaterThanOrEqual(3);
        expect(l.points.length).toBeLessThanOrEqual(7);
        l.points.forEach((p, i) => text(p, `${n.course}/${l.lesson} point ${i + 1}`));
        // Both languages carry the same list: no point missing in one of them
        expect(new Set(l.points.map((p) => p.es)).size, `${n.course}/${l.lesson} duplicate points`).toBe(l.points.length);
      }
    });
  }

  it('note pages cannot collide with course pages', () => {
    for (const lang of ['es', 'en']) {
      const notesSegment = ROUTES.academyNotes.slug[lang].split('/').pop();
      expect(Object.keys(courses), lang).not.toContain(notesSegment);
    }
  });
});
