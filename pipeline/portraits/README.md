# Portraits

How an official gets their ink drawing. The rules are in `docs/design.md`, "Portraits": draw only from a real photo of that person, one hand for everyone, and the site never republishes the photo (readers follow a link to the page it came from).

## Files

- `SOURCING.md`: where photos may come from, how to record them, and the brief for a sourcing agent.
- `DRAWING-BRIEF.md`: how to draw, check and publish one person (the brief for a drawing agent).
- `REVIEW-BRIEF.md`: the brief for an independent reviewer of a run's new drawings.
- `style.txt`: the drawing prompt. `REVIEW.md` and `REDRAW-LOG.md`: past runs' reviews and lessons.
- `sources.json` (each photo's page, publisher, license and notes), `eyes.json` (where each drawing's eyes are, for framing), `cutouts/` (each drawing as ink on white with a transparent surround). Kept in git, so any drawing can be reframed and any photo found again.
- `photos/` (source photos) and `raw/` (drawings on chroma-key green, every try) are private working copies: gitignored, never copied to `public/`, and kept in the main checkout between runs.
- Scripts: `scope.ts` (who to draw next), `fetch-official.mjs` (a member of Congress's bioguide photo), `cutout.py`, `ruler.py`, `normalize.py` (cut out, measure, frame), `side-by-side.py` and `review-sheet.py` (photo beside drawing), `skin-check.py` (advisory skin values across the set), `patch-edit.py` (edit a near-miss try in place), `merge.py` (locked merge of one entry into a shared JSON file). Python needs `requirements.txt`.

## Running a portrait run

A run draws the people who stand on an action's cover with initials, a batch at a time. The owner's rules:

- **At most 50 people a run**, most covers first: `node pipeline/portraits/scope.ts` lists them (`--held` lists who's skipped and why). More runs happen in later sessions.
- **Only people on initials.** Never redraw or reframe anyone already live, even for a flaw a review found.
- **No padding:** a drawing never extends clothing past its photo's edge. A photo cut too tight to frame gets a `hold` in `sources.json` and waits for a better one.
- **Older-photo drawings stay** (Ortega, Otis, Skoufis); time goes to people still on initials.
- **Show, then ask.** Whenever the owner is asked whether a face should be fixed, show the photo beside the drawing and the tile on orange beside published peers whose photos are about as dark. The owner judges by eye; the bar is a problem they can see (skin visibly lightened, a face that isn't the person), not a measured 6% smile that looks right.

**Where the session runs.** Start in the main checkout: the owner's local notes are there (`HANDOFF.md`, `OUTREACH.md`, and earlier runs' folders in `design-samples/`), and they exist nowhere else. Then cut a worktree for the run and move the session into it before starting any agent (in T3 Code: `t3_worktree_handoff`). Delegated agents start in the session's own folder and can write only there, so a session left in the main checkout would have them writing into it. Keep one run to one worktree.

**Set up the worktree:**

```
ln -s <main checkout>/node_modules node_modules
python3 -m venv pipeline/portraits/.venv && pipeline/portraits/.venv/bin/pip install -r pipeline/portraits/requirements.txt
mkdir -p pipeline/portraits/photos pipeline/portraits/raw design-samples/run-<date>-portraits/{lists,review}
```

Use real folders and a real venv, not links into the main checkout: Codex agents can't follow a link out of their worktree. The venv's Python must come from outside your home folder's version managers (on the owner's Mac, `/usr/local/bin/python3`). Copy in any photos already on file for people on the list (`cp -c <main checkout>/pipeline/portraits/photos/<id>.* pipeline/portraits/photos/`).

**The run folder** (`design-samples/run-<date>-portraits/`, gitignored) holds `STATUS.md` (a running log, updated as each step lands), `lists/<group>.txt` (the scope lines, split into groups of 10–16 by place), `flags.md` (the queue and per-person notes from the sourcers), `draw-log.jsonl` and `review/`.

**Steps** (run 5, Nov 2026, took one evening for 50):

1. **Scope:** `node pipeline/portraits/scope.ts 50`, split into groups by place.
2. **Source:** one agent per group, with `SOURCING.md` "Sourcing a run's list" and the hosts OUTREACH.md lists as blocking us. Sourcing runs on Codex (owner, Nov 19, 2026: everything but the review); run 5's sourcing ran on Claude Opus 5.5 before that call.
3. **Pilot,** when the method or a model is new to the project: draw three people with large photos, one agent each, with `DRAWING-BRIEF.md`. Show the owner the tiles on orange beside published peers, and get their call before the rest.
4. **Draw:** one short agent session per person, about five at a time; start the next as each one finishes. Each draws with its own image tool from the photo, checks, publishes and logs, then ends. Run 5 used Codex `gpt-6-astra` at high effort (never `gpt-6.2-astra`). The task names the person and the run folder, and points at `DRAWING-BRIEF.md` and the person's line in `flags.md`. Agents that stop on an environment problem get restarted once it's fixed.
5. **Review:** a grid of every new tile on orange, plus `review-sheet.py` contact sheets. Then independent reviewers from a different model family, about 17 people each, with `REVIEW-BRIEF.md`; run 5 used Claude Opus 5.5 at high effort.
6. **Owner's call:** show the grid, then each face a reviewer flagged, as photo beside drawing and tile beside peers. Fix only what the owner picks, one agent per person, editing the published drawing in place where one property is off (`DRAWING-BRIEF.md`, "Editing a near-miss try in place"); show the result before committing.
7. **Ship:** `npm run validate`, `npm run build` (it updates `src/data/lastmod.json`), commit, push, open the PR. Copy the run's new photos, `raw/` tries and run folder back to the main checkout's ignored folders, add blocked hosts to OUTREACH.md, and update HANDOFF.md in place.

Pin the models a run uses, and compare a new model on a few people before adopting it.

## The portrait field

```yaml
portrait:
  image: /portraits/<id>.webp
  kind: official        # only when the photo is a government's own (a .gov page, a place's own site, or a public-domain government portrait on Commons); otherwise: photo
  source:
    label: U.S. Congress  # who published the photo, as readers should see it
    url: https://bioguide.congress.gov/search/bio/<bioguide>  # the page from sources.json, never a bare image
    license: Public domain
```

Every drawing carries a "See the photo (U.S. Congress)" link to `source.url`; in lists, the label's own words link to it. The license stays in the data and isn't shown. `npm run validate` checks that the drawing files exist, that `kind: official` has a government source, and that bodies have no portrait.
