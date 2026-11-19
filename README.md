<a href="https://whatdidgovtdofor.you">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/readme-cover/readme-cover-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="docs/readme-cover/readme-cover-light.png">
    <img src="docs/readme-cover/readme-cover-light.png" width="1012" alt="whatdidgovtdofor.you: each action is a Markdown file, validated by a Zod schema and fact-checked by a model from a different company. Part of the entry file for Virginia HB 625, with title, action, credit, status and verification keys, next to how it renders: an ink drawing of Rozia Henson (D) and Russet Perry (D), the title &quot;Starting in 2028, you can choose a health plan with capped drug copays&quot;, the status &quot;Law now. Benefits start Jan. 1, 2028.&quot;, and a note that GPT-5.6-sol (OpenAI) checked Claude Opus 5.5&#39;s draft against its sources and corrected it.">
  </picture>
</a>

# whatdidgovtdofor.you

A public record of the concrete things government did for people (national, New York, New York City, Virginia, Hampton Roads, Greater Richmond, Minnesota, the Twin Cities, Duluth, New Jersey, Newark, Camden, Atlantic City, Elizabeth, Georgia, Metro Atlanta, Columbus, Savannah, Athens-Clarke, Florida, South Florida, Tampa Bay, Jacksonville, Orange County, and Gainesville), each one traceable to the officials responsible and showing whether it still stands.

Every action leads with the person who did the work, drawn in ink from a real photo, next to what it does for you and where it stands. Enter an address to see your officials and what they did. See [docs/design.md](docs/design.md) for the design system and [docs/content-guide.md](docs/content-guide.md) for the editorial standard.

## Stack

