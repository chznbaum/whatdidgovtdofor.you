// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://whatdidgovtdofor.you',
  trailingSlash: 'always',
  // /get-involved/ is only a redirect to /your-turn/; keep it out of the sitemap.
  integrations: [sitemap({ filter: (page) => !page.includes('/get-involved/') })],
  // The page's working name; the call to action links to /your-turn/.
  redirects: { '/get-involved/': '/your-turn/' },
  // Let the preview server answer on a Tailscale name (e.g. via `tailscale serve`), for reviewing from a phone.
  vite: { preview: { allowedHosts: ['.ts.net'] } },
});
