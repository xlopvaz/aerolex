import { describe, expect, it } from 'vitest';
import { pageLinks, sitemapXml } from '../../scripts/lib/sitemap.mjs';
import { breadcrumbLd, courseLd, definedTermLd, jsonLdString, termSetLd, websiteLd } from '../../src/lib/seo/structured-data.js';

describe('sitemap', () => {
  const html = `<html><head><title>x</title>
    <link rel="canonical" href="https://x.io/aerolex/es/diccionario/metar/" />
    <link rel="alternate" hreflang="es" href="https://x.io/aerolex/es/diccionario/metar/" />
    <link rel="alternate" hreflang="en" href="https://x.io/aerolex/en/dictionary/metar/" />
    <link rel="icon" href="/favicon.svg" /></head><body><link rel="canonical" href="https://wrong/" /></body></html>`;
  it('reads canonical and hreflang alternates from the head only', () => {
    expect(pageLinks(html)).toEqual({
      canonical: 'https://x.io/aerolex/es/diccionario/metar/',
      alternates: [{ lang: 'es', href: 'https://x.io/aerolex/es/diccionario/metar/' }, { lang: 'en', href: 'https://x.io/aerolex/en/dictionary/metar/' }],
      noindex: false,
    });
    expect(pageLinks('<head><meta name="robots" content="noindex"></head>').noindex).toBe(true);
    expect(pageLinks('<head></head>').canonical).toBeNull();
  });
  it('writes a sorted, escaped sitemap with alternates', () => {
    const xml = sitemapXml([
      { loc: 'https://x.io/b/?a=1&b=2', alternates: [] },
      { loc: 'https://x.io/a/', alternates: [{ lang: 'en', href: 'https://x.io/a-en/' }] },
    ]);
    expect(xml.indexOf('https://x.io/a/')).toBeLessThan(xml.indexOf('https://x.io/b/'));
    expect(xml).toContain('<loc>https://x.io/b/?a=1&amp;b=2</loc>');
    expect(xml).toContain('<xhtml:link rel="alternate" hreflang="en" href="https://x.io/a-en/"/>');
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  });
});

describe('structured data', () => {
  it('serialises JSON-LD safely inside a script element', () => {
    const s = jsonLdString({ name: '</script><script>alert(1)</script> & <!--' });
    expect(s).not.toMatch(/<|>/);
    expect(JSON.parse(s).name).toBe('</script><script>alert(1)</script> & <!--');
  });
  it('builds schema.org objects', () => {
    expect(websiteLd({ name: 'AeroLex', url: 'u', lang: 'es', description: 'd' })).toMatchObject({ '@type': 'WebSite', inLanguage: 'es' });
    expect(termSetLd({ name: 'Dic', url: 'u', lang: 'en', description: 'd' })['@type']).toBe('DefinedTermSet');
    const term = definedTermLd({ name: 'METAR', description: 'Routine report', url: 'u', lang: 'en', alternateName: 'Meteorological aerodrome report', setName: 'Dic', setUrl: 's' });
    expect(term).toMatchObject({ '@type': 'DefinedTerm', alternateName: 'Meteorological aerodrome report', inDefinedTermSet: { '@type': 'DefinedTermSet', url: 's' } });
    expect(definedTermLd({ name: 'Runway', description: 'd', url: 'u', lang: 'en', alternateName: null, setName: 'D', setUrl: 's' })).not.toHaveProperty('alternateName');
    expect(courseLd({ name: 'TAF', description: 'd', url: 'u', lang: 'es', provider: 'AeroLex', providerUrl: 'p' })).toMatchObject({ '@type': 'Course', isAccessibleForFree: true, provider: { '@type': 'Organization', name: 'AeroLex' } });
    const bc = breadcrumbLd([{ label: 'Home', href: '/aerolex/en/' }, { label: 'Dictionary' }], 'https://x.io/aerolex/en/dictionary/', (p) => `https://x.io${p}`);
    expect(bc.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://x.io/aerolex/en/' },
      { '@type': 'ListItem', position: 2, name: 'Dictionary', item: 'https://x.io/aerolex/en/dictionary/' },
    ]);
  });
});
