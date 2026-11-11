## Project

whatdidgovtdofor.you, a static Astro site of concrete things government did for working people, each credited to the people who did the work and showing whether it still stands. Read before working:

- `docs/content-guide.md`: editorial standard. All content and the pipeline prompts follow it.
- `docs/design.md`: the design system, "Faces first" (chosen Nov. 2026; reference sample in `design-samples/r2-1-faces/`). Every action leads with the person who did the work, drawn in ink from a real photo. Never use party colors, and never let a status color line up with a party (no red/blue status axis).
- `README.md`: commands and the publishing pipeline.

Run `npm run validate` after touching content and `npm run build` after touching code. Pipeline scripts run on Node 24 with native type stripping (no enums or parameter properties; use explicit `.ts` import extensions).

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build
