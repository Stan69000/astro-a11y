import { createHash } from 'node:crypto';

/**
 * Baselines let a project adopt astro-a11y on an existing site: known issues
 * are recorded once, and later runs only fail on issues that are new.
 *
 * An issue is identified per affected element: axe rule + page path + CSS
 * target. The page is reduced to its path so that the random port of the
 * local static server, or a preview hostname, does not change the identity.
 * Limitation: a target selector that changes (DOM reshuffle) counts as new.
 */

export const BASELINE_VERSION = 1;

const SEVERITIES = ['critical', 'major', 'minor', 'info'];

/** Page identity independent of host and port. */
export function pageKey(page) {
  try {
    const url = new URL(page);
    return `${url.pathname}${url.search}`;
  } catch {
    return String(page ?? '');
  }
}

function hash(value) {
  return createHash('sha256').update(value).digest('hex').slice(0, 20);
}

export function nodeFingerprint(issue, node) {
  const target = Array.isArray(node?.target) ? node.target.join(' ') : String(node?.target ?? '');
  return hash([issue.id, pageKey(issue.page), target].join('\u0000'));
}

/** Fingerprints of every element affected by an issue (one when no node is reported). */
export function issueFingerprints(issue) {
  const nodes = Array.isArray(issue.nodes) && issue.nodes.length > 0 ? issue.nodes : [{}];
  return nodes.map((node) => nodeFingerprint(issue, node));
}

/**
 * @param {{ target: string, issues: object[] }} result A scan result.
 * @returns {{ version: number, generatedAt: string, fingerprints: string[] }}
 */
export function createBaseline(result) {
  const fingerprints = new Set(result.issues.flatMap(issueFingerprints));
  return {
    version: BASELINE_VERSION,
    generatedAt: new Date().toISOString(),
    fingerprints: Array.from(fingerprints).sort()
  };
}

/**
 * @param {string} contents Raw baseline file contents.
 * @returns {{ version: number, fingerprints: string[] }}
 */
export function parseBaseline(contents) {
  let data;
  try {
    data = JSON.parse(contents);
  } catch (error) {
    throw new Error(`Baseline is not valid JSON: ${error.message}`);
  }
  if (data?.version !== BASELINE_VERSION) {
    throw new Error(
      `Unsupported baseline version: ${data?.version}. Expected ${BASELINE_VERSION}.`
    );
  }
  if (
    !Array.isArray(data.fingerprints) ||
    !data.fingerprints.every((fp) => typeof fp === 'string')
  ) {
    throw new Error('Baseline "fingerprints" must be an array of strings.');
  }
  return data;
}

/**
 * Marks each issue and node as new or known, and adds baseline counts to the summary.
 * Once a baseline is applied, the failure policy only counts new issues.
 *
 * @returns A new result; the input is not modified.
 */
export function applyBaseline(result, baseline) {
  const known = new Set(baseline.fingerprints);
  const seen = new Set();
  const newIssuesBySeverity = Object.fromEntries(SEVERITIES.map((severity) => [severity, 0]));

  const issues = result.issues.map((issue) => {
    const fingerprints = issueFingerprints(issue);
    fingerprints.forEach((fp) => seen.add(fp));
    const nodes = (issue.nodes ?? []).map((node, index) => ({
      ...node,
      isNew: !known.has(fingerprints[index])
    }));
    const isNew = fingerprints.some((fp) => !known.has(fp));
    if (isNew) newIssuesBySeverity[issue.severity] += 1;
    return { ...issue, nodes, isNew };
  });

  const fixed = baseline.fingerprints.filter((fp) => !seen.has(fp)).length;

  return {
    ...result,
    issues,
    summary: {
      ...result.summary,
      newIssuesBySeverity,
      baseline: { knownElements: baseline.fingerprints.length, fixedElements: fixed }
    }
  };
}
