import { labels, severityLabel } from "./i18n.js";
import { groupIssuesByRule } from "./learning.js";

export function escapeMd(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/[*_`[\]()#+\-!]/g, (c) => `\\${c}`)
    .replace(/\|/g, "\\|")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

/**
 * Prose written into Markdown: HTML tags in explanations (e.g. "<label for>") must stay
 * visible text instead of being interpreted, or dropped, by Markdown renderers.
 */
export function mdText(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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

/** Learning layout: one topic per rule, explained in plain words, then what already works. */
function renderLearningMarkdown(result, t) {
  const lines = [`# ${t.reportTitle}`, "", `> ${t.learningIntro}`, ""];
  lines.push(`- **${t.target}:** ${result.target}`);
  lines.push(`- **${t.pagesScanned}:** ${result.summary.pagesScanned}`);
  lines.push("");

  const groups = groupIssuesByRule(result.issues);
  if (groups.length === 0) {
    lines.push(t.noIssues, "");
  } else {
    lines.push(`## ${t.toFix}`, "");
    groups.forEach((group, index) => {
      lines.push(`### ${index + 1}. ${mdText(group.title)} (${severityLabel(t, group.severity)})`, "");
      lines.push(`RGAA **${mdText(group.rgaa)}**${group.rgaaTitle ? ` — ${mdText(group.rgaaTitle)}` : ""}`, "");
      lines.push(`**${t.why}.** ${mdText(group.why)}`, "");
      if (group.learn?.who?.length) {
        lines.push(`**${t.whoIsAffected}.** ${group.learn.who.map(mdText).join(" ; ")}`, "");
      }
      if (group.learn?.tryIt) lines.push(`**${t.tryIt}.** ${mdText(group.learn.tryIt)}`, "");
      lines.push(`**${t.fix}.** ${mdText(group.howToFix)}`, "");
      if (group.before || group.after) {
        lines.push("```html");
        if (group.before) lines.push(`<!-- ${t.before} -->`, group.before);
        if (group.after) lines.push(`<!-- ${t.after} -->`, group.after);
        lines.push("```", "");
      }
      lines.push(`**${t.where}** (${t.occurrences(group.pages, group.elements)}) :`, "");
      for (const occurrence of group.occurrences) {
        const code = (value) => `\`${String(value).replace(/`/g, "")}\``;
        const targets = occurrence.targets.length ? ` — ${occurrence.targets.map(code).join(", ")}` : "";
        lines.push(`- ${escapeMd(occurrence.page)}${targets}`);
      }
      lines.push("");
    });
  }

  const criteria = result.criteria ?? [];
  const passed = criteria.filter((line) => line.outcome === "passed");
  const review = criteria.filter((line) => line.outcome === "review");
  if (passed.length) {
    lines.push(`## ${t.goingWell}`, "");
    for (const line of passed) lines.push(`- **${escapeMd(line.criterion)}** ${escapeMd(line.title)}`);
    lines.push("");
  }
  if (review.length) {
    lines.push(`## ${t.toCheckByHand}`, "");
    for (const line of review) lines.push(`- **${escapeMd(line.criterion)}** ${escapeMd(line.title)}`);
    lines.push("");
  }
  lines.push(`_${escapeMd(t.criteriaNote(result.rgaaVersion ?? "4.1.2"))}_`);

  if (result.pageErrors?.length) {
    lines.push("", `## ${t.pagesNotScanned}`, "");
    for (const error of result.pageErrors) lines.push(`- ${escapeMd(error.page)}: ${escapeMd(error.message)}`);
  }
  return lines.join("\n");
}

export function renderMarkdown(result) {
  const t = labels(result.lang);
  if (result.mode === "learning") return renderLearningMarkdown(result, t);
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
    lines.push(`## ${mdText(issue.title)}`);
    lines.push("");
    lines.push(`- ${t.severity}: **${severityLabel(t, issue.severity)}**`);
    lines.push(`- ${t.rule}: \`${issue.id}\``);
    lines.push(`- RGAA: **${mdText(issue.rgaa)}**${issue.rgaaTitle ? ` — ${mdText(issue.rgaaTitle)}` : ""}`);
    lines.push(`- ${t.page}: ${mdText(issue.page)}`);
    lines.push(`- ${t.why}: ${mdText(issue.why)}`);
    lines.push(`- ${t.fix}: ${mdText(issue.howToFix)}`);
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
