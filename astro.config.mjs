// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://whatdidgovtdofor.you',
  trailingSlash: 'always',
  integrations: [sitemap()],
  // Let the preview server answer on a Tailscale name (e.g. via `tailscale serve`), for reviewing from a phone.
  vite: { preview: { allowedHosts: ['.ts.net'] } },
});
