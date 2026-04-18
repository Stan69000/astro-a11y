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
- minimal dependency footprint
- short request and browser timeouts
- no arbitrary code execution hooks
- reports written locally only

## Out of scope

The following are not considered vulnerabilities on their own:
- findings produced by third-party engines such as axe-core
- incorrect accessibility advice for subjective/manual-only criteria
- user modifications that disable built-in target protections
