import { AXE_RULES } from './axe-rules.js';
import { criterionTitle, criterionTopic } from './rgaa.js';

/**
 * Per-criterion view of a scan: for every RGAA criterion touched by the rules
 * that actually ran, the strongest outcome over all scanned pages.
 *
 * Outcomes, strongest first:
 * - failed: at least one issue
 * - review: axe could not decide ("incomplete"): check by hand
 * - passed: rules ran on matching elements and found nothing
 * - inapplicable: no element concerned on the scanned pages
 *
 * "passed" only means the automated checks found nothing: most RGAA criteria
 * also need a human judgement, so it is never reported as "compliant".
 */

export const OUTCOME_ORDER = Object.freeze(['failed', 'review', 'passed', 'inapplicable']);
const SEVERITY_RANK = { critical: 0, major: 1, minor: 2, info: 3 };

/** Strongest outcome of two (lower index wins). */
function strongest(a, b) {
  if (!a) return b;
  return OUTCOME_ORDER.indexOf(a) <= OUTCOME_ORDER.indexOf(b) ? a : b;
}

/** Records one rule outcome, keeping the strongest seen so far. */
export function recordOutcome(outcomes, ruleId, outcome) {
  outcomes.set(ruleId, strongest(outcomes.get(ruleId), outcome));
}

/**
 * Records the outcome of each axe rule for one page into `outcomes`.
 *
 * @param {Map<string, string>} outcomes ruleId → outcome, accumulated over pages.
 * @param {{ violations: {id:string}[], incomplete: {id:string}[], passes: {id:string}[], inapplicable: {id:string}[] }} axeResults
 */
export function recordAxeOutcomes(outcomes, axeResults) {
  const groups = [
    ['failed', axeResults.violations],
    ['review', axeResults.incomplete],
    ['passed', axeResults.passes],
    ['inapplicable', axeResults.inapplicable]
  ];
  for (const [outcome, rules] of groups) {
    for (const rule of rules ?? []) recordOutcome(outcomes, rule.id, outcome);
  }
}

/**
 * @param {Map<string, string>} ruleOutcomes ruleId → outcome (axe and keyboard rules).
 * @param {{ rgaa: string, severity: string, nodes?: object[] }[]} issues
 * @param {Record<string, { rgaa: string }>} [extraRules] Non-axe rules (keyboard checks) by id.
 * @returns {{ criterion: string, title: string, topic: string, outcome: string,
 *   issues: number, elements: number, maxSeverity?: string, rules: string[] }[]}
 */
export function buildCriteriaView(ruleOutcomes, issues, extraRules = {}) {
  const byCriterion = new Map();
  const entry = (criterion) => {
    if (!byCriterion.has(criterion)) {
      byCriterion.set(criterion, {
        criterion,
        outcome: undefined,
        issues: 0,
        elements: 0,
        maxSeverity: undefined,
        rules: new Set()
      });
    }
    return byCriterion.get(criterion);
  };

  for (const [ruleId, outcome] of ruleOutcomes) {
    const criterion = (AXE_RULES[ruleId] ?? extraRules[ruleId])?.rgaa;
    if (!criterion || !criterionTitle(criterion)) continue;
    const item = entry(criterion);
    item.outcome = strongest(item.outcome, outcome);
    item.rules.add(ruleId);
  }

  for (const issue of issues) {
    if (!criterionTitle(issue.rgaa)) continue;
    const item = entry(issue.rgaa);
    item.outcome = 'failed';
    item.issues += 1;
    item.elements += Math.max(1, issue.nodes?.length ?? 0);
    item.rules.add(issue.id);
    if (!item.maxSeverity || SEVERITY_RANK[issue.severity] < SEVERITY_RANK[item.maxSeverity]) {
      item.maxSeverity = issue.severity;
    }
  }

  return Array.from(byCriterion.values())
    .map((item) => ({
      criterion: item.criterion,
      title: criterionTitle(item.criterion),
      topic: criterionTopic(item.criterion),
      outcome: item.outcome,
      issues: item.issues,
      elements: item.elements,
      ...(item.maxSeverity ? { maxSeverity: item.maxSeverity } : {}),
      rules: Array.from(item.rules).sort()
    }))
    .sort((a, b) => compareCriteria(a.criterion, b.criterion));
}

export function compareCriteria(a, b) {
  const [ta, ca] = a.split('.').map(Number);
  const [tb, cb] = b.split('.').map(Number);
  return ta - tb || ca - cb;
}
