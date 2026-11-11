import { labels, severityLabel } from "./i18n.js";

export function renderTerminal(result) {
  const t = labels(result.lang);
  const counts = result.summary.issuesBySeverity;
  const lines = [];
  lines.push(t.reportTitle);
  lines.push(`${t.target}: ${result.target}`);
  lines.push(`${t.mode}: ${result.mode}`);
  lines.push(`${t.generated}: ${result.generatedAt}`);
  lines.push(`${t.pagesScanned}: ${result.summary.pagesScanned}`);
  const countsText = (values) =>
    ["critical", "major", "minor", "info"].map((severity) => `${severityLabel(t, severity)}=${values[severity]}`).join(", ");
  lines.push(`${t.issues}: ${countsText(counts)}`);
  const fresh = result.summary.newIssuesBySeverity;
  if (fresh) {
    lines.push(
      `${t.newSinceBaseline}: ${countsText(fresh)} · ${t.fixedElements}: ${result.summary.baseline?.fixedElements ?? 0}`
    );
  }
  if (result.pageErrors?.length) {
    lines.push(`${t.pagesNotScanned}: ${result.pageErrors.length}`);
    for (const error of result.pageErrors) lines.push(`  - ${error.page}: ${error.message}`);
  }
  lines.push("");

  for (const issue of result.issues) {
    const marker = issue.isNew ? `[${t.newIssue.toUpperCase()}] ` : "";
    lines.push(`${marker}[${severityLabel(t, issue.severity).toUpperCase()}] ${issue.title} — RGAA ${issue.rgaa}`);
    lines.push(`${t.page}: ${issue.page}`);
    lines.push(`${t.rule}: ${issue.id}`);
    if (issue.howToFix) lines.push(`${t.fix}: ${issue.howToFix}`);
    if (issue.nodes?.length) {
      const firstNode = issue.nodes[0];
      if (firstNode.target) lines.push(`${t.element}: ${firstNode.target}`);
      if (firstNode.failureSummary) lines.push(`${t.nodeSummary}: ${firstNode.failureSummary.replace(/\n/g, " ")}`);
    }
    lines.push("");
  }

  if (result.issues.length === 0) {
    lines.push(t.noIssues);
  }

  const failedCriteria = (result.criteria ?? []).filter((line) => line.outcome === "failed");
  if (failedCriteria.length > 0) {
    lines.push("");
    lines.push(`${t.criteriaHeading} — ${t.outcomes.failed}: ${failedCriteria.map((line) => line.criterion).join(", ")}`);
  }

  return lines.join("\n");
}
