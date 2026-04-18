const DEFAULT_MAX_FIELD_LENGTH = 5000;

function clip(value, maxFieldLength) {
  const normalized = String(value ?? "");
  if (normalized.length <= maxFieldLength) return normalized;
  return `${normalized.slice(0, maxFieldLength)}...[truncated]`;
}

function sanitizeNode(node, options) {
  return {
    ...node,
    target: Array.isArray(node.target)
      ? node.target.map((item) => clip(item, options.maxFieldLength))
      : clip(node.target, options.maxFieldLength),
    failureSummary: node.failureSummary ? clip(node.failureSummary, options.maxFieldLength) : undefined,
    html: options.safeReport ? undefined : node.html ? clip(node.html, options.maxFieldLength) : undefined
  };
}

function sanitizeIssue(issue, options) {
  return {
    ...issue,
    id: clip(issue.id, options.maxFieldLength),
    rgaa: clip(issue.rgaa, options.maxFieldLength),
    page: clip(issue.page, options.maxFieldLength),
    severity: clip(issue.severity, options.maxFieldLength),
    title: clip(issue.title, options.maxFieldLength),
    why: clip(issue.why, options.maxFieldLength),
    howToFix: clip(issue.howToFix, options.maxFieldLength),
    before: options.safeReport ? undefined : issue.before ? clip(issue.before, options.maxFieldLength) : undefined,
    after: options.safeReport ? undefined : issue.after ? clip(issue.after, options.maxFieldLength) : undefined,
    help: issue.help ? clip(issue.help, options.maxFieldLength) : undefined,
    helpUrl: issue.helpUrl ? clip(issue.helpUrl, options.maxFieldLength) : undefined,
    nodes: Array.isArray(issue.nodes) ? issue.nodes.map((node) => sanitizeNode(node, options)) : []
  };
}

export function sanitizeResult(result, options = {}) {
  const maxFieldLength = Math.max(64, Number(options.maxFieldLength ?? DEFAULT_MAX_FIELD_LENGTH) || DEFAULT_MAX_FIELD_LENGTH);
  const sanitizedOptions = {
    safeReport: options.safeReport === true,
    maxFieldLength
  };

  return {
    ...result,
    target: clip(result.target, maxFieldLength),
    mode: clip(result.mode, maxFieldLength),
    generatedAt: clip(result.generatedAt, maxFieldLength),
    issues: Array.isArray(result.issues) ? result.issues.map((issue) => sanitizeIssue(issue, sanitizedOptions)) : [],
    routes: Array.isArray(result.routes) ? result.routes.map((route) => clip(route, maxFieldLength)) : result.routes
  };
}
