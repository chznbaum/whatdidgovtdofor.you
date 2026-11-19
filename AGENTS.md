## Project

whatdidgovtdofor.you, a static Astro site of concrete things government did for working people, each credited to the people who did the work and showing whether it still stands. Read before working:

- `docs/content-guide.md`: editorial standard. All content and the pipeline prompts follow it.
- `docs/design.md`: the design system, "Faces first" (chosen Nov. 2026 from designer samples kept locally in `design-samples/`, which is gitignored). Every action leads with the person who did the work, drawn in ink from a real photo. Never use party colors, and never let a status color line up with a party (no red/blue status axis).
- `README.md`: commands and the publishing pipeline.
- `docs/sourcing.md`: how feeds and research scripts may read government sources.

Local files, not in the repo, when present at the checkout root: `HANDOFF.md` (the current state of work), `OUTREACH.md` (sources that block us), and `design-samples/` (design rounds and research notes).

Every change reaches `main` through a pull request; nothing is pushed to `main` directly. Work on a branch (a worktree if the main checkout is busy, e.g. during a pipeline run), push it, and open a PR to `main`. Your job ends at the PR: the owner, or workflows the PR triggers, review and merge it. Never force-push. Don't add co-author trailers to commits or "Generated with" footers to commits or PRs.

Run `npm run validate` after touching content and `npm run build` after touching code. Pipeline scripts run on Node 24 with native type stripping (no enums or parameter properties; use explicit `.ts` import extensions).

## Working with the owner

- **Checkpoints.** Break work into phases. Before rolling anything out across the site, show something concrete (screenshots at phone and desktop widths, a sample, an audit table) and get the owner's call. Ask real decision questions, not "should I proceed?"
- **Options before building.** When there's more than one reasonable approach, lay out the options and their tradeoffs and get a decision first. Don't pick one and iterate through rounds of fixes on your own.
- **Stated decisions are constraints.** Plan around them; don't offer options that undo them. If something is unclear, ask.
- **Design and CSS.** Before any design change or significant CSS change, read these two articles, then propose options as above:
  - https://css-tricks.com/beyond-12-columns/
  - https://css-tricks.com/getting-creative-with-images-in-long-form-content/

  Match the technique to the content's constraints. For example, a float (even with `shape-outside`) only suits running text that can also flow under the image; an image that must stay anchored, like a header drawing on its bottom edge, belongs in a grid cell.
- **Extend what exists.** Straightforward UI work (a new filter, a list that loads more, a link in the right place) reuses the site's components and patterns and is checked with screenshots; it doesn't need designers. Interface copy is labels and counts, never sentences that explain the interface or the data (`docs/design.md` lists the phrasing to avoid).
- **Designer rounds are for genuinely new looks.** Have two or more designer agents each make two or three samples, and the owner picks. The brief gives only why the project exists (or where to read it), where the built site is, the real audience for the medium, and hard requirements (size, format). Deciding what goes on the piece, how it's laid out, and its copy is the designers' job. Check their copy for stock AI phrasing before showing it.
- **No quotas.** Don't impose quotas of any kind unless the owner argues for one: no maximum or minimum per place in a run, and no minimum share of a party in anything shown (faces on a page or a share image follow the credit data, which isn't balanced and shouldn't be made to look it).
- **Don't defer work you can anticipate.** If a feature can't go live until something arrives (an API key, an account, access), but the shape of the work is clear (a published spec, say), build it now so it switches on when the resource lands, and say what still needs live testing. Don't put it off without asking the owner.
- **Agents you delegate to.** Set the model and reasoning effort explicitly; defaults can be low. Have batch agents write each finished item to disk as soon as it's done (re-read a shared file, merge only their entry, write), never all at the end, so a failure partway leaves the finished work behind.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build
