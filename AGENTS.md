## Project

whatdidgovtdofor.you, a static Astro site of government actions shown as road signs. Read before working:

- `docs/content-guide.md`: editorial standard. All content and the pipeline prompts follow it.
- `docs/design.md`: design system. Color encodes status only; never add party colors or decorative sign colors.
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
