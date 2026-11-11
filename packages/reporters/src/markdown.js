export function escapeMd(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/[*_`[\]()#+\-!]/g, (c) => `\\${c}`)
    .replace(/\|/g, "\\|")
    .replace(/\n/g, "<br>");
}

export function renderMarkdown(result) {
  const lines = [];
  lines.push("# astro-a11y report");
  lines.push("");
  lines.push(`- **Target:** ${result.target}`);
  lines.push(`- **Mode:** ${result.mode}`);
  lines.push(`- **Generated:** ${result.generatedAt}`);
  lines.push(`- **Pages scanned:** ${result.summary.pagesScanned}`);
  const fresh = result.summary.newIssuesBySeverity;
  if (fresh) {
    lines.push(`- **New since baseline:** critical=${fresh.critical}, major=${fresh.major}, minor=${fresh.minor}, info=${fresh.info}`);
    lines.push(`- **Fixed since baseline:** ${result.summary.baseline?.fixedElements ?? 0} element(s)`);
  }
  lines.push("");
  lines.push("| Severity | Rule | RGAA | Page | Title |");
  lines.push("|---|---|---|---|---|");

  for (const issue of result.issues) {
    const severity = issue.isNew ? `${escapeMd(issue.severity)} (new)` : escapeMd(issue.severity);
    lines.push(`| ${severity} | ${escapeMd(issue.id)} | ${escapeMd(issue.rgaa)} | ${escapeMd(issue.page)} | ${escapeMd(issue.title)} |`);
  }

  lines.push("");
  for (const issue of result.issues) {
    lines.push(`## ${issue.title}`);
    lines.push("");
    lines.push(`- Severity: **${issue.severity}**`);
    lines.push(`- Rule: \`${issue.id}\``);
    lines.push(`- RGAA: **${issue.rgaa}**`);
    lines.push(`- Page: ${issue.page}`);
    lines.push(`- Why: ${issue.why}`);
    lines.push(`- Fix: ${issue.howToFix}`);
    if (issue.before || issue.after) {
      lines.push("");
      lines.push("```html");
      if (issue.before) lines.push(`Before: ${issue.before}`);
      if (issue.after) lines.push(`After: ${issue.after}`);
      lines.push("```");
    }
    lines.push("");
  }

  if (result.issues.length === 0) {
    lines.push("No accessibility issues detected by the configured automated checks.");
  }

  if (result.pageErrors?.length) {
    lines.push("");
    lines.push("## Pages that could not be scanned");
    lines.push("");
    for (const error of result.pageErrors) lines.push(`- ${escapeMd(error.page)}: ${escapeMd(error.message)}`);
  }

  return lines.join("\n");
}
