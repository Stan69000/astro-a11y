import { labels, severityLabel } from "./i18n.js";

/**
 * Marks the HTML report so the scanner never audits its own reports when a
 * build directory is scanned again. Must match REPORT_GENERATOR in
 * packages/core/src/routes.js.
 */
export const REPORT_GENERATOR = "astro-a11y-report";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function badgeClass(severity) {
  switch (severity) {
    case "critical": return "badge badge-critical";
    case "major": return "badge badge-major";
    case "minor": return "badge badge-minor";
    default: return "badge badge-info";
  }
}

/** Only http(s) links are rendered, so a crafted report cannot inject javascript: URLs. */
function safeHref(url) {
  return /^https?:\/\//i.test(String(url ?? "")) ? escapeHtml(url) : "";
}

function renderCriteria(result, t) {
  const criteria = result.criteria ?? [];
  if (criteria.length === 0) return "";
  const rows = criteria.map((line) => `
      <tr class="outcome-${escapeHtml(line.outcome)}">
        <th scope="row"><span class="criterion">${escapeHtml(line.criterion)}</span> ${escapeHtml(line.title)}</th>
        <td>${escapeHtml(line.topic)}</td>
        <td>${escapeHtml(t.outcomes[line.outcome] ?? line.outcome)}</td>
        <td>${line.issues > 0 ? `${line.issues} (${escapeHtml(t.elementsCount(line.elements))})` : ""}</td>
      </tr>`).join("");
  return `
  <section class="card criteria" aria-labelledby="criteria-heading">
    <h2 id="criteria-heading">${escapeHtml(t.criteriaHeading)}</h2>
    <div class="table-wrap">
    <table>
      <thead><tr><th scope="col">${escapeHtml(t.criterion)}</th><th scope="col">${escapeHtml(t.topic)}</th><th scope="col">${escapeHtml(t.outcome)}</th><th scope="col">${escapeHtml(t.issues)}</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    </div>
    <p class="note">${escapeHtml(t.criteriaNote(result.rgaaVersion ?? "4.1.2"))}</p>
  </section>`;
}

