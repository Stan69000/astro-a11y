const SEVERITY_RANK = { critical: 0, major: 1, minor: 2, info: 3 };

function pagePath(page) {
  try {
    const url = new URL(page);
    return `${url.pathname}${url.search}`;
  } catch {
    return String(page ?? "");
  }
}

/**
 * Groups issues by rule for the learning layout: one topic per rule, with every
 * page and element where it occurs. Most severe and most frequent topics first.
 */
export function groupIssuesByRule(issues) {
  const groups = new Map();
  for (const issue of issues) {
    if (!groups.has(issue.id)) {
      groups.set(issue.id, { ...issue, occurrences: new Map(), elements: 0 });
    }
    const group = groups.get(issue.id);
    if ((SEVERITY_RANK[issue.severity] ?? 9) < (SEVERITY_RANK[group.severity] ?? 9)) group.severity = issue.severity;
    const page = pagePath(issue.page);
    const targets = (issue.nodes ?? []).map((node) => node.target).filter(Boolean);
    group.occurrences.set(page, [...(group.occurrences.get(page) ?? []), ...targets]);
    group.elements += Math.max(1, issue.nodes?.length ?? 0);
  }
  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      pages: group.occurrences.size,
      occurrences: Array.from(group.occurrences, ([page, targets]) => ({ page, targets }))
    }))
    .sort(
      (a, b) =>
        (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9) || b.elements - a.elements
    );
}
