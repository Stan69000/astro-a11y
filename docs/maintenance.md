# Maintenance Notes

## What changes most often

1. Astro Integration API details
2. Playwright browser versions
3. axe rule behavior
4. dependency security updates

## Monthly checklist

- review Dependabot PRs
- read Astro release notes
- read Playwright release notes
- run fixture scans locally
- verify report formats still render correctly

## Important compatibility note

Astro removed `routes` from `astro:build:done` in v6 and expects integrations to collect routes through `astro:routes:resolved` instead. This starter follows that approach. citeturn844490search0turn844490search3
