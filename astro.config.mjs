// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// GitHub Pages project site: https://xlopvaz.github.io/aerolex/
// If a custom domain is added later, set `site` to it and `base` to '/'.
export default defineConfig({
  site: 'https://xlopvaz.github.io',
  base: '/aerolex',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [mdx()],
  // Code blocks in lessons hold METAR/TAF messages, not code: plain text styled by the theme.
  markdown: { syntaxHighlight: false },
});
