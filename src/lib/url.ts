// The site's own URLs are written without a trailing slash: /action/988-suicide-crisis-lifeline, not …lifeline/.
// The build still writes folders (action/988-suicide-crisis-lifeline/index.html), which the host serves at both forms;
// canonical tags, the sitemap and structured data name the no-slash form, so search engines file every page under it.
export const SITE = 'https://whatdidgovtdofor.you';

// "/places/va/" or "/places/va/index.html" → "https://whatdidgovtdofor.you/places/va"; the home page is the bare origin.
export const absoluteUrl = (path: string) => {
  const p = path.replace(/\/index\.html$/, '').replace(/\/+$/, '');
  return p ? new URL(p, SITE).href : SITE;
};
