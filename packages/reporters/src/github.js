import { labels, severityLabel } from './i18n.js';
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

const capitalize = (text) => text.replace(/^./, (c) => c.toUpperCase());

/**
 * Compact Markdown for a pull request comment or a job summary.
 *
 * @param {object} result Scan result (optionally with a baseline applied).
 * @param {{ reportUrl?: string }} [options] Link to the full report (e.g. the workflow run).
 */
export function renderGithubComment(result, options = {}) {
  const t = labels(result.lang);
  const { summary } = result;
  const counts = summary.issuesBySeverity;
  const hasBaseline = Boolean(summary.newIssuesBySeverity);
  const lines = [GITHUB_COMMENT_MARKER, `## ${t.commentTitle}`, ''];

  const severities = ['critical', 'major', 'minor', 'info'];
  lines.push(
    `| ${t.pagesScanned} | ${severities.map((s) => capitalize(severityLabel(t, s))).join(' | ')} |`
  );
  lines.push('|---:|---:|---:|---:|---:|');
  lines.push(
    `| ${Number(summary.pagesScanned)} | ${severities.map((s) => Number(counts[s])).join(' | ')} |`
  );
  lines.push('');

  if (hasBaseline) {
    const fresh = summary.newIssuesBySeverity;
    const totalNew = Object.values(fresh).reduce((sum, count) => sum + count, 0);
    lines.push(totalNew === 0 ? t.noNewIssue : t.newIssues(totalNew, fresh));
    if (summary.baseline?.fixedElements > 0) {
      lines.push(t.knownFixed(summary.baseline.fixedElements));
    }
    lines.push('');
  }

  if (result.pageErrors?.length) {
    lines.push(t.pagesNotScannedCount(result.pageErrors.length), '');
  }

  const failedCriteria = (result.criteria ?? []).filter((line) => line.outcome === 'failed');
  if (failedCriteria.length > 0) {
    lines.push(
      t.failedCriteria(failedCriteria.map((line) => escapeMd(line.criterion)).join(', ')),
      ''
    );
  }

  const issues = [...result.issues].sort(byPriority);
  if (issues.length === 0) {
    lines.push(t.noIssues);
  } else {
    const columns = [t.severity, 'RGAA', t.rule, t.page, t.title];
    if (hasBaseline) columns.unshift('');
    lines.push(`| ${columns.join(' | ')} |`, `|${columns.map(() => '---').join('|')}|`);
    for (const issue of issues.slice(0, MAX_ROWS)) {
      const cells = [
        escapeMd(severityLabel(t, issue.severity)),
        escapeMd(issue.rgaa),
        `\`${String(issue.id).replace(/`/g, '')}\``,
        escapeMd(pagePath(issue.page)),
        escapeMd(issue.title)
      ];
      if (hasBaseline) cells.unshift(issue.isNew ? `**${t.newIssue}**` : '');
      lines.push(`| ${cells.join(' | ')} |`);
    }
    if (issues.length > MAX_ROWS) {
      lines.push('', t.more(issues.length - MAX_ROWS));
    }
  }

  lines.push('');
  lines.push(
    /^https?:\/\//i.test(options.reportUrl ?? '')
      ? t.fullReport(options.reportUrl)
      : t.automatedOnly
  );

  const body = lines.join('\n');
  if (body.length <= MAX_COMMENT_LENGTH) return body;
  return `${body.slice(0, MAX_COMMENT_LENGTH)}\n\n${t.truncated}`;
}