export function renderHtml(result) {
  const t = labels(result.lang);
  const lang = result.lang === "fr" ? "fr" : "en";
  const counts = result.summary.issuesBySeverity;
  const fresh = result.summary.newIssuesBySeverity;
  const issueCards = result.issues.map((issue) => `
    <article class="card">
      <div class="${badgeClass(issue.severity)}">${escapeHtml(severityLabel(t, issue.severity).toUpperCase())}</div>${issue.isNew ? ` <div class="badge badge-new">${escapeHtml(t.newIssue.toUpperCase())}</div>` : ""}
      <h2>${escapeHtml(issue.title)}</h2>
      <p><strong>${escapeHtml(t.page)}:</strong> ${escapeHtml(issue.page)}</p>
      <p><strong>${escapeHtml(t.rule)}:</strong> ${escapeHtml(issue.id)} · <strong>RGAA:</strong> ${escapeHtml(issue.rgaa)}${issue.rgaaTitle ? ` — ${escapeHtml(issue.rgaaTitle)}` : ""}</p>
      <p><strong>${escapeHtml(t.why)}:</strong> ${escapeHtml(issue.why)}</p>
      <p><strong>${escapeHtml(t.fix)}:</strong> ${escapeHtml(issue.howToFix)}</p>
      ${issue.before || issue.after ? `
      <div class="example">
        ${issue.before ? `<div><strong>${escapeHtml(t.before)}</strong><pre>${escapeHtml(issue.before)}</pre></div>` : ""}
        ${issue.after ? `<div><strong>${escapeHtml(t.after)}</strong><pre>${escapeHtml(issue.after)}</pre></div>` : ""}
      </div>` : ""}
      ${issue.nodes?.length ? `<details><summary>${escapeHtml(t.affectedNodes)}</summary>${issue.nodes.map((node) => `
        <div class="node">
          <p><strong>${escapeHtml(t.element)}:</strong> ${escapeHtml(node.target)}</p>
          ${node.failureSummary ? `<p><strong>${escapeHtml(t.failure)}:</strong> ${escapeHtml(node.failureSummary)}</p>` : ""}
          ${node.html ? `<pre>${escapeHtml(node.html)}</pre>` : ""}
        </div>`).join("")}</details>` : ""}
      ${safeHref(issue.helpUrl) ? `<p><a href="${safeHref(issue.helpUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t.ruleDoc)}<span class="sr-only"> (${escapeHtml(t.opensInNewTab)})</span></a></p>` : ""}
    </article>
  `).join("");

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="${REPORT_GENERATOR}">
<title>${escapeHtml(t.reportTitle)}</title>
<style>
body { font-family: Inter, system-ui, sans-serif; margin: 0; background: #f5f7fb; color: #172033; }
.wrap { max-width: 1120px; margin: 0 auto; padding: 32px 20px 60px; }
header, .kpis, .card { background: #fff; border: 1px solid #dde5f0; border-radius: 16px; }
header { padding: 20px; margin-bottom: 18px; }
.kpis { display: grid; grid-template-columns: repeat(5, minmax(120px, 1fr)); gap: 12px; padding: 16px; margin-bottom: 18px; }
.kpi { background: #f8fafc; border-radius: 12px; padding: 12px; }
.kpi .value { font-size: 28px; font-weight: 700; }
.grid { display: grid; gap: 14px; }
.card { padding: 18px; }
.badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; margin-bottom: 10px; }
.badge-critical { background: #ffe4e6; color: #9f1239; }
.badge-major { background: #fff7ed; color: #9a3412; }
.badge-minor { background: #eff6ff; color: #1d4ed8; }
.badge-info { background: #ecfeff; color: #155e75; }
.badge-new { background: #172033; color: #ffffff; }
.example { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; margin-top: 12px; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; background: #0f172a; color: #e2e8f0; padding: 12px; border-radius: 12px; }
.node { border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 12px; }
details summary { cursor: pointer; font-weight: 600; }
a { color: #1d4ed8; }
.criteria { margin-bottom: 18px; }
.table-wrap { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; font-size: 14px; }
th, td { text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
tbody th { font-weight: 400; }
.criterion { font-weight: 700; }
.outcome-failed td:nth-child(3) { color: #9f1239; font-weight: 700; }
.outcome-review td:nth-child(3) { color: #9a3412; }
.note { color: #475569; font-size: 14px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@media (max-width: 860px) { .kpis { grid-template-columns: repeat(2, minmax(120px, 1fr)); } }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>${escapeHtml(t.reportTitle)}</h1>
    <p><strong>${escapeHtml(t.target)}:</strong> ${escapeHtml(result.target)}</p>
    <p><strong>${escapeHtml(t.mode)}:</strong> ${escapeHtml(result.mode)} · <strong>${escapeHtml(t.generated)}:</strong> ${escapeHtml(result.generatedAt)}</p>
    ${fresh ? `<p><strong>${escapeHtml(t.newSinceBaseline)}:</strong> ${escapeHtml(severityLabel(t, "critical"))} ${Number(fresh.critical)}, ${escapeHtml(severityLabel(t, "major"))} ${Number(fresh.major)}, ${escapeHtml(severityLabel(t, "minor"))} ${Number(fresh.minor)}, ${escapeHtml(severityLabel(t, "info"))} ${Number(fresh.info)} · <strong>${escapeHtml(t.fixedSinceBaseline)}:</strong> ${escapeHtml(t.elementsCount(Number(result.summary.baseline?.fixedElements ?? 0)))}</p>` : ""}
  </header>

  <section class="kpis" aria-labelledby="summary-heading">
    <h2 id="summary-heading" class="sr-only">${escapeHtml(t.summary)}</h2>
    <div class="kpi"><div class="value">${Number(result.summary.pagesScanned)}</div><div>${escapeHtml(t.pagesScanned)}</div></div>
    ${["critical", "major", "minor", "info"].map((severity) => `<div class="kpi"><div class="value">${Number(counts[severity])}</div><div>${escapeHtml(severityLabel(t, severity).replace(/^./, (c) => c.toUpperCase()))}</div></div>`).join("\n    ")}
  </section>
${renderCriteria(result, t)}
  <section class="grid" aria-labelledby="issues-heading">
    <h2 id="issues-heading" class="sr-only">${escapeHtml(t.issues)}</h2>
    ${issueCards || `<div class="card"><p>${escapeHtml(t.noIssues)}</p></div>`}
    ${result.pageErrors?.length ? `<article class="card"><h2>${escapeHtml(t.pagesNotScanned)}</h2><ul>${result.pageErrors.map((error) => `<li>${escapeHtml(error.page)}: ${escapeHtml(error.message)}</li>`).join("")}</ul></article>` : ""}
  </section>
</div>
</body>
</html>`;
}
