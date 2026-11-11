/**
 * Shared failure policy for the CLI and the Astro integration, so that a given
 * mode behaves the same way wherever the scan runs.
 *
 * - An explicit `failOn` always wins.
 * - `learning` never fails: it is a report-only mode.
 * - `strict` fails on `major` issues and above.
 * - Other modes (`balanced`, `paranoid`) fail on `major` only when the caller
 *   asks for it (`failByDefault`, e.g. the integration's `failOnBuild`).
 */

/** Severities from least to most severe. */
export const SEVERITY_ORDER = Object.freeze(['info', 'minor', 'major', 'critical']);

export const SCAN_MODES = Object.freeze(['strict', 'balanced', 'learning', 'paranoid']);

const DEFAULT_FAIL_THRESHOLD = 'major';

export function isSeverity(value) {
  return SEVERITY_ORDER.includes(value);
}

export function isScanMode(value) {
  return SCAN_MODES.includes(value);
}

/**
 * @param {{ mode?: string, failOn?: string, failByDefault?: boolean }} options
 * @returns {string | null} The minimum severity that fails the run, or `null` to never fail.
 */
export function resolveFailThreshold({ mode = 'balanced', failOn, failByDefault = false } = {}) {
  if (failOn !== undefined && failOn !== null) {
    if (!isSeverity(failOn)) {
      throw new Error(
        `Invalid fail threshold "${failOn}". Expected one of: ${SEVERITY_ORDER.join(', ')}.`
      );
    }
    return failOn;
  }
  if (mode === 'learning') return null;
  if (mode === 'strict' || failByDefault) return DEFAULT_FAIL_THRESHOLD;
  return null;
}

/**
 * When a baseline was applied (`summary.newIssuesBySeverity`), only new issues count.
 *
 * @param {{ issuesBySeverity: Record<string, number>, newIssuesBySeverity?: Record<string, number> }} summary
 * @param {string | null} threshold
 * @returns {boolean}
 */
export function hasIssuesAtOrAbove(summary, threshold) {
  if (threshold === null) return false;
  const thresholdIndex = SEVERITY_ORDER.indexOf(threshold);
  if (thresholdIndex === -1) return false;
  const counts = summary.newIssuesBySeverity ?? summary.issuesBySeverity;
  return SEVERITY_ORDER.slice(thresholdIndex).some((severity) => (counts[severity] ?? 0) > 0);
}
