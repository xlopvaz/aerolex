/**
 * User-specific dictionary data (favourites, recent searches, recently viewed),
 * stored by entry ID in the app store — independent of language and URL.
 */
export const MAX_RECENT_SEARCHES = 10;
export const MAX_VIEWED = 20;

export function isFavorite(state, id) {
  return state.favorites.terms.includes(id);
}

/** @returns {boolean} the new favourite state */
export function toggleFavorite(store, id) {
  let now = false;
  store.update((s) => {
    const list = s.favorites.terms;
    const i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1);
    else { list.unshift(id); now = true; }
  });
  return now;
}

export function addRecentSearch(store, query) {
  const q = String(query ?? '').trim();
  if (q.length < 2) return;
  store.update((s) => {
    const list = s.history.searches.filter((x) => x.toLowerCase() !== q.toLowerCase());
    list.unshift(q);
    s.history.searches = list.slice(0, MAX_RECENT_SEARCHES);
  });
}

export function clearRecentSearches(store) {
  store.update((s) => { s.history.searches = []; });
}

export function addViewed(store, id) {
  store.update((s) => {
    const list = s.history.viewed.filter((x) => x !== id);
    list.unshift(id);
    s.history.viewed = list.slice(0, MAX_VIEWED);
  });
}
