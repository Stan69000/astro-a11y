# Architecture

## Goal

Provide an Astro-first accessibility workflow that complements raw audit engines.

## Main flow

1. Resolve a target:
   - local built directory
   - or a live URL
2. Apply security checks to remote targets
3. Start a local static server for directory scans
4. Crawl routes
5. Open each page in Playwright
6. Run axe through `@axe-core/playwright`
7. Enrich violations with RGAA mappings and correction guidance
8. Render terminal / JSON / HTML / Markdown reports

## Packages

- `@astro-a11y/core`
- `@astro-a11y/reporters`
- `astro-a11y` CLI
- `@astro-a11y/astro-integration`

## Why Playwright + axe

Playwright is the recommended route for browser automation and can be paired with axe for accessibility checks. The Playwright docs explicitly show accessibility testing through axe builders, and the axe API is built to return structured violation data that can be reused in a larger workflow. citeturn844490search1turn844490search10
