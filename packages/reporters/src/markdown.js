import { labels, severityLabel } from "./i18n.js";

export function escapeMd(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/[*_`[\]()#+\-!]/g, (c) => `\\${c}`)
    .replace(/\|/g, "\\|")
    .replace(/\n/g, "<br>");
}

/** Per-criterion table, shared with the GitHub comment. */
export function renderCriteriaMarkdown(result, t) {
  const criteria = result.criteria ?? [];
  if (criteria.length === 0) return [];
  const lines = [`## ${t.criteriaHeading}`, ""];
  lines.push(`| ${t.criterion} | ${t.topic} | ${t.outcome} | ${t.issues} |`);
  lines.push("|---|---|---|---:|");
  for (const line of criteria) {
    const outcome = t.outcomes[line.outcome] ?? line.outcome;
    const count = line.issues > 0 ? `${line.issues} (${t.elementsCount(line.elements)})` : "";
    lines.push(
      `| **${escapeMd(line.criterion)}** ${escapeMd(line.title)} | ${escapeMd(line.topic)} | ${escapeMd(outcome)} | ${count} |`
    );
  }
  lines.push("", `_${escapeMd(t.criteriaNote(result.rgaaVersion ?? "4.1.2"))}_`, "");
  return lines;
}

export function renderMarkdown(result) {
  const t = labels(result.lang);
  const lines = [];
  lines.push(`# ${t.reportTitle}`);
  lines.push("");
  lines.push(`- **${t.target}:** ${result.target}`);
  lines.push(`- **${t.mode}:** ${result.mode}`);
  lines.push(`- **${t.generated}:** ${result.generatedAt}`);
  lines.push(`- **${t.pagesScanned}:** ${result.summary.pagesScanned}`);
  const fresh = result.summary.newIssuesBySeverity;
  if (fresh) {
    lines.push(`- **${t.newSinceBaseline}:** critical=${fresh.critical}, major=${fresh.major}, minor=${fresh.minor}, info=${fresh.info}`);
    lines.push(`- **${t.fixedSinceBaseline}:** ${t.elementsCount(result.summary.baseline?.fixedElements ?? 0)}`);
  }
  lines.push("");
  lines.push(`| ${t.severity} | ${t.rule} | RGAA | ${t.page} | ${t.title} |`);
  lines.push("|---|---|---|---|---|");

  for (const issue of result.issues) {
    const severity = escapeMd(severityLabel(t, issue.severity));
    lines.push(
      `| ${issue.isNew ? `${severity} (${t.newIssue})` : severity} | ${escapeMd(issue.id)} | ${escapeMd(issue.rgaa)} | ${escapeMd(issue.page)} | ${escapeMd(issue.title)} |`
    );
  }

  lines.push("");
  for (const issue of result.issues) {
    lines.push(`## ${issue.title}`);
    lines.push("");
    lines.push(`- ${t.severity}: **${severityLabel(t, issue.severity)}**`);
    lines.push(`- ${t.rule}: \`${issue.id}\``);
    lines.push(`- RGAA: **${issue.rgaa}**${issue.rgaaTitle ? ` — ${issue.rgaaTitle}` : ""}`);
    lines.push(`- ${t.page}: ${issue.page}`);
    lines.push(`- ${t.why}: ${issue.why}`);
    lines.push(`- ${t.fix}: ${issue.howToFix}`);
    if (issue.before || issue.after) {
      lines.push("");
      lines.push("```html");
      if (issue.before) lines.push(`${t.before}: ${issue.before}`);
      if (issue.after) lines.push(`${t.after}: ${issue.after}`);
      lines.push("```");
    }
    lines.push("");
  }

  if (result.issues.length === 0) {
    lines.push(t.noIssues);
    lines.push("");
  }

  lines.push(...renderCriteriaMarkdown(result, t));

  if (result.pageErrors?.length) {
    lines.push(`## ${t.pagesNotScanned}`);
    lines.push("");
    for (const error of result.pageErrors) lines.push(`- ${escapeMd(error.page)}: ${escapeMd(error.message)}`);
  }

  return lines.join("\n");
}
