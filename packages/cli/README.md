# astro-a11y

CLI that scans a static build folder or a live URL with Playwright + axe-core, maps findings to RGAA 4.1.2 criteria and renders terminal, JSON, HTML or Markdown reports.

```bash
npx playwright install chromium
npx astro-a11y check ./dist --mode balanced
npx astro-a11y check https://example.com --mode paranoid --allowed-domains example.com
```

Modes, options and security guards: see the [main documentation](https://github.com/Stan69000/astro-a11y#readme) ([français](https://github.com/Stan69000/astro-a11y/blob/main/README.fr.md)).

Backed by [Le Singe du Numérique](https://lesingedunumerique.fr). MIT licensed.
