// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages project site: https://xlopvaz.github.io/aerolex/
// If a custom domain is added later, set `site` to it and `base` to '/'.
export default defineConfig({
  site: 'https://xlopvaz.github.io',
  base: '/aerolex',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
