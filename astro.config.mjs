// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://whatdidgovtdofor.you',
  // URLs have no trailing slash (/action/<slug>); see src/lib/url.ts. Pages are still built as folders
  // (action/<slug>/index.html), which the host serves at the no-slash URL.
  trailingSlash: 'never',
  build: { format: 'directory' },
  // The sitemap is src/pages/sitemap-0.xml.ts, which dates every page.
  // The page's working name; the call to action links to /your-turn.
  redirects: { '/get-involved': '/your-turn' },
  // Let the preview server answer on a Tailscale name (e.g. via `tailscale serve`), for reviewing from a phone.
  vite: { preview: { allowedHosts: ['.ts.net'] } },
});
