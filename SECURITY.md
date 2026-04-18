# Security Policy

## Supported versions

Only the latest minor release line is supported for security fixes.

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability.

Instead, send a private report with:
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
- only `http`/`https` targets are accepted
- minimal dependency footprint
- short request and browser timeouts
- no arbitrary code execution hooks
- reports written locally only

## Safe operation guidance

- `--allow-unsafe-targets` weakens SSRF protections and should only be used in trusted test environments.
- For external or untrusted scan targets, run `astro-a11y` from an isolated VM/container with constrained network egress.
- Use `--mode paranoid` for high-risk scans (sandbox enforced, redirects disabled, stricter network checks, safe report output).

## Supply chain hygiene

- In CI, install dependencies with lockfile enforcement (`pnpm install --frozen-lockfile`).
- Prefer `pnpm install --ignore-scripts` in constrained/security-sensitive environments where install hooks are not required.
- Keep automated dependency audits enabled (`pnpm audit --prod`) and review new runtime dependencies before merge.

## Out of scope

The following are not considered vulnerabilities on their own:
- findings produced by third-party engines such as axe-core
- incorrect accessibility advice for subjective/manual-only criteria
- user modifications that disable built-in target protections
