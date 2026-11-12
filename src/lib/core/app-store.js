import { createStore } from './store.js';
import { createLocalAdapter } from './adapters/local.js';

/** Browser-wide store instance, shared by every island on the page. */
let instance;

export function getAppStore() {
  if (!instance) {
    instance = createStore({ adapter: createLocalAdapter() });
    // Keep tabs in sync: another tab saving progress updates this one.
    globalThis.addEventListener?.('storage', (e) => {
      if (e.key === instance.key) instance.reload();
    });
  }
  return instance;
}
