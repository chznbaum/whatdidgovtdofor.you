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

If no tier has anything usable, record `"tier": "none"` with what you tried. That person gets the fallback cover: an ink drawing of the chamber or capitol where they served, never initials.
