# Sourcing rules

How the pipeline reads government sources, and how anyone adding a feed, backfill or research script should too. This is a public civic project that relies on governments' goodwill, so it reads public records the way a well-mannered visitor would. Photos for portraits have their own policy: `pipeline/portraits/SOURCING.md`.

## Identify yourself

Requests go out under the pipeline's user agent (`USER_AGENT` in `pipeline/feeds/util.ts`), never a browser's. Go slowly: one request at a time per host unless a source's own guidance allows more.

## robots.txt

- A source whose robots.txt disallows our user agent or `*` is skipped, even if one daily read would look like an RSS reader. Granicus ViewPublisher and CivicWeb, for example, disallow everything.
- Honor `Crawl-delay`. CivicPlus sites ask for 10 seconds; IQM2 asks for 60.
- A published, documented API isn't crawling. It's fine to call even where robots.txt disallows that path for crawlers (Wikimedia Commons' `/w/api.php` under `Disallow: /w/`). Follow the API's own etiquette.
- Signals against AI training (`Content-Signal: ai-train=no`) don't restrict us: we don't train on this data. A robots.txt rule that disallows our user agent or `*` still does.

## Calls the page makes

- A call the public page itself makes in a visitor's browser is fine. Examples: Laserfiche WebLink's JSON POSTs for folder listings and page text; the guest token a CivicPlus HCMS page carries, read fresh each run and never stored.
- Ask the owner before any call the page doesn't make. That includes computing a token from a site's script to reach an API (Georgia's laws come from the General Assembly's published SOAP services instead).

## Bot checks

Never get around a bot check: no solving or bypassing challenges (Cloudflare, Akamai, Sucuri), no spoofed browser user agents, no retrying past a 403. Use another official source, or leave the place without that feed.

## Blocked sources

Record every blocked source in `OUTREACH.md` at the checkout root (local only): who blocks, how, what it would open, and where the research notes are. Asking a government or vendor for access is the owner's call.
