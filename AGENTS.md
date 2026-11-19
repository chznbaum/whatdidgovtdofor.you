## Project

whatdidgovtdofor.you, a static Astro site of concrete things government did for working people, each credited to the people who did the work and showing whether it still stands. Read before working:

- `docs/content-guide.md`: editorial standard. All content and the pipeline prompts follow it.
- `docs/design.md`: the design system, "Faces first" (chosen Nov. 2026 from designer samples kept locally in `design-samples/`, which is gitignored). Every action leads with the person who did the work, drawn in ink from a real photo. Never use party colors, and never let a status color line up with a party (no red/blue status axis).
- `README.md`: commands and the publishing pipeline.

Before any design change or significant CSS change, also read these two articles. Then propose the layout options with their tradeoffs (screenshots for the one you'd choose) and get the owner's call before building or iterating:

- https://css-tricks.com/beyond-12-columns/
- https://css-tricks.com/getting-creative-with-images-in-long-form-content/

Match the technique to the content's constraints. For example, a float (even with `shape-outside`) only suits running text that can also flow under the image; an image that must stay anchored, like a header drawing on its bottom edge, belongs in a grid cell.

Every change reaches `main` through a pull request; nothing is pushed to `main` directly. Work on a branch (a worktree if the main checkout is busy, e.g. during a pipeline run), push it, and open a PR to `main`. Your job ends at the PR: the owner, or workflows the PR triggers, review and merge it. Never force-push.

Run `npm run validate` after touching content and `npm run build` after touching code. Pipeline scripts run on Node 24 with native type stripping (no enums or parameter properties; use explicit `.ts` import extensions).

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build
