import { describe, it, expect } from 'vitest';
import { createQuestion, rngFrom, LEVELS } from '../../src/lib/practice/generate.js';
import { tafMessages } from '../../src/lib/taf/render.js';
import library from '../../src/content/samples/practice.json';
import es from '../../src/i18n/ui/es.json';
import en from '../../src/i18n/ui/en.json';

const setups = [['es', es], ['en', en]].map(([lang, d]) => ({ lang, M: tafMessages(d.metar, d.taf), ui: d.practice }));

describe('practice generator', () => {
  it.each(LEVELS)('level %i: 200 questions are well formed in both languages', (level) => {
    for (const { lang, M, ui } of setups) {
      const rng = rngFrom(level * 1000 + (lang === 'es' ? 1 : 2));
      for (let n = 0; n < 200; n++) {
        const q = createQuestion(level, library, M, lang, ui, rng);
        expect(q.level).toBe(level);
        expect(q.options.length).toBeGreaterThanOrEqual(3);
        expect(new Set(q.options.map((o) => o.text)).size).toBe(q.options.length);
        expect(q.options.filter((o) => o.id === q.answer)).toHaveLength(1);
        const all = [q.prompt, q.explanation, ...q.options.map((o) => o.text)].join(' ');
        expect(all, JSON.stringify(q)).not.toMatch(/\{\w+\}|undefined|NaN|null/);
        if (q.highlight) expect(q.message.slice(q.highlight.start, q.highlight.end).length).toBeGreaterThan(0);
      }
    }
  });
  it('is reproducible with the same seed', () => {
    const { lang, M, ui } = setups[1];
    const a = createQuestion(2, library, M, lang, ui, rngFrom(42));
    const b = createQuestion(2, library, M, lang, ui, rngFrom(42));
    expect(a).toEqual(b);
  });
  it('level 1 answers name the highlighted group kind', () => {
    const { lang, M, ui } = setups[1];
    const rng = rngFrom(7);
    for (let n = 0; n < 30; n++) {
      const q = createQuestion(1, library, M, lang, ui, rng);
      const correct = q.options.find((o) => o.id === q.answer).text;
      expect(Object.values(M.kinds)).toContain(correct);
    }
  });
  it('level 3 ceiling question uses the decoder ceiling', () => {
    const { lang, M, ui } = setups[1];
    const rng = rngFrom(3);
    let seen = 0;
    for (let n = 0; n < 200 && seen < 5; n++) {
      const q = createQuestion(3, library, M, lang, ui, rng);
      if (q.prompt !== ui.prompts.ceiling) continue;
      seen++;
      const correct = q.options.find((o) => o.id === q.answer).text;
      if (q.message.includes('VV001')) expect(correct).toBe('100 ft');
      if (q.message.includes('CAVOK')) expect(correct).toBe(ui.answers.noCeiling);
    }
    expect(seen).toBeGreaterThan(0);
  });
});
