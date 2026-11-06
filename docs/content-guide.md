# Content guide

This is the editorial standard for every entry on whatdidgovtdofor.you. Human writers, research agents, and the automated pipeline (`pipeline/`) all write against it. The pipeline prompts embed this file verbatim, so changes here change what the models produce.

## What the site is for

Most people never hear about the concrete things government does for them. Each entry takes one action (a law, an executive order, a rule, a budget item, a program, a local ordinance) and makes it **legible in five seconds**: what changed for real people, who made it happen, and whether it's still in effect. Proof is always one tap away.

The voice is **factual but compelling**. We are not neutral about whether people should know these things; we are scrupulous about whether they are true. Nothing should be easy to dismiss as spin.

- Credit whoever did it, Republicans included. When Republicans deliver something good, say so plainly; bipartisan credit is a feature, not a concession.
- Party is shown next to every official's name. Don't editorialize about parties in the text.
- Never claim more than the sources support. Prefer a smaller true number to a bigger fuzzy one.

## What qualifies

Include actions with a **direct, tangible effect on people's lives**: money in pockets, costs lowered, services created, rights protected, infrastructure built, safety improved.

Leave out: commemorative resolutions, post-office namings, purely procedural votes, announcements of intent with no enacted action, and anything whose main effect is on government itself. A bill that only *passed one chamber* is not an entry. A proposal becomes an entry when it's enacted, signed, funded, or ordered.

Harms ("what government did *to* you") are out of scope for v1. When a good thing has been rolled back, that goes in the entry's **status**, not in a separate entry.

## Fields

Entries are Markdown files in `src/content/entries/{federal|state|local}/{slug}.md`. The YAML frontmatter is validated by `src/content.config.ts`. The body is the "What it means for you" explainer.

### `title` (≤ 90 chars, aim for ≤ 60)
The headline reads like a road sign: the impact, in plain words, from the reader's point of view. Use second person where it's natural. Lead with the benefit, not the bill.

- Good: `Insulin costs $35 a month if you're on Medicare`
- Good: `Every public school student in New York eats breakfast and lunch free`
- Bad: `Inflation Reduction Act signed into law` (names the bill, not the impact)
- Bad: `Historic investment transforms lives` (vague, salesy)

Sentence case. No trailing period. No exclamation points.

### `dek` (≤ 280 chars)
One or two sentences that complete the picture: what changed, for whom, since when. Concrete nouns and numbers.

### `level`, `jurisdiction`, `places`
`level` is `federal`, `state`, or `local`. `jurisdiction` is the place id of the government that acted: `us`, `ny`, `nyc`, `va`, `hampton-roads`, `norfolk`, `virginia-beach`, `chesapeake`, `portsmouth`, `suffolk`, `hampton`, `newport-news`, `williamsburg`, `poquoson`, `james-city-county`, `york-county`, `isle-of-wight`, `gloucester`.

`places` (optional) lists *other* places where the action has a specific local footprint. A federal grant that built a Norfolk floodwall has `jurisdiction: us` and `places: [norfolk]`. That's how someone looking up a Norfolk address finds it.

### `action`
- `type`: `law`, `executive-order`, `regulation`, `budget`, `program`, `ordinance`, `ballot-measure`, `settlement`, or `grant`
- `name`: official name ("Inflation Reduction Act of 2022", "Local Law 18 of 2024")
- `identifier`: optional ("Pub. L. 117-169", "H.R. 5376", "HB 1", "Int. 0360-2024")
- `date`: the day it was enacted, signed, ordered, or approved (YYYY-MM-DD)
- `effective`: optional, when the benefit started or starts

### `topics` (1–3)
`health`, `costs`, `housing`, `childcare`, `education`, `work`, `transit`, `infrastructure`, `climate`, `storms`, `safety`, `rights`, `veterans`, `food`, `internet`, `voting`, `seniors`

### `who_benefits`
One sentence naming the people helped, with a count if the sources give one. "About 3.3 million people on Medicare who use insulin."

### `impact` (1–3 items)
Big numbers for the sign. `figure` ≤ 18 chars (`$35`, `1.5 million`, `$2,000`, `12 weeks`). `label` ≤ 80 chars and says what the figure is. Every figure must appear in, or follow arithmetically from, a cited source.

### `status`
- `state`: one of
  - `in-effect`: working now
  - `delivered`: a one-time benefit that was paid out or completed (a rebate check, a finished project). Not "ended": nothing was taken away. Set `action.effective` to when it was delivered.
  - `phasing-in`: enacted and rolling out; not everyone has the benefit yet
  - `under-threat`: in effect, but a specific, active effort would end or gut it (a pending bill or rule, a lawsuit, a proposed budget cut). Name the effort.
  - `repealed`, `expired`, `blocked` (by a court), `cancelled` (funding or program terminated)
