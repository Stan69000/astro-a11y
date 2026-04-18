function escapeMd(value) {
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
  lines.push("");
  lines.push("| Severity | Rule | RGAA | Page | Title |");
  lines.push("|---|---|---|---|---|");

  for (const issue of result.issues) {
    lines.push(`| ${escapeMd(issue.severity)} | ${escapeMd(issue.id)} | ${escapeMd(issue.rgaa)} | ${escapeMd(issue.page)} | ${escapeMd(issue.title)} |`);
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

  return lines.join("\n");
}
