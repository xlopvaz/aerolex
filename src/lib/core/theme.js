/**
 * Theme handling. The initial theme is applied by an inline script in <head>
 * (see BaseLayout) to avoid a flash; this module handles changes afterwards.
 */

/** @param {'system'|'light'|'dark'} pref */
export function resolveTheme(pref, prefersDark = matchMedia('(prefers-color-scheme: dark)').matches) {
  if (pref === 'light' || pref === 'dark') return pref;
  return prefersDark ? 'dark' : 'light';
}

/** @param {'light'|'dark'} theme */
export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.dispatchEvent(new CustomEvent('aerolex:theme', { detail: { theme } }));
}

/** @param {{ get(): any, update(fn: (s: any) => void): any, subscribe(fn: (s: any) => void): any }} store */
export function bindTheme(store) {
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const sync = () => applyTheme(resolveTheme(store.get().prefs.theme, mq.matches));
  mq.addEventListener('change', sync);
  store.subscribe(sync);
  sync();
}
