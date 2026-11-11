/** Report labels. Issue texts themselves are translated by the core at scan time. */
const LABELS = {
  en: {
    reportTitle: 'astro-a11y report',
    target: 'Target',
    mode: 'Mode',
    generated: 'Generated',
    pagesScanned: 'Pages scanned',
    issues: 'Issues',
    summary: 'Summary',
    page: 'Page',
    rule: 'Rule',
    severity: 'Severity',
    title: 'Title',
    why: 'Why',
    fix: 'Fix',
    before: 'Before',
    after: 'After',
    element: 'Target',
    failure: 'Failure',
    nodeSummary: 'Summary',
    affectedNodes: 'Affected elements',
    ruleDoc: 'Rule documentation',
    opensInNewTab: 'opens in new tab',
    newIssue: 'new',
    newSinceBaseline: 'New since baseline',
    fixedSinceBaseline: 'Fixed since baseline',
    fixedElements: 'fixed elements',
    elementsCount: (n) => `${n} element(s)`,
    noIssues: 'No accessibility issues detected by the configured automated checks.',
    pagesNotScanned: 'Pages that could not be scanned',
    severities: { critical: 'critical', major: 'major', minor: 'minor', info: 'info' },
    criteriaHeading: 'RGAA criteria',
    criterion: 'Criterion',
    topic: 'Topic',
    outcome: 'Result',
    outcomes: {
      failed: 'Issues found',
      review: 'To check manually',
      passed: 'No issue detected',
      inapplicable: 'Not applicable'
    },
    criteriaNote: (version) =>
      `RGAA ${version}. Automated checks only: "No issue detected" does not mean compliant, most criteria also need a manual check.`,
    commentTitle: 'astro-a11y accessibility report',
    noNewIssue: '**No new issue** compared with the baseline.',
    newIssues: (total, c) =>
      `**${total} new issue(s)** compared with the baseline: critical ${c.critical}, major ${c.major}, minor ${c.minor}, info ${c.info}.`,
    knownFixed: (n) => `${n} known element(s) fixed since the baseline.`,
    pagesNotScannedCount: (n) => `**${n} page(s) could not be scanned:** see the full report.`,
    failedCriteria: (list) => `**RGAA criteria with issues:** ${list}.`,
    more: (n) => `…and ${n} more.`,
    fullReport: (url) => `Full HTML, JSON and Markdown reports: [workflow run](${url}).`,
    automatedOnly: 'Automated checks only: they do not replace a manual RGAA audit.',
    truncated: '…comment truncated, see the full report.'
  },
  fr: {
    reportTitle: 'Rapport astro-a11y',
    target: 'Cible',
    mode: 'Mode',
    generated: 'Généré le',
    pagesScanned: 'Pages analysées',
    issues: 'Problèmes',
    summary: 'Synthèse',
    page: 'Page',
    rule: 'Règle',
    severity: 'Sévérité',
    title: 'Problème',
    why: 'Pourquoi',
    fix: 'Correction',
    before: 'Avant',
    after: 'Après',
    element: 'Élément',
    failure: 'Constat',
    nodeSummary: 'Constat',
    affectedNodes: 'Éléments concernés',
    ruleDoc: 'Documentation de la règle',
    opensInNewTab: 'nouvel onglet',
    newIssue: 'nouveau',
    newSinceBaseline: 'Nouveaux depuis la baseline',
    fixedSinceBaseline: 'Corrigés depuis la baseline',
    fixedElements: 'éléments corrigés',
    elementsCount: (n) => `${n} élément(s)`,
    noIssues: 'Aucun problème d’accessibilité détecté par les tests automatiques configurés.',
    pagesNotScanned: 'Pages impossibles à analyser',
    severities: { critical: 'critique', major: 'majeur', minor: 'mineur', info: 'info' },
    criteriaHeading: 'Critères RGAA',
    criterion: 'Critère',
    topic: 'Thématique',
    outcome: 'Résultat',
    outcomes: {
      failed: 'Problèmes détectés',
      review: 'À vérifier à la main',
      passed: 'Aucun problème détecté',
      inapplicable: 'Non applicable'
    },
    criteriaNote: (version) =>
      `RGAA ${version}. Tests automatiques uniquement : « Aucun problème détecté » ne veut pas dire conforme, la plupart des critères demandent aussi une vérification humaine.`,
    commentTitle: 'Rapport d’accessibilité astro-a11y',
    noNewIssue: '**Aucun nouveau problème** par rapport à la baseline.',
    newIssues: (total, c) =>
      `**${total} nouveau(x) problème(s)** par rapport à la baseline : critique ${c.critical}, majeur ${c.major}, mineur ${c.minor}, info ${c.info}.`,
    knownFixed: (n) => `${n} élément(s) connu(s) corrigé(s) depuis la baseline.`,
    pagesNotScannedCount: (n) => `**${n} page(s) impossible(s) à analyser :** voir le rapport complet.`,
    failedCriteria: (list) => `**Critères RGAA en défaut :** ${list}.`,
    more: (n) => `…et ${n} de plus.`,
    fullReport: (url) => `Rapports HTML, JSON et Markdown complets : [exécution du workflow](${url}).`,
    automatedOnly: 'Tests automatiques uniquement : ils ne remplacent pas un audit RGAA humain.',
    truncated: '…commentaire tronqué, voir le rapport complet.'
  }
};

export function labels(lang) {
  return LABELS[lang] ?? LABELS.en;
}

export function severityLabel(t, severity) {
  return t.severities[severity] ?? severity;
}
