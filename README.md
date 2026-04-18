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

## CLI

```bash
astro-a11y check <target> [--mode strict|balanced|learning] [--format terminal|json|html|markdown]
astro-a11y report --input ./reports/report.json [--format terminal|json|html|markdown]
```

Examples:

```bash
astro-a11y check ./dist --mode balanced
astro-a11y check https://example.com --format json --output reports/report.json
astro-a11y report --input reports/report.json --format html --output reports/report.html
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
- Dedicated security audit workflow
