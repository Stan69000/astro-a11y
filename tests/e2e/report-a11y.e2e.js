// The HTML report of an accessibility tool must itself be accessible.
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { renderHtml } from '../../packages/reporters/src/html.js';
import { lessonFor } from '../../packages/core/src/pedagogy.js';
import { criterionTitle } from '../../packages/core/src/rgaa.js';

// @axe-core/playwright is a dependency of the core package, not of the workspace root.
const requireFromCore = createRequire(new URL('../../packages/core/package.json', import.meta.url));
const { default: AxeBuilder } = await import(
  pathToFileURL(requireFromCore.resolve('@axe-core/playwright')).href
);

let browser;
before(async () => {
  browser = await chromium.launch({ headless: true });
});
after(async () => {
  await browser?.close();
});

const result = (mode, lang) => ({
  target: '/dist',
  mode,
  lang,
  rgaaVersion: '4.1.2',
  generatedAt: '2026-01-01T00:00:00.000Z',
  summary: {
    pagesScanned: 2,
    issuesBySeverity: { critical: 1, major: 0, minor: 0, info: 0 },
    newIssuesBySeverity: { critical: 1, major: 0, minor: 0, info: 0 },
    baseline: { knownElements: 2, fixedElements: 1 }
  },
  issues: [
    {
      id: 'label',
      rgaa: '11.1',
      rgaaTitle: criterionTitle('11.1'),
      page: 'http://127.0.0.1:4321/contact/',
      severity: 'critical',
      title: 'Form control is missing a label',
      why: 'why',
      howToFix: 'Use <label for>.',
      before: '<input id="email">',
      after: '<label for="email">Email</label><input id="email">',
      nodes: [
        { target: 'input', html: '<input id="email">', failureSummary: 'Fix any of the following' }
      ],
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.14/label',
      isNew: true,
      ...(mode === 'learning' ? { learn: lessonFor('11.1', lang) } : {})
    }
  ],
  criteria: [
    {
      criterion: '11.1',
      title: criterionTitle('11.1'),
      topic: 'Formulaires',
      outcome: 'failed',
      issues: 1,
      elements: 1
    },
    {
      criterion: '8.5',
      title: criterionTitle('8.5'),
      topic: 'Éléments obligatoires',
      outcome: 'passed',
      issues: 0,
      elements: 0
    },
    {
      criterion: '12.7',
      title: criterionTitle('12.7'),
      topic: 'Navigation',
      outcome: 'review',
      issues: 0,
      elements: 0
    }
  ],
  pageErrors: [{ page: 'http://127.0.0.1:4321/missing/', message: 'HTTP 404' }]
});

for (const [mode, lang] of [
  ['balanced', 'en'],
  ['balanced', 'fr'],
  ['learning', 'fr']
]) {
  test(`the ${mode} report in ${lang} has no axe violation`, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.setContent(renderHtml(result(mode, lang)));
      const { violations } = await new AxeBuilder({ page }).analyze();
      assert.deepEqual(
        violations.map((violation) => violation.id),
        []
      );
    } finally {
      await context.close();
    }
  });
}