- `as_of`: the date you checked the status
- `note`: required for anything but `in-effect` and `delivered`. Say what happened, who did it, and when. "Repealed for vehicles bought after Sept. 30, 2025 by the One Big Beautiful Bill Act, signed by Donald Trump (R)."
- `by`: official ids responsible for the threat or rollback, if any
- `source`: URL backing the status claim (required unless the state is `in-effect` or `delivered`)

### `credit` (1 or more)
The people (or bodies) who made it happen, each with a `role`:
`signed`, `sponsored`, `cosponsored`, `proposed`, `led`, `championed`, `negotiated`, `secured-funding`, `voted-yes`, `tie-breaker`, `issued`, `implemented`

Credit the signer and the lead sponsors at minimum. Add others when a source names their role. Don't list every yes vote here; that's what `votes` is for. `note` is optional context ("Lead Senate negotiator").

Each `official` is an id that must exist in `src/content/officials/{id}.yaml`. Create the file if it's missing (see Officials below). A collective body like `norfolk-city-council` or `nyc-rent-guidelines-board` is a valid official with `kind: body`.

### `votes` (optional, strongly encouraged for legislation)
One item per final-passage vote:
```yaml
votes:
  - chamber: U.S. House
    date: 2022-08-12
    yes: 220
    no: 207
    by_party: { D: { yes: 220, no: 0 }, R: { yes: 0, no: 207 } }
    source: https://clerk.house.gov/Votes/2022420
```
Use the official roll call (clerk.house.gov, senate.gov, LIS, nysenate.gov, legistar) as the source. Party breakdowns must match it exactly. For a small body like a city council, use `members` instead of (or as well as) `by_party`.

### `sources` (1 or more; aim for 2–4)
Prefer primary sources: the law text, an agency page, the official roll call, a government press release. Add one reputable news or nonpartisan analysis source (CBO, KFF, CRS, Tax Policy Center, a major paper) when it helps a reader trust the numbers. Every number and status claim must trace to something here.

```yaml
sources:
  - title: Medicare $35 insulin cap
    publisher: Centers for Medicare & Medicaid Services
    url: https://...
    date: 2023-01-01
```

### `featured`
`true` for a handful of entries per place that best show what the site is about. Use sparingly.

### `verification`
```yaml
verification:
  writer: { model: claude-opus-5-5, via: claude-code, date: 2026-11-05 }
  verdict: pending
```
Writers always set `verdict: pending`. The verifier, which is always a *different* model family, sets `verifier`, `verdict` (`pass`, `corrected`, or `fail`), and `notes`.

### `source_key` (pipeline only)
A stable id for the underlying action ("us-law-117-169", "va-2026-hb1"). The pipeline uses it to avoid duplicates and to honor retractions.

### Body: "What it means for you"
Two to four short paragraphs, 120–250 words total. Plain language at about an 8th-grade reading level. Answer three things: what it does, who gets it and how (do they need to apply?), and how it came about (who pushed it, any notable bipartisan support). Use no headings in the body. Say things in your own words and don't paste from sources.

## Officials

`src/content/officials/{id}.yaml`. The id is a lowercase slug of the common name: `tim-kaine`, `kathy-hochul`, `zohran-mamdani`, `norfolk-city-council`. Before creating one, check whether the file already exists.

```yaml
name: Tim Kaine
party: D            # D, R, I, L, G, or NP (nonpartisan office)
office: U.S. Senator from Virginia
level: federal      # federal | state | local
jurisdiction: va    # place id where they serve (use `us` for President/VP/cabinet)
current: true       # holds this office today
ids: { bioguide: K000384 }   # members of Congress: bioguide id (see src/data/roster/federal.json)
                             # state legislators: openstates id (see src/data/roster/state-*.json)
url: https://www.kaine.senate.gov
```

For a former official, use the office they held when they did the credited work and set `current: false` (e.g., `office: President of the United States`, `current: false` for Joe Biden).

Executives who should show up in an address lookup get a `seat`:
```yaml
seat: { place: va, title: Governor }
```
Bodies use `kind: body` and have no party.

Party is the party the person belonged to when they did the work. Use `NP` for officials elected in nonpartisan races (many Virginia city councils).

## Checking status

Status claims age, so check them against the newest sources you can find, not just the original enactment coverage. Many 2021–2024 federal programs were changed in 2025 by the One Big Beautiful Bill Act (Pub. L. 119-21) or by executive action, and some were restored by courts or later laws. If you can't confirm the current status, use the most recent state you *can* confirm, set `as_of` to the date of that evidence, and say so in `note`.
