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

export function renderHtml(result) {
  const issueCards = result.issues.map((issue) => `
    <article class="card">
      <div class="${badgeClass(issue.severity)}">${escapeHtml(issue.severity.toUpperCase())}</div>
      <h2>${escapeHtml(issue.title)}</h2>
      <p><strong>Page:</strong> ${escapeHtml(issue.page)}</p>
      <p><strong>Rule:</strong> ${escapeHtml(issue.id)} · <strong>RGAA:</strong> ${escapeHtml(issue.rgaa)}</p>
      <p><strong>Why:</strong> ${escapeHtml(issue.why)}</p>
      <p><strong>Fix:</strong> ${escapeHtml(issue.howToFix)}</p>
      ${issue.before || issue.after ? `
      <div class="example">
        ${issue.before ? `<div><strong>Before</strong><pre>${escapeHtml(issue.before)}</pre></div>` : ""}
        ${issue.after ? `<div><strong>After</strong><pre>${escapeHtml(issue.after)}</pre></div>` : ""}
      </div>` : ""}
      ${issue.nodes?.length ? `<details><summary>Affected nodes</summary>${issue.nodes.map((node) => `
        <div class="node">
          <p><strong>Target:</strong> ${escapeHtml(node.target)}</p>
          ${node.failureSummary ? `<p><strong>Failure:</strong> ${escapeHtml(node.failureSummary)}</p>` : ""}
          ${node.html ? `<pre>${escapeHtml(node.html)}</pre>` : ""}
        </div>`).join("")}</details>` : ""}
      ${issue.helpUrl ? `<p><a href="${escapeHtml(issue.helpUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Rule documentation (opens in new tab)">Rule documentation</a></p>` : ""}
    </article>
  `).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>astro-a11y report</title>
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
.example { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; margin-top: 12px; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; background: #0f172a; color: #e2e8f0; padding: 12px; border-radius: 12px; }
.node { border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 12px; }
details summary { cursor: pointer; font-weight: 600; }
a { color: #1d4ed8; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@media (max-width: 860px) { .kpis { grid-template-columns: repeat(2, minmax(120px, 1fr)); } }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>astro-a11y report</h1>
    <p><strong>Target:</strong> ${escapeHtml(result.target)}</p>
    <p><strong>Mode:</strong> ${escapeHtml(result.mode)} · <strong>Generated:</strong> ${escapeHtml(result.generatedAt)}</p>
  </header>

  <section class="kpis" aria-labelledby="summary-heading">
    <h2 id="summary-heading" class="sr-only">Summary</h2>
    <div class="kpi"><div class="value">${result.summary.pagesScanned}</div><div>Pages scanned</div></div>
    <div class="kpi"><div class="value">${result.summary.issuesBySeverity.critical}</div><div>Critical</div></div>
    <div class="kpi"><div class="value">${result.summary.issuesBySeverity.major}</div><div>Major</div></div>
    <div class="kpi"><div class="value">${result.summary.issuesBySeverity.minor}</div><div>Minor</div></div>
    <div class="kpi"><div class="value">${result.summary.issuesBySeverity.info}</div><div>Info</div></div>
  </section>

  <section class="grid" aria-labelledby="issues-heading">
    <h2 id="issues-heading" class="sr-only">Issues</h2>
    ${issueCards || '<div class="card"><p>No accessibility issues detected. The configured automated checks did not report any issue.</p></div>'}
  </section>
</div>
</body>
</html>`;
}
