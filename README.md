# whatdidgovtdofor.you

A public record of the concrete things government did for people (national, New York, New York City, Virginia, Hampton Roads, and Greater Richmond), each one traceable to the officials responsible and showing whether it still stands.

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
| `npm run build` | Build the static site into `dist/` |
| `npm run validate` | Check all content against the schema and editorial rules |
| `npm run sync:roster` | Refresh Congress and NY/VA legislature rosters |
| `npm run pipeline -- feeds --since 2026-10-01` | Pull candidate actions from official feeds |
| `npm run pipeline -- draft --limit 10` | Draft entries from new candidates (writer: Claude by default; `--writer codex` for GPT) |
| `npm run pipeline -- draft <key> <key> …` | Draft particular promising candidates, by key |
| `npm run pipeline -- verify` | Fact-check pending entries with the *other* company's model |
| `npm run pipeline -- verify --stale 90` | Also re-check entries whose status is more than 90 days old |
| `npm run pipeline -- retract <slug> --reason "..."` | Remove an entry for good; the pipeline won't re-add it |
| `npm run pipeline -- all` | feeds → draft → verify |

## How content gets published

1. **Feeds** (`pipeline/feeds/`) pull enacted laws, executive actions, and official releases into `pipeline/state/candidates.json`. Ceremonial items are filtered out up front.
2. **Draft**: a writer model triages each candidate against the content guide, researches it, and writes a complete entry with sources, votes, credits, and current status. Entries that fail schema validation get one repair attempt.
3. **Verify**: a model from a *different company* checks every claim and returns `pass`, `corrected` (with a fixed file), or `fail`. Failed entries are hidden from the site. Each entry's page shows who wrote it and who checked it.
4. **Retract**: if something's wrong, `npm run pipeline -- retract <slug>`. It's logged in `pipeline/retracted.json` and won't come back.

Entries publish without human review by design. `pipeline/decisions.json` records what happened to every candidate.

### Running it every day

`ops/daily.sh` does one unattended run: rosters → feeds → draft → verify (including status re-checks older than 60 days) → validate → build → commit → push. The push is always a normal one, never forced. If the remote has moved, local commits are rebased onto it, and a conflict stops the run for a person. To schedule it on macOS, install the launchd template in `ops/com.whatdidgovtdofor.pipeline.plist` (instructions are inside the file).

## Deploying

The site is static and is served from a **Bunny Storage Zone behind a Bunny Pull Zone**. Every push to `main`, including the daily pipeline's, runs `.github/workflows/deploy.yml`:

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

To see what a deploy would change without changing anything, run `node ops/deploy-bunny.mjs --dry-run` with the same variables set. To revert a bad deploy, revert the commit on `main` and push; the workflow redeploys.

### Models

The pipeline drives the local `claude` and `codex` CLIs in a hermetic mode (no MCP servers, no user hooks), so it runs on your existing logins.

Set these in your shell or in a `.env` file at the repo root (gitignored; copy `.env.example`). The pipeline and `sync:roster` load `.env` automatically, and shell variables win.

| Env var | Default | Notes |
| --- | --- | --- |
| `CLAUDE_MODEL` | `claude-opus-5-5` | Writer, and verifier of GPT-written entries |
| `TRIAGE_MODEL` | `claude-sonnet-5-5` | Cheap first pass that screens and scores candidates; a `gpt-*` id runs it on Codex |
| `CODEX_MODEL` | `gpt-5.6-sol` | `gpt-6-astra` needs a newer Codex CLI than 0.150 |
| `CODEX_EFFORT` | `high` | |
| `CONGRESS_API_KEY` | `DEMO_KEY` | Free at [api.data.gov/signup](https://api.data.gov/signup/); DEMO_KEY is heavily rate-limited and skips sponsors and summaries |
| `NYSENATE_API_KEY` | none | Free at [legislation.nysenate.gov](https://legislation.nysenate.gov/); without it the `ny-laws` feed is skipped |
| `NYC_LEGISTAR_TOKEN` | none | Free at [council.nyc.gov/legislation/api](https://council.nyc.gov/legislation/api/); without it the `nyc-laws` feed is skipped |

## Content layout

```
src/content/entries/{federal,state,local}/<slug>.md   one action per file
src/content/officials/<id>.yaml                      people and bodies (councils, boards)
src/content/places/<id>.yaml                         jurisdictions with Census GEOIDs
src/data/roster/*.json                               synced legislator rosters
src/data/get-involved.json                           ways to run, serve, or work the polls, by place (see get-involved.schema.md)
```

## Annual upkeep

- After a new Congress is seated, run `npm run sync:roster`, then switch the geocoder vintage in `src/pages/lookup-index.json.ts` (it's commented).
- When state legislatures redistrict, check that the geocoder vintage carries the new maps.
- Update `seat` on officials when governors and mayors change.

## License

[MIT](LICENSE), for the code and the content. Source photos of officials are never republished here: each portrait is an ink drawing made from a photo, and it links to the page that photo came from.
