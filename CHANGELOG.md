# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2024-01-01

### Added

- Initial release of astro-a11y
- Scan local directories or remote URLs for accessibility issues
- Playwright + axe-core integration
- Multiple output formats: terminal, JSON, HTML, Markdown
- RGAA 4.1 mapping for 17 axe rules
- Security guards: block localhost/private IP targets by default
- Astro integration for automatic post-build scanning

### Security

- Path traversal protection in static server
- Output path validation in CLI and integration
- SSRF protection: revalidation after HTTP redirects

### CLI Options

- `--mode` - strict|balanced|learning
- `--format` - terminal|json|html|markdown
- `--timeout` - page load timeout in milliseconds
- `--progress` - show scanning progress
- `--include-rules` - comma-separated axe rule IDs to include
- `--exclude-rules` - comma-separated axe rule IDs to exclude
- `--allow-unsafe-targets` - allow scanning localhost/private targets

### Astro Integration Options

- `mode` - strict|balanced|learning
- `writeReports` - write report files (default: true)
- `outputDirName` - directory name for reports (default: "astro-a11y")
- `reportFormats` - array of formats to write (default: ["json", "html", "markdown"])
- `failOnBuild` - fail the build if issues found (default: false)
- `timeout` - page load timeout in ms (default: 15000)
- `showProgress` - show scanning progress (default: false)

### Fixed

- chromium.launch now uses --no-sandbox for CI compatibility
- Sévérité par défaut des règles non mappées: minor → major
- CI workflows now use frozen lockfile
- Static server properly validates paths to prevent traversal
