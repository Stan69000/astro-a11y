# static-site example

A tiny static fixture used to validate the scanner against real HTML files.
Run it from the repository root with `pnpm example:scan`.

The HTML lives in `site/` (not `dist/`, which is git-ignored).

It intentionally contains:

- `/`: an image without alt text, a button without accessible name, low-contrast text, an iframe without title
- `/contact/`: no `lang` attribute, no `<title>`, a form field without label
