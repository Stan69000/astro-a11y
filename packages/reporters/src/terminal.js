export function renderTerminal(result) {
  const lines = [];
  lines.push(`astro-a11y report`);
  lines.push(`Target: ${result.target}`);
  lines.push(`Mode: ${result.mode}`);
  lines.push(`Generated: ${result.generatedAt}`);
  lines.push(`Pages scanned: ${result.summary.pagesScanned}`);
  lines.push(
    `Issues: critical=${result.summary.issuesBySeverity.critical}, major=${result.summary.issuesBySeverity.major}, minor=${result.summary.issuesBySeverity.minor}, info=${result.summary.issuesBySeverity.info}`
  );
  const fresh = result.summary.newIssuesBySeverity;
  if (fresh) {
    lines.push(
      `New since baseline: critical=${fresh.critical}, major=${fresh.major}, minor=${fresh.minor}, info=${fresh.info} · fixed elements: ${result.summary.baseline?.fixedElements ?? 0}`
    );
  }
  if (result.pageErrors?.length) {
    lines.push(`Pages that could not be scanned: ${result.pageErrors.length}`);
    for (const error of result.pageErrors) lines.push(`  - ${error.page}: ${error.message}`);
  }
  lines.push("");

  for (const issue of result.issues) {
    const marker = issue.isNew ? "[NEW] " : "";
    lines.push(`${marker}[${issue.severity.toUpperCase()}] ${issue.title} — RGAA ${issue.rgaa}`);
    lines.push(`Page: ${issue.page}`);
    lines.push(`Rule: ${issue.id}`);
    if (issue.howToFix) lines.push(`Fix: ${issue.howToFix}`);
    if (issue.nodes?.length) {
      const firstNode = issue.nodes[0];
      if (firstNode.target) lines.push(`Target: ${firstNode.target}`);
      if (firstNode.failureSummary) lines.push(`Summary: ${firstNode.failureSummary.replace(/\n/g, " ")}`);
    }
    lines.push("");
  }

  if (result.issues.length === 0) {
    lines.push("No accessibility issues detected by the configured automated checks.");
  }

  return lines.join("\n");
}
