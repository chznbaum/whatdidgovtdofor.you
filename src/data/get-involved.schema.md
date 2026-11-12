# `src/data/get-involved.json`

The data behind the "get involved" page and the call to action above the footer. The owner wants readers who see what government did for them to channel that into action: running for office first, plus lower-barrier ways in (boards and commissions, and poll work).

Owner decisions (2026-11-12):
- **Organizations are mixed and labeled.** Lead with Run For Something, then other progressive and worker-aligned groups, nonpartisan groups, and official guides. Every organization carries a one-word `lean` so readers know what they're clicking.
- **Include boards and commissions, and poll work,** alongside running for office.

```json
{
  "checked": "YYYY-MM-DD",
  "organizations": [
    {
      "name": "Run For Something",
      "url": "https://runforsomething.net/",
      "lean": "progressive",
      "for": "who it's for, in plain words (e.g. 'young progressives running for local office for the first time')",
      "offers": "what it actually gives you, one line (e.g. 'free help deciding what to run for, training, and a network')",
      "places": ["us"]
    }
  ],
  "how_to_run": [
    { "place": "va", "name": "Virginia Department of Elections: running for office", "url": "https://…", "offers": "one line" }
  ],
  "boards": [
    { "place": "nyc", "name": "…", "url": "https://…", "offers": "one line" }
  ],
  "poll_work": [
    { "place": "va", "name": "…", "url": "https://…", "offers": "one line, including that it's paid if it is" }
  ]
}
```

- `lean` is one of: `progressive`, `worker` (union or labor), `nonpartisan`, `official` (a government office).
- `places` uses the site's place ids: `us`, `ny`, `nyc`, `va`, `hampton-roads`, `norfolk`, `virginia-beach`, `chesapeake`, `portsmouth`, `suffolk`, `hampton`, `newport-news`, …
- Every `url` must load and must be the specific page for the purpose, not a homepage, when one exists.
- `for` and `offers` are plain, specific, and as true as the content guide demands: no hype.
