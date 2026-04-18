# astro-a11y

[![Node.js Version](https://img.shields.io/node/v/astro-a11y)](https://nodejs.org)
[![RGAA Version](https://img.shields.io/badge/RGAA-4.1-green)](https://accessibilite.numerique.gouv.fr/)

Accessibility guardrails for Astro projects.

`astro-a11y` is an Astro-first accessibility toolkit built to complement raw audit engines.
It scans rendered pages with Playwright + axe, enriches findings with actionable guidance,
maps common issues to RGAA criteria, and can run from the CLI or automatically at the end
of an Astro build.

## What this starter already does

- Scan a built static site directory or a live URL
- Serve static build output locally for scanning
- Crawl discovered HTML pages or use routes passed by Astro
- Run Playwright + axe accessibility checks
- Produce terminal, JSON, HTML, and Markdown reports
- Map common axe rule IDs to RGAA criteria and fix guidance
- Block unsafe remote targets by default (localhost/private IPs/metadata hosts)
- Integrate with Astro using the official Integration API
- Fail the build in `strict` mode if critical or major issues are found

## What it does not claim

This project helps teams improve accessibility and move toward RGAA/WCAG compliance.
It does **not** certify compliance and does **not** replace a full manual audit.

## Quick start

```bash
pnpm install
pnpm -r build
pnpm astro-a11y check ./examples/static-site/dist --mode learning --format html --output ./reports/report.html
```

## CLI usage

```bash
astro-a11y check <target> [-m|--mode strict|balanced|learning] [-f|--format terminal|json|html|markdown]
astro-a11y report --input ./reports/report.json [-f|--format html|markdown|terminal|json]
```

Examples:

```bash
astro-a11y check ./dist --mode balanced
astro-a11y check https://example.com --format json --output reports/report.json
astro-a11y report --input reports/report.json --format html --output reports/report.html
```

### CLI options

| Option                   | Alias | Description                                      |
| ------------------------ | ----- | ------------------------------------------------ |
| `--mode`                 | `-m`  | Scan mode: strict, balanced, or learning         |
| `--format`               | `-f`  | Output format: terminal, json, html, or markdown |
| `--output`               | `-o`  | Output file path                                 |
| `--timeout`              |       | Page load timeout in milliseconds                |
| `--progress`             |       | Show scanning progress                           |
| `--include-rules`        |       | Comma-separated axe rule IDs to include          |
| `--exclude-rules`        |       | Comma-separated axe rule IDs to exclude          |
| `--allow-unsafe-targets` |       | Allow scanning localhost/private targets         |
| `--fail-on`              |       | Fail on: critical, major, or minor               |

## Astro integration

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import astroA11y from '@astro-a11y/astro-integration';

export default defineConfig({
  integrations: [
    astroA11y({
      mode: 'balanced',
      failOnBuild: false,
      writeReports: true
    })
  ]
});
```

The integration stores reports inside `<dist>/astro-a11y/>`.

### Integration options

| Option          | Type       | Default                        | Description                                    |
| --------------- | ---------- | ------------------------------ | ---------------------------------------------- |
| `mode`          | `string`   | `"balanced"`                   | Scan mode: `strict`, `balanced`, or `learning` |
| `writeReports`  | `boolean`  | `true`                         | Whether to write report files                  |
| `outputDirName` | `string`   | `"astro-a11y"`                 | Directory name for reports                     |
| `reportFormats` | `string[]` | `["json", "html", "markdown"]` | Formats to write                               |
| `failOnBuild`   | `boolean`  | `false`                        | Fail the build if issues are found             |
| `timeout`       | `number`   | `15000`                        | Page load timeout in ms                        |
| `showProgress`  | `boolean`  | `false`                        | Show scanning progress in build output         |

## Package layout

- `packages/core` - scanning engine, security guards, RGAA mapping
- `packages/reporters` - terminal, JSON, HTML, Markdown reporters
- `packages/cli` - CLI entrypoint
- `packages/astro-integration` - Astro integration package
- `examples/static-site` - static site fixture for local validation
- `tests` - smoke tests for core utilities and mappings

## Security stance

- Local-first by default
- No telemetry
- Unsafe remote targets blocked unless explicitly allowed
- Short timeouts
- Minimal dependency surface
- Dedicated `SECURITY.md`
- CI security audit workflow
