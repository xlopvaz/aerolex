import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { silhouetteGeometry, silhouetteSvg, silhouetteLabel } from '../../src/lib/aircraft/silhouette.js';
import es from '../../src/i18n/ui/es.json';
import en from '../../src/i18n/ui/en.json';

const families = fs.readdirSync('src/content/aircraft').map((f) => ({ id: f, ...JSON.parse(fs.readFileSync(`src/content/aircraft/${f}`, 'utf8')) }));

describe('generic aircraft silhouettes', () => {
  it('draws one nacelle per wing side visible and one window row per deck', () => {
    const twin = silhouetteSvg({ body: 'narrow', engines: 2, decks: 1 }, 'x');
    const quad = silhouetteSvg({ body: 'wide', engines: 4, decks: 2 }, 'x');
    expect(twin.match(/sil-engine/g)).toHaveLength(1);
    expect(quad.match(/sil-engine/g)).toHaveLength(2);
    expect(silhouetteGeometry({ body: 'narrow', engines: 2, decks: 1 }).windowRows).toHaveLength(1);
    expect(silhouetteGeometry({ body: 'wide', engines: 4, decks: 2 }).windowRows).toHaveLength(2);
    expect(silhouetteGeometry({ body: 'wide', engines: 2, decks: 1 }).fh).toBeGreaterThan(silhouetteGeometry({ body: 'narrow', engines: 2, decks: 1 }).fh);
  });

  it('is accessible and escapes the label', () => {
    const svg = silhouetteSvg({ body: 'wide', engines: 2, decks: 1 }, 'A & "B"');
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label="A &amp; &quot;B&quot;"');
    expect(svg).toContain('<title>A &amp; &quot;B&quot;</title>');
    expect(svg).not.toMatch(/NaN|undefined/);
  });

  it('rejects configurations it cannot draw', () => {
    expect(() => silhouetteGeometry({ body: 'narrow', engines: 3, decks: 1 })).toThrow();
    expect(() => silhouetteGeometry({ body: 'huge', engines: 2, decks: 1 })).toThrow();
  });

  it('builds the description in both languages', () => {
    expect(silhouetteLabel({ body: 'narrow', engines: 2, decks: 1 }, es.hangar.silhouette)).toBe('Silueta genérica de un bimotor de pasillo único');
    expect(silhouetteLabel({ body: 'wide', engines: 4, decks: 2 }, en.hangar.silhouette)).toBe('Generic silhouette of a four-engined twin-aisle airliner with two full decks');
  });

  it.each(families.map((f) => [f.id, f]))('%s has a drawable silhouette', (id, f) => {
    expect(() => silhouetteSvg(f.silhouette, 'x')).not.toThrow();
  });
});