- [Astro](https://astro.build) static site. Content lives in the repo as Markdown and YAML (`src/content/`), validated by the shared schemas in `src/lib/schema.ts`.
- Address lookup runs entirely in the browser: the U.S. Census geocoder (JSONP, no key) returns districts, and `/lookup-index.json` (built at deploy time) maps them to people. The address never touches our server.
- Share images (`/og/<slug>.png`) are rendered at build time with satori and resvg.
- Rosters: [@unitedstates/congress-legislators](https://github.com/unitedstates/congress-legislators) and [Open States](https://openstates.org) bulk CSVs.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Build the static site into `dist/` (first stamps `src/data/lastmod.json`; see below) |
| `node pipeline/lastmod.ts --check` | Check the page dates match the content (CI runs it) |
| `npm run validate` | Check all content against the schema and editorial rules |
| `npm run sync:roster` | Refresh Congress and NY/VA legislature rosters |
| `npm run pipeline -- feeds --since 2026-10-01` | Pull candidate actions from official feeds |
| `npm run pipeline -- draft --limit 10` | Draft entries from new candidates (writer: Claude by default; `--writer codex` for GPT) |
| `npm run pipeline -- draft <key> <key> …` | Draft particular promising candidates, by key |
| `npm run pipeline -- verify` | Fact-check pending entries with the *other* company's model |
| `npm run pipeline -- verify --stale 90` | Also re-check entries whose status is more than 90 days old |
| `npm run pipeline -- retract <slug> --reason "..."` | Remove an entry for good; the pipeline won't re-add it |
| `npm run pipeline -- all` | feeds → draft → verify |
| `node pipeline/backfill-civicplus.ts --place hanover` | One-off: a place's older meeting recaps from its CivicPlus News Flash archive (the RSS feed only carries current items) |
| `node pipeline/backfill-iqm2.ts backfill --site https://goochlandcountyva.iqm2.com --place goochland --before 2026-07-01` | One-off: a board's older meeting minutes from a Granicus IQM2 portal it has since left |

## How content gets published

1. **Feeds** (`pipeline/feeds/`) pull enacted laws, executive actions, and official releases into `pipeline/state/candidates.json`. Ceremonial items are filtered out up front. National and state feeds are code; a city's or county's feeds are listed in its place file (`src/content/places/<id>.yaml`). Where a locality records what passed only in meeting recaps or minutes, each recap is split into one candidate per approved action before triage. Minutes posted only as PDFs are read with poppler's `pdftotext` (`brew install poppler`), and feeds of minutes look back months, since minutes are posted weeks after the meeting they cover.
2. **Draft**: a writer model triages each candidate against the content guide, researches it, and writes a complete entry with sources, votes, credits, and current status. Entries that fail schema validation get one repair attempt.
3. **Verify**: a model from a *different company* checks every claim and returns `pass`, `corrected` (with a fixed file), or `fail`. Failed entries are hidden from the site. Each entry's page shows who wrote it and who checked it.
4. **Retract**: if something's wrong, `npm run pipeline -- retract <slug>`. It's logged in `pipeline/retracted.json` and won't come back.

Entries publish without human review by design. `pipeline/decisions.json` records what happened to every candidate.

### Running it every day

`ops/daily.sh` does one unattended run: rosters → feeds → draft → verify (including status re-checks older than 60 days) → validate → build → commit → pull request. Changes reach `main` only through pull requests, so a run ends once its PR is open. People review and merge it, or workflows started by the PR do (e.g. once it clears CI), and the merge deploys.

Each run works on a `pipeline/<date>-<time>` branch and switches the checkout back when it's done. While a pipeline PR is still open, later runs add their commits to that PR (with `main` merged in) instead of opening another, so they never redraft what's waiting there. Pushes are always normal ones, never forced. A conflict, or a previous run's commits that never reached GitHub, stops the run for a person. The run uses `gh` for the PR, so `gh auth status` must pass for the user it runs as. To schedule it on macOS, install the launchd template in `ops/com.whatdidgovtdofor.pipeline.plist` (instructions are inside the file). It drafts only actions triaged at impact 3 or higher, 100 a run, and can also be started by hand to work through a backlog.

`ops/lower-impact.sh` is for when there's capacity to spare: it drafts actions triaged at impact 2 (which the daily run never reaches; `MIN_IMPACT=1` adds impact 1), then verifies, builds, and opens or adds to a PR the same way. Start it by hand, e.g. `nohup ops/lower-impact.sh > /tmp/whatdidgovtdofor-lower-impact.log 2>&1 &`. Runs take a lock (`pipeline/state/run.lock`), so two never overlap: a run started by hand won't start while another is going, and the scheduled run waits for it (up to four hours).

## Deploying

The site is static and is served from a **Bunny Storage Zone behind a Bunny Pull Zone**. Every pull request to `main` runs `.github/workflows/ci.yml` (validate and build, no secrets). Every merge to `main`, the pipeline's PRs included, runs `.github/workflows/deploy.yml`:

1. validate and build
2. `ops/deploy-bunny.mjs`: upload only the files whose SHA-256 changed, purge the Pull Zone cache, then delete stored files the build no longer has

`dist/404.html` is also uploaded as `bunnycdn_errors/404.html`, Bunny's custom 404 page.

GitHub Actions secrets, in the `production` environment (Settings → Environments; deployment branches limited to `main`, no required reviewers):

| Secret | What it is |
| --- | --- |
| `BUNNY_STORAGE_ZONE` | Storage zone name |
| `BUNNY_STORAGE_PASSWORD` | The storage zone's password (FTP & API Access), not the account key |
| `BUNNY_STORAGE_HOST` | The zone region's API host, e.g. `storage.bunnycdn.com` (Falkenstein) or `ny.storage.bunnycdn.com` |
| `BUNNY_API_KEY` | Account API key, used only to purge the cache |
| `BUNNY_PULLZONE_ID` | Pull zone id |

To see what a deploy would change without changing anything, run `node ops/deploy-bunny.mjs --dry-run` with the same variables set. To revert a bad deploy, open a PR that reverts the commit and merge it; the workflow redeploys.

### Models

The pipeline drives the local `claude` and `codex` CLIs in a hermetic mode (no MCP servers, no user hooks), so it runs on your existing logins.

Models are pinned to exact versions on purpose: compare a new model's drafts and checks against the current one before switching. Effort is always passed explicitly, so a CLI's default never decides it.

Set these in your shell or in a `.env` file at the repo root (gitignored; copy `.env.example`). The pipeline and `sync:roster` load `.env` automatically, and shell variables win.

| Env var | Default | Notes |
| --- | --- | --- |
| `CLAUDE_MODEL` | `claude-opus-5-5` | Writer, and verifier of GPT-written entries |
| `TRIAGE_MODEL` | `claude-sonnet-5-5` | Cheap first pass that screens and scores candidates; a `gpt-*` id runs it on Codex |
| `CODEX_MODEL` | `gpt-5.6-sol` | `gpt-6-astra` needs a newer Codex CLI than 0.150 |
| `CLAUDE_EFFORT` | `high` | Reasoning effort for Claude calls other than triage |
| `CODEX_EFFORT` | `high` | Reasoning effort for Codex calls other than triage |
| `TRIAGE_EFFORT` | `medium` | Reasoning effort for triage and for splitting meeting recaps, on either provider |
| `CONGRESS_API_KEY` | `DEMO_KEY` | Free at [api.data.gov/signup](https://api.data.gov/signup/); DEMO_KEY is heavily rate-limited and skips sponsors and summaries |
| `NYSENATE_API_KEY` | none | Free at [legislation.nysenate.gov](https://legislation.nysenate.gov/); without it the `ny-laws` feed is skipped |
| `NYC_LEGISTAR_TOKEN` | none | Free at [council.nyc.gov/legislation/api](https://council.nyc.gov/legislation/api/); without it the `nyc-laws` feed is skipped |
| `MPLS_LIMS_KEY` | none | Register for the [Minneapolis LIMS API](https://lims.minneapolismn.gov) (the city emails a key); without it the `minneapolis-council` feed is skipped |

## Content layout

```
src/content/entries/{federal,state,local}/<slug>.md   one action per file
src/content/officials/<id>.yaml                      people and bodies (councils, boards)
src/content/places/<id>.yaml                         jurisdictions with Census GEOIDs, feeds, and council rosters
src/data/roster/*.json                               synced legislator rosters
src/data/get-involved.json                           ways to run, serve, or work the polls, by place (see get-involved.schema.md)
```

`src/data/lastmod.json` is generated: a short hash and a date for every file a page is built from (entries, officials, places, portraits, page templates). Before each build, `pipeline/lastmod.ts` gives a new or changed file today's date (New York time); the sitemap's `lastmod` and the structured data's `dateModified` come from it, so deploys need no git history. Never edit it by hand; if CI says it's out of date, run `npm run build` (or `node pipeline/lastmod.ts`) and commit it.

## Annual upkeep

- After a new Congress is seated, run `npm run sync:roster`, then switch the geocoder vintage in `src/pages/lookup-index.json.ts` (it's commented).
- When state legislatures redistrict, check that the geocoder vintage carries the new maps.
- Update `seat` on officials when governors and mayors change.
- Update `council` rosters in place yaml after local elections and appointments (they're copied by hand; `checked` says when). Virginia's localities seat new members on January 1, so enter them ahead with `from` (and the outgoing member's `until`); the daily build switches them over. Where a county's districts come from the geocoder's County Subdivisions (`districts: census`), recheck them against the county's own map after a redistricting or a geocoder vintage change.

## License

[MIT](LICENSE), for the code and the content. Source photos of officials are never republished here: each portrait is an ink drawing made from a photo, and it links to the page that photo came from.
