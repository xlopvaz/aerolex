/**
 * schema.org structured data (JSON-LD) for SEO (Phase 6). Pure builders: the layout and the
 * views pass plain values and get objects ready for <script type="application/ld+json">.
 */

const CONTEXT = 'https://schema.org';

/** Serialises JSON-LD safely inside a <script> element (no "</script>" or "<!--" breakouts). */
export function jsonLdString(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

/** WebSite, for the home pages. */
export function websiteLd({ name, url, lang, description }) {
  return { '@context': CONTEXT, '@type': 'WebSite', name, url, inLanguage: lang, description };
}

/**
 * BreadcrumbList from breadcrumb items ({ label, href? }) plus the current page URL.
 * @param {{ label: string, href?: string }[]} items @param {string} currentUrl @param {(p: string) => string} abs
 */
export function breadcrumbLd(items, currentUrl, abs) {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.label,
      item: i === items.length - 1 || !it.href ? currentUrl : abs(it.href),
    })),
  };
}

/** DefinedTermSet: the dictionary as a whole. */
export function termSetLd({ name, url, lang, description }) {
  return { '@context': CONTEXT, '@type': 'DefinedTermSet', name, url, inLanguage: lang, description };
}

/**
 * DefinedTerm: one dictionary entry. For abbreviations the expansion goes in alternateName.
 * @param {{ name: string, description: string, url: string, lang: string, alternateName?: string | null, setName: string, setUrl: string }} t
 */
export function definedTermLd({ name, description, url, lang, alternateName, setName, setUrl }) {
  const out = {
    '@context': CONTEXT,
    '@type': 'DefinedTerm',
    name,
    description,
    url,
    inLanguage: lang,
    inDefinedTermSet: { '@type': 'DefinedTermSet', name: setName, url: setUrl },
  };
  if (alternateName) out.alternateName = alternateName;
  return out;
}

/** Course: an Academy course (free, self-paced, online). */
export function courseLd({ name, description, url, lang, provider, providerUrl }) {
  return {
    '@context': CONTEXT,
    '@type': 'Course',
    name,
    description,
    url,
    inLanguage: lang,
    isAccessibleForFree: true,
    provider: { '@type': 'Organization', name: provider, sameAs: providerUrl },
  };
}
