# Security Model

## Principles

- local-first
- no telemetry
- least privilege
- minimal dependency set
- explicit escape hatches instead of silent bypasses

## Remote scanning protections

Remote URLs are blocked by default when they resolve to:
- localhost
- private IP ranges
- metadata-style hosts
- `.local` names

This reduces SSRF-style risk when users point the tool at arbitrary URLs.

## Publishing and maintenance

Use:
- npm 2FA or trusted publishing
- weekly dependency review
- CI security audit
- release notes for changes affecting scanning behavior
