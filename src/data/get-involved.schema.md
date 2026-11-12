# `src/data/get-involved.json`

The data behind `/your-turn/`, the "Your turn here" section on each place page, and the "Your turn" line on `/you/` results. The owner wants readers who see what government did for them to turn that into action: running for office first, plus lower-barrier ways in (boards and commissions, and poll work).

Owner decisions (2026-11-12):
- **Organizations are mixed and labeled.** Lead with Run For Something, then other progressive and worker-aligned groups, nonpartisan groups, and official guides. Every organization carries a one-word `lean` so readers know what they're clicking.
- **Include boards and commissions, and poll work,** alongside running for office.
- **Organized per place, like actions.** The site will cover the whole country, and readers filter to what affects them by address. So every item belongs to a place, using the same place ids as actions, and a reader's address narrows these the way it narrows actions. There is no hand-picked list.

## Shape

```json
{
  "checked": "YYYY-MM-DD",
  "organizations": [
    {
      "name": "Run For Something",
      "url": "https://runforsomething.net/run/",
      "lean": "progressive",
      "for": "who it's for, in plain words (e.g. 'young progressives running for local office for the first time')",
      "offers": "what it actually gives you, one line (e.g. 'free help deciding what to run for, training, and a network')",
      "places": ["us"]
    }
  ],
  "how_to_run": [
    { "place": "va", "name": "Virginia Department of Elections: becoming a candidate", "url": "https://…", "offers": "one line" }
  ],
  "boards": [
    { "place": "norfolk", "name": "City of Norfolk: apply for a board or commission", "url": "https://…", "offers": "one line" }
  ],
  "poll_work": [
    { "place": "va", "name": "…", "url": "https://…", "offers": "one line, including whether it's paid and how much, if the page says" }
  ]
}
```

| List | What goes in it | Place field |
| --- | --- | --- |
| `organizations` | Groups that train, back, or advise people who run | `places`: one or more place ids |
| `how_to_run` | The official guide to getting on the ballot: an elections office's candidate page, public financing | `place`: one place id |
| `boards` | Where to apply for a board, commission, or advisory committee | `place` |
| `poll_work` | Where to sign up to work the polls | `place` |

- **Place ids** are the file names in `src/content/places/` (`us`, `va`, `ny`, `nyc`, `hampton-roads`, `norfolk`, `virginia-beach`, `york-county`, …). Use the most specific place the item serves: a city's board application goes under the city, not the state.
- **A group with `"us"` in `places` is national.** It's listed once, under Nationwide, even if it also names states (put those in `for` or `offers` if they matter, as Emerge's Virginia program does). A group without `"us"` is listed under each place it names, e.g. `["va"]` for the Virginia Education Association.
- `lean` is one of: `progressive`, `worker` (union or labor), `nonpartisan`, `official` (a government office). Required on organizations; the other lists are official pages and don't need one.
- Every `url` must be http(s), must load, and must be the specific page for the purpose, not a homepage, when one exists.
- `name` reads as "Who: what", e.g. "Chesapeake Voter Registrar: working the polls".
- `for` and `offers` are plain, specific, and as true as the content guide demands: no hype. Say what a reader would want to know before clicking: unpaid or paid (and how much), how often a board meets, deadlines with dates.
- `checked` is the date the links were last checked.

`npm run validate` checks that every place is a real place id, every URL is http(s), and every `lean` is allowed, and names the item that fails. The site itself renders whatever it can (`src/lib/involved.ts`): an item without a name or an http(s) URL is skipped, and an unknown place id still shows, under "Other places", until it's fixed.

## Where items show

- **`/your-turn/`** lists Nationwide first (the national groups, by lean), then each state by name: its statewide items, then its regions, each followed by its member cities and counties, then any other places in the state. Every place lists the same three ways in: run for office, join a board or commission, work the polls. Places with nothing listed stay out of the full view.
- **Narrowing.** "Where do you live?" offers every city and county by state, "Somewhere else in" each state, and "Another state". Choosing a place shows it plus every place that contains it (Norfolk brings in Hampton Roads, Virginia, and the national groups). `/your-turn/?places=norfolk` does the same from a link.
- **From an address.** `/you/` finds the address's places in the browser (the country, the state, the city or county by Census GEOID, and any region that lists it) and links its "Your turn" line to `/your-turn/?places=us,va,hampton-roads,norfolk`: the same place ids that decide which actions reach the address. Only place ids go in the link; the address never leaves the browser.
- **Place pages** show the items listed for that place itself under "Your turn here", with a link to `/your-turn/?places=<id>` for everything that applies there.

## Adding a new place

Expanding is a data task; no code changes.

1. **Make sure the place exists.** If there's no `src/content/places/<id>.yaml`, add one with `name`, `short`, `kind` (`state`, `region`, `city`, or `county`), `parent`, and the Census `geoids` the address lookup matches (`state` FIPS for a state, `county` GEOID for a county or independent city, `place` GEOID for an incorporated city). A region lists its `members`. The new place gets a page, a choice in "Where do you live?", a row on `/your-turn/`, and address matching all at once.
2. **Add its items** with `place: "<id>"`. For a city or county, look for its elections office's candidate page (`how_to_run`), its boards and commissions application (`boards`), and its poll worker sign-up (`poll_work`). For a new state, add the same three at the state level, plus any groups that work only in that state (`organizations` with `places: ["<state id>"]`).
3. Run `npm run validate`, then `npm run build`.
