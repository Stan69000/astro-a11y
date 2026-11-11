import { AXE_RULES, FALLBACK_TEXT, IMPACT_TO_SEVERITY } from './axe-rules.js';
import { criterionTitle, RGAA_VERSION } from './rgaa.js';

export { RGAA_VERSION };

/** Languages available for issue texts and reports. */
export const SUPPORTED_LANGS = Object.freeze(['en', 'fr']);

export function isSupportedLang(value) {
  return SUPPORTED_LANGS.includes(value);
}

/** axe rule IDs that have an RGAA mapping. */
export const MAPPED_AXE_RULES = Object.freeze(Object.keys(AXE_RULES));

/**
 * @param {string} ruleId axe rule ID.
 * @param {{ lang?: string, impact?: string }} [options] `impact` (axe's) sets the severity of unmapped rules.
 * @returns {{ rgaa: string, severity: string, title: string, why: string, howToFix: string, before?: string, after?: string }}
 */
export function mapAxeToRgaa(ruleId, { lang = 'en', impact } = {}) {
  const language = isSupportedLang(lang) ? lang : 'en';
  const rule = Object.hasOwn(AXE_RULES, ruleId) ? AXE_RULES[ruleId] : undefined;
  if (!rule) {
    return {
      rgaa: 'manual-check',
      severity: IMPACT_TO_SEVERITY[impact] ?? 'major',
      ...FALLBACK_TEXT[language]
    };
  }
  return {
    rgaa: rule.rgaa,
    severity: rule.severity,
    ...rule[language],
    before: rule.before,
    after: rule.after
  };
}

export function enrichViolation(violation, page, mode, { lang = 'en' } = {}) {
  const mapping = mapAxeToRgaa(violation.id, { lang, impact: violation.impact });
  return {
    id: violation.id,
    rgaa: mapping.rgaa,
    rgaaTitle: criterionTitle(mapping.rgaa),
    page,
    severity: mapping.severity,
    title: mapping.title,
    why: mapping.why,
    howToFix: mapping.howToFix,
    nodes: violation.nodes.map((node) => ({
      target: Array.isArray(node.target) ? node.target.join(' ') : String(node.target ?? ''),
      html: node.html ?? '',
      failureSummary: node.failureSummary ?? ''
    })),
    help: violation.help,
    helpUrl: violation.helpUrl,
    mode,
    before: mapping.before,
    after: mapping.after
  };
}
