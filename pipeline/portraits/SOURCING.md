# Finding a photo to draw from

The owner set this policy on 2026-11-11. Every portrait is an ink drawing made from a real photo of the person. Never draw a face without a photo.

## Where to look, in order

Use the first tier that has a clear, current, front-facing photo of the right person. Aim for a face at least ~300px across; at minimum the image should be 400px wide.

1. **official**: a government source.
   - Congress bioguide: `https://unitedstates.github.io/images/congress/450x550/<bioguide>.jpg`
   - Legislature member pages, current and historical:
     - Virginia: `house.vga.virginia.gov/members/...`, `apps.senate.virginia.gov/...`, `history.house.virginia.gov/members/<id>`
     - New York: `nysenate.gov/senators/...`, `nyassembly.gov/mem/...`
     - NYC: `council.nyc.gov/district-N/`
   - Governor, mayor, and agency pages.
   - Presidential and cabinet official portraits (whitehouse.gov archives, department sites).
2. **commons**: Wikimedia Commons, from the file page. Record the author and license.
3. **press**: a headshot the person publishes for press use: a campaign site press kit, a caucus page, or an official social profile.
4. **reference-only** (last resort): a YouTube thumbnail or frame, or a LinkedIn photo.
   - Use it only if tiers 1–3 have nothing usable, and never republish it. It's a reference for the drawing only.
   - Don't bypass login walls or scrape. If a page needs a login, skip it.

Confirm it's the right person: the page must name them and match the office.

People who aren't officials (an organizer, a worker whose complaint started a case) get portraits too when they're credited on a cover. The owner decided this on 2026-11-12. Use the same tiers: a photo their own organization publishes counts as press. A news photographer's photo is reference-only, and the drawing links to the article it ran with.

## Nothing gets republished

The owner decided on 2026-11-11 that the site never republishes source photos, whatever their license. Every portrait's "see the photo" link goes to the **page** the photo came from: the bioguide page, member page, Commons file page, press page, video, or profile. When no page shows the photo (e.g. it exists only as a file in an official's media library), linking the image file itself is fine; the owner OK'd linking to source photos.

The downloaded file in `photos/` is a private working copy for drawing. It's gitignored and never copied to `public/`.

## Record it

- Save the photo as `pipeline/portraits/photos/<id>.jpg`, converting to JPEG if needed.
- Add an entry to `pipeline/portraits/sources.json`:

```json
"<id>": {
  "tier": "official | commons | press | reference-only",
  "page": "https://… (the page that shows the photo; the image file itself only if no page shows it)",
  "image": "https://… (the image file you downloaded)",
  "publisher": "Senate of Virginia | Wikimedia Commons (Author Name) | …",
  "license": "Public domain | CC BY-SA 4.0 | © holder, used as a drawing reference | …",
  "width": 0, "height": 0,
  "notes": "anything the drawer should know: e.g. photo is from 2014; glasses; hair color"
}
```

If no tier has anything usable, record `"tier": "none"` with what you tried. That person keeps their initials (`docs/design.md`, "Portraits"). A photo that exists but can't be drawn truly (a face under ~100px, or cut so tight the drawing would need clothing invented past its edge) gets a `"hold"` field saying why, so `scope.ts` skips them until a better photo turns up.

## Sourcing a run's list

The brief for an agent that finds photos for a list of people in a portrait run (`README.md`, "Running a portrait run"). You don't draw. The task gives your list (`RUN/lists/<group>.txt`, one line per person: `id | name | office | party | bioguide= | url= | leads N, on M covers | notes`) and the hosts already known to block us (from the owner's OUTREACH.md). ROOT is the checkout you were started in. Write only `ROOT/pipeline/portraits/photos/`, `sources.json` (through `merge.py`) and `/tmp`. Don't commit.

Work the list in order, one person at a time:

1. **Find candidates in tier order** (above). For local officials and agency heads, the official tier is the city's or county's own member page, the agency's leadership page, or a press release on the government's site with their headshot. Former officials: their official portrait from the time they served, from an archived member page (the Wayback Machine, on hosts that don't block us) or a public-domain government portrait on Commons. People with a `bioguide` id: try `node pipeline/portraits/fetch-official.mjs <id>` first.
2. **Pick the best photo by one standard for everyone:** posed, front-facing (or a slight three-quarter), head and shoulders, eyes visible, smiling if such a photo exists. Avoid candids (mid-word, at a mic, squinting, unsmiling) when a posed one exists: every person should be shown as well as their own best photo shows them. Current look over old when both are good. Big enough: aim for a face ~300px across; look for the largest copy (a page often shows a resized style of a bigger file). Prefer a photo that shows the shoulders and the top of the chest with clear space above the hair: drawings may not invent clothing past the photo's edge, so a photo cut at the collar frames badly. If the official tier only has a tiny or tight photo and Commons or a press page has a good large one of the same look, take the larger one and mention the official one in the notes.
3. **Download** with `curl -sL -A "whatdidgovtdofor.you portrait pipeline (+https://whatdidgovtdofor.you; places@whatdidgovtdofor.you)" -o /tmp/<id>.src <image-url>`, then `sips -s format jpeg /tmp/<id>.src --out ROOT/pipeline/portraits/photos/<id>.jpg`. Never upscale. If the head is small in a wide photo, keep the full file as `photos/<id>.full.jpg` and save a head-and-shoulders crop, with margin, as `photos/<id>.jpg`.
4. **Look at it.** One person, the right person (the page names them and matches the office), face clearly visible, not a placeholder.
5. **Record it right away**, before the next person: `pipeline/portraits/.venv/bin/python pipeline/portraits/merge.py ROOT/pipeline/portraits/sources.json <id> '<json>'`, with the fields under "Record it". In `notes`: the photo's year if known; hair color and lightness; glasses; facial hair; skin tone and how the photo is lit; anything the drawer should know; candidates you rejected and why. `tier: official` only for a government's own photo; a Commons photo by a private photographer is `commons`. Width and height from `sips -g pixelWidth -g pixelHeight`.

**Rules (the owner's):** read a host's robots.txt before fetching anything else from it, and skip disallowed paths. Never work around a bot check, a Cloudflare or other challenge, a login wall or a paywall: skip that host, archived copies included, note it, and look elsewhere. Fetch specific pages; don't crawl. Respect a stated crawl delay. Wikimedia Commons' robots.txt disallows `/w/`, its search API included: use `/wiki/File:` pages and `upload.wikimedia.org` files, found through web search.

Reply with a table: id | tier | publisher | face size (approx px) | posed / smiling? | caveat. List anyone recorded `none` or given a `hold`, and every host that blocked you (host, path, how), so they can be added to OUTREACH.md.
