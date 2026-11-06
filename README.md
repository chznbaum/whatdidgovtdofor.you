# whatdidgovtdofor.you

A public record of the concrete things government did for people (national, New York, New York City, Virginia, and Hampton Roads), each one traceable to the officials responsible and showing whether it still stands.

Every action is a road sign. Green means in effect, orange means phasing in, yellow means under threat, and red means ended. Enter an address to see your officials and what they did. See [docs/design.md](docs/design.md) for the design system and [docs/content-guide.md](docs/content-guide.md) for the editorial standard.

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

### Models

The pipeline drives the local `claude` and `codex` CLIs in a hermetic mode (no MCP servers, no user hooks), so it runs on your existing logins.

| Env var | Default | Notes |
| --- | --- | --- |
| `CLAUDE_MODEL` | `claude-opus-5-5` | |
| `CODEX_MODEL` | `gpt-5.6-sol` | `gpt-6-astra` needs a newer Codex CLI than 0.150 |
| `CODEX_EFFORT` | `high` | |
| `CONGRESS_API_KEY` | `DEMO_KEY` | Free from api.data.gov; DEMO_KEY is heavily rate-limited |

Feed-specific keys are listed in `pipeline/feeds/`.

## Content layout

```
src/content/entries/{federal,state,local}/<slug>.md   one action per file
src/content/officials/<id>.yaml                      people and bodies (councils, boards)
src/content/places/<id>.yaml                         jurisdictions with Census GEOIDs
src/data/roster/*.json                               synced legislator rosters
```

## Annual upkeep

- After a new Congress is seated, run `npm run sync:roster`, then switch the geocoder vintage in `src/pages/lookup-index.json.ts` (it's commented).
- When state legislatures redistrict, check that the geocoder vintage carries the new maps.
- Update `seat` on officials when governors and mayors change.
