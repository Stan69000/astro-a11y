# Security Policy

## Supported versions

Only the latest minor release line is supported for security fixes.

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability.

Instead, use GitHub's private reporting: **Security → Report a vulnerability** on this repository. Include:
- affected package and version
- impact
- reproduction steps
- suggested remediation, if known

Acknowledge target: within 5 business days  
Initial triage: within 10 business days

## Security model

This tool is intentionally designed to reduce attack surface:

- local-first execution
- no telemetry
- remote targets blocked by default if they resolve to localhost, private IP ranges, or metadata-style hosts
- remote redirects are validated hop-by-hop and capped by default
- every request made by the browser while scanning (images, scripts, frames, fetch, WebSockets) goes through the same checks: a scanned page cannot reach the scanner's private network, unless `--allow-unsafe-targets` is set
- the local static server only serves real files inside the build directory (symbolic links pointing outside are refused)
- sitemap crawling keeps same-host pages only, with caps on pages, documents and response size
- only `http`/`https` targets are accepted
- minimal dependency footprint
- short request and browser timeouts
- no arbitrary code execution hooks
- reports written locally only

## Safe operation guidance

- `--allow-unsafe-targets` weakens SSRF protections and should only be used in trusted test environments.
- For external or untrusted scan targets, run `astro-a11y` from an isolated VM/container with constrained network egress.
- Use `--mode paranoid` for high-risk scans: Chromium's OS sandbox enabled (the scan fails instead of running unsandboxed when the system cannot provide it, e.g. as root, or on Ubuntu 23.10+ where AppArmor blocks unprivileged user namespaces: the error message explains the fixes), redirects disabled, sensitive ports blocked, safe report output. In other modes, as with Playwright's default, Chromium runs without its OS sandbox.

## Known limitations

- DNS rebinding: target checks resolve DNS before the browser does. A domain that switches to a private address between the two lookups is not caught. Scan untrusted sites from an isolated environment with restricted egress.
- Pages are rendered with JavaScript enabled: a hostile page runs code in the scanning browser.

## Supply chain hygiene

- npm packages are published from GitHub Actions with trusted publishing (no stored token) and provenance attestations (see RELEASING.md).
- Workflows pin every action to a commit SHA, never persist checkout credentials, and are checked with zizmor on every change; code is analysed with CodeQL.
- Dependabot waits 7 days before proposing a new release.

- In CI, install dependencies with lockfile enforcement (`pnpm install --frozen-lockfile`).
- Prefer `pnpm install --ignore-scripts` in constrained/security-sensitive environments where install hooks are not required.
- Keep automated dependency audits enabled (`pnpm audit --prod`) and review new runtime dependencies before merge.

## Out of scope

The following are not considered vulnerabilities on their own:
- findings produced by third-party engines such as axe-core
- incorrect accessibility advice for subjective/manual-only criteria
- user modifications that disable built-in target protections
