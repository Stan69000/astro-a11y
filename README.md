# astro-a11y

English | [Français](./README.fr.md)

[![Node.js Version](https://img.shields.io/node/v/astro-a11y)](https://nodejs.org)
[![RGAA Version](https://img.shields.io/badge/RGAA-4.1-green)](https://accessibilite.numerique.gouv.fr/)

Accessibility guardrails for Astro projects.

`astro-a11y` is an Astro-first accessibility toolkit that scans rendered pages with Playwright + axe, enriches findings with actionable guidance, maps common issues to RGAA criteria, and runs from the CLI or at the end of an Astro build.

## Quick Start

```bash
pnpm install
pnpm build
pnpm test
pnpm example:scan
```

## Beginner Guide

### Case 1 - Set up a new Astro site with astro-a11y

1. Create your Astro site.
2. Install the integration package.
3. Register the integration in `astro.config.mjs`.
4. Run the build and read the generated report.

Example:

```bash
# 1) New project
pnpm create astro@latest my-site
cd my-site

# 2) Dependency
pnpm add -D @astro-a11y/astro-integration
```

```js
// 3) astro.config.mjs
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

```bash
# 4) Build + automatic scan at the end of the build
pnpm astro build
```

By default, reports are written to `dist/astro-a11y/`.

### Case 2 - Connect astro-a11y to an existing site

You have two options depending on your setup:

- Option A: you have an Astro project and want scans on every build -> use the Astro integration.
- Option B: you already have a static build or a staging/production URL -> use the `astro-a11y check` CLI.

Option A (existing Astro project):

```bash
pnpm add -D @astro-a11y/astro-integration
```

Then add the same config as in Case 1, and run:

```bash
pnpm astro build
```

Option B (already deployed site or existing `dist` folder):

```bash
# Scan a local build directory
npx astro-a11y check ./dist --mode balanced

# Scan a remote URL (with domain safety guardrails)
npx astro-a11y check https://example.com --mode paranoid --allowed-domains example.com
```

### Read results quickly

- `terminal`: readable in the console (default).
- `json`: CI-friendly format.
- `html`: easy to share with non-technical stakeholders.
- `markdown`: useful for tickets and pull requests.

Example HTML report flow:

```bash
npx astro-a11y check ./dist --format json --output reports/report.json
npx astro-a11y report --input reports/report.json --format html --output reports/report.html --safe-report
```

## CLI

```bash
astro-a11y check <target> [--mode strict|balanced|learning|paranoid] [--format terminal|json|html|markdown]
astro-a11y report --input ./reports/report.json [--format terminal|json|html|markdown] [--safe-report]
```

Examples:

```bash
astro-a11y check ./dist --mode balanced
astro-a11y check https://example.com --mode paranoid --allowed-domains example.com
astro-a11y check https://example.com --format json --output reports/report.json
astro-a11y report --input reports/report.json --format html --output reports/report.html --safe-report
```

## Astro Integration

```js
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

Reports are written to `<dist>/astro-a11y/` by default.

## For Contributors

This project is maintained by one person, with community contributions welcome.

- Contributing guide: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Support & expectations: [SUPPORT.md](./SUPPORT.md)
- Project direction: [ROADMAP.md](./ROADMAP.md)
- Security policy: [SECURITY.md](./SECURITY.md)

## Repository Layout

- `packages/core` - scanning engine, security guards, RGAA mapping
- `packages/reporters` - terminal, JSON, HTML, Markdown reporters
- `packages/cli` - CLI entrypoint
- `packages/astro-integration` - Astro integration package
- `examples/static-site` - static site fixture
- `tests` - automated tests

## Security Stance

- Local-first by default
- No telemetry
- Unsafe remote targets blocked unless explicitly allowed
- Paranoid mode for strict remote scans
- Dedicated security audit workflow
