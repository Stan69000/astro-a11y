# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.2.1] - 2026-11-12

First release published by the GitHub Actions release workflow (npm trusted publishing, with provenance). The published packages' code is unchanged from 0.2.0.

### Fixed

- Release workflow: tarballs are published by relative path (`./tarballs/…`); npm took `tarballs/<file>` for a GitHub repository and the first automated publish failed before uploading anything.

### Security

- Development tooling: `minimatch` forced to 11.0.1 or later (GHSA-g3hv-75wg-m249, CPU exhaustion with a crafted glob). It came in through ESLint only and was never part of the published packages.

## [0.2.0] - 2026-11-12

### Security

- Network guard: every request of the scanning browser (subresources, fetch, WebSockets) is checked against the remote-target rules, so a scanned page cannot reach private addresses or metadata endpoints. Blocked URLs are listed in `blockedRequests`.
- `--mode paranoid` now really enables Chromium's OS sandbox (Playwright disables it by default) and fails closed when it is unavailable. The error explains the Ubuntu 23.10+ AppArmor restriction on user namespaces and how to lift it.
- The local static server refuses symbolic links that point outside the build directory (they were served before) and encoded traversal; it sends `nosniff` and correct types for fonts and modern images.
- Workflows: checkout credentials no longer persisted, no dependency cache in releases, exact npm version for publishing, Dependabot cooldown of 7 days, CodeQL and zizmor analysis.

### Added

- Learning mode reports (`--mode learning`): issues grouped by rule, explained in plain words, with who is affected and how to experience the problem yourself (lessons for the 34 criteria checked, in English and French), plus what already works and what to check by hand.
- The HTML report is now accessible itself (`<main>` landmark) and checked with axe-core in the e2e tests.
- RGAA mapping extended from 17 to 87 axe-core rules (images, frames, colors, media, tables, links, ARIA, mandatory elements, structure, presentation, forms, navigation, consultation), each with English and French texts. Unmapped rules take their severity from axe's impact.
- `--lang fr` / `lang: 'fr'` / Action `lang` input: issue texts and every report format in French.
- Per-criterion view in every report (`criteria` in JSON): outcome of each RGAA criterion touched by the rules that ran (issues found, to check manually, no issue detected, not applicable), with counts and worst severity.
- `rgaaVersion` and `lang` in scan results.
- RGAA reference shared with rgaa-audit (RGAA 4.1.2, 13 topics, official titles of the 106 criteria): issues now carry `rgaaTitle`, `RGAA_VERSION` is `4.1.2`, a test checks that every mapped criterion exists, `scripts/sync-rgaa-reference.js` and a weekly drift check keep the copy identical to rgaa-audit's.
- Keyboard checks with real key presses: keyboard trap (RGAA 12.9), invisible focus (RGAA 10.7), broken skip link (RGAA 12.7). On by default; `--no-keyboard`, `keyboard: false` or the Action's `keyboard` input turn them off. Real-browser tests in `pnpm test:e2e` and a CI job.
- `--sitemap [url]` and `--max-pages <n>`: scan every page of a deployed site from its sitemaps (robots.txt, `/sitemap-index.xml`, `/sitemap.xml`, sitemap indexes), same-host only, with the remote security guards on every request. Unreachable pages are reported (`pageErrors`) and fail a gated run. Also `sitemap` / `max-pages` inputs in the GitHub Action.
- Pages answering HTTP 4xx/5xx are reported as errors instead of being scanned as content.
- Baselines: `--write-baseline <file>` records known issues, `--baseline <file>` marks new issues and makes the failure threshold count only them (also `baseline` option in the integration).
- `github` report format: compact Markdown for pull request comments and job summaries (`--report-url` links the full report).
- GitHub Action (`action.yml`): scan, sticky pull request comment, job summary, report artifact, baseline-aware failure.
- `astro-a11y install-browser [--with-deps]` downloads the Chromium build matching the bundled Playwright; a missing browser now fails with this command in the error message.
- Release workflow (`.github/workflows/release.yml`): npm trusted publishing (OIDC, no stored token) with provenance; `scripts/check-release.js` and `RELEASING.md`.
- npm metadata on every package (license, repository, homepage, engines, README, LICENSE).

### Fixed

- `astro-a11y --version` reads the installed package version (it always printed 0.1.0).
- HTML tags in explanations (`<label for>`, `<marquee>`…) are escaped in Markdown reports instead of being interpreted by Markdown renderers.
- HTML reports written by astro-a11y are no longer scanned as pages when a build directory is scanned again.
- Astro integration no longer crashes on dynamic routes (`[slug].astro`, `[...path].astro`): pages are resolved from the files Astro generated (`assets` map), and endpoints, redirects and on-demand pages are skipped.
- `summary.pagesScanned` now counts every scanned page, not only pages with issues.
- RGAA 4.1 mapping corrected against the official reference: `input-image-alt` → 1.1, `link-name` → 6.2, `dlitem` → 9.3, `aria-valid-attr` / `aria-roles` / `focus-order-semantics` → 7.1, `region` → 12.6.
- `focus-order-semantics` now describes the actual rule (focusable element without an interactive role).
- `--fail-on` with an invalid value now exits with an error instead of being silently ignored; same for `--mode`.
- `--fail-on` now overrides `--mode strict` instead of being ignored.
- `pnpm example:scan` works from a fresh clone: the fixture lives in `examples/static-site/site/` (the former `dist/` folder was git-ignored and never committed).

### Changed

- Modes now behave the same in the CLI and the integration: `strict` fails on `major`+, `learning` never fails, an explicit `failOn` always wins.
- The integration validates its options (`mode`, `failOn`, `outputDirName`, `reportFormats`) and accepts `failOn`, `includeTags` and `excludeRules`.
- `summarizeIssues(issues, pagesScanned)` now requires the number of scanned pages.

### Docs

- README (EN/FR) and landing page: project backed by Le Singe du Numérique, npm availability note, modes table, integration options.

## [0.1.0] - 2026-04-18

### Added

- Initial release of astro-a11y
- Scan local directories or remote URLs for accessibility issues
- Playwright + axe-core integration
- Multiple output formats: terminal, JSON, HTML, Markdown
- RGAA 4.1 mapping for 17 axe rules
- Security guards: block localhost/private IP targets by default
- Astro integration for automatic post-build scanning

### Security

- Path traversal protection in static server
- Output path validation in CLI and integration
- SSRF protection: revalidation after HTTP redirects

### CLI Options

- `--mode` - strict|balanced|learning
- `--format` - terminal|json|html|markdown
- `--timeout` - page load timeout in milliseconds
- `--progress` - show scanning progress
- `--include-tags` - comma-separated axe tags to include (e.g. `wcag2a,wcag2aa`)
- `--exclude-rules` - comma-separated axe rule IDs to exclude
- `--allow-unsafe-targets` - allow scanning localhost/private targets

### Astro Integration Options

- `mode` - strict|balanced|learning
- `writeReports` - write report files (default: true)
- `outputDirName` - directory name for reports (default: "astro-a11y")
- `reportFormats` - array of formats to write (default: ["json", "html", "markdown"])
- `failOnBuild` - fail the build if issues found (default: false)
- `timeout` - page load timeout in ms (default: 15000)
- `showProgress` - show scanning progress (default: false)

### Fixed

- chromium.launch now uses --no-sandbox for CI compatibility
- Sévérité par défaut des règles non mappées: minor → major
- CI workflows now use frozen lockfile
- Static server properly validates paths to prevent traversal
