import { escapeMd } from './markdown.js';

/** Hidden marker used to find and update the previous comment on a pull request. */
export const GITHUB_COMMENT_MARKER = '<!-- astro-a11y-report -->';

// GitHub rejects comments over 65,536 characters.
const MAX_COMMENT_LENGTH = 60000;
const MAX_ROWS = 50;
const SEVERITY_RANK = { critical: 0, major: 1, minor: 2, info: 3 };

function pagePath(page) {
  try {
    const url = new URL(page);
    return `${url.pathname}${url.search}`;
  } catch {
    return String(page ?? '');
  }
}

function byPriority(a, b) {
  const newFirst = Number(b.isNew === true) - Number(a.isNew === true);
  if (newFirst !== 0) return newFirst;
  return (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9);
}

/**
 * Compact Markdown for a pull request comment or a job summary.
 *
 * @param {object} result Scan result (optionally with a baseline applied).
 * @param {{ reportUrl?: string }} [options] Link to the full report (e.g. the workflow run).
 */
export function renderGithubComment(result, options = {}) {
  const { summary } = result;
  const counts = summary.issuesBySeverity;
  const hasBaseline = Boolean(summary.newIssuesBySeverity);
  const lines = [GITHUB_COMMENT_MARKER, '## astro-a11y accessibility report', ''];

  lines.push('| Pages scanned | Critical | Major | Minor | Info |');
  lines.push('|---:|---:|---:|---:|---:|');
  lines.push(
    `| ${summary.pagesScanned} | ${counts.critical} | ${counts.major} | ${counts.minor} | ${counts.info} |`
  );
  lines.push('');

  if (hasBaseline) {
    const fresh = summary.newIssuesBySeverity;
    const totalNew = Object.values(fresh).reduce((sum, count) => sum + count, 0);
    lines.push(
      totalNew === 0
        ? '**No new issue** compared with the baseline.'
        : `**${totalNew} new issue(s)** compared with the baseline: critical ${fresh.critical}, major ${fresh.major}, minor ${fresh.minor}, info ${fresh.info}.`
    );
    if (summary.baseline?.fixedElements > 0) {
      lines.push(`${summary.baseline.fixedElements} known element(s) fixed since the baseline.`);
    }
    lines.push('');
  }

  if (result.pageErrors?.length) {
    lines.push(`**${result.pageErrors.length} page(s) could not be scanned:** see the full report.`, '');
  }

  const issues = [...result.issues].sort(byPriority);
  if (issues.length === 0) {
    lines.push('No accessibility issues detected by the configured automated checks.');
  } else {
    const header = hasBaseline
      ? ['| | Severity | RGAA | Rule | Page | Issue |', '|---|---|---|---|---|---|']
      : ['| Severity | RGAA | Rule | Page | Issue |', '|---|---|---|---|---|'];
    lines.push(...header);
    for (const issue of issues.slice(0, MAX_ROWS)) {
      const cells = [
        escapeMd(issue.severity),
        escapeMd(issue.rgaa),
        `\`${String(issue.id).replace(/`/g, '')}\``,
        escapeMd(pagePath(issue.page)),
        escapeMd(issue.title)
      ];
      if (hasBaseline) cells.unshift(issue.isNew ? '**new**' : '');
      lines.push(`| ${cells.join(' | ')} |`);
    }
    if (issues.length > MAX_ROWS) {
      lines.push('', `…and ${issues.length - MAX_ROWS} more.`);
    }
  }

  lines.push('');
  lines.push(
    options.reportUrl
      ? `Full HTML, JSON and Markdown reports: [workflow run](${options.reportUrl}).`
      : 'Automated checks only: they do not replace a manual RGAA audit.'
  );

  const body = lines.join('\n');
  if (body.length <= MAX_COMMENT_LENGTH) return body;
  return `${body.slice(0, MAX_COMMENT_LENGTH)}\n\n…comment truncated, see the full report.`;
}
