# Contributing

Thanks for contributing to `astro-a11y`.

## Scope

- Keep changes focused and small.
- Prefer bug fixes and concrete improvements over large refactors.
- If behavior changes, include tests.

## Local Setup

```bash
pnpm install
pnpm build
pnpm lint
pnpm test
```

## Pull Requests

- Use clear commit messages.
- Explain user impact and risk in the PR description.
- Link the related issue when relevant.
- Ensure CI is green before requesting review.

## Coding Notes

- Source of truth is under `packages/*/src`.
- `dist` files are generated outputs.
- Keep defaults secure (especially for remote scans).

## Community Expectations

This project is maintained by one person. Review and merge timing can vary.
