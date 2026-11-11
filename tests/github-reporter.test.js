import test from 'node:test';
import assert from 'node:assert/strict';
import { renderGithubComment, GITHUB_COMMENT_MARKER } from '../packages/reporters/src/github.js';
import { renderByFormat } from '../packages/reporters/src/render-utils.js';

const baseResult = {
  target: '/dist',
  mode: 'balanced',
  generatedAt: '2026-01-01T00:00:00.000Z',
  summary: { pagesScanned: 2, issuesBySeverity: { critical: 1, major: 1, minor: 0, info: 0 } },
  issues: [
    {
      id: 'image-alt',
      rgaa: '1.1',
      severity: 'major',
      page: 'http://127.0.0.1:5000/',
      title: 'Image | alt',
      nodes: []
    },
    {
      id: 'label',
      rgaa: '11.1',
      severity: 'critical',
      page: 'http://127.0.0.1:5000/contact/',
      title: 'Label',
      nodes: []
    }
  ]
};

test('starts with the marker used to update the previous comment', () => {
  assert.ok(renderGithubComment(baseResult).startsWith(GITHUB_COMMENT_MARKER));
});

test('shows page paths without the local server port and escapes table cells', () => {
  const body = renderGithubComment(baseResult);
  assert.match(body, /\| \/contact\/ \|/);
  assert.doesNotMatch(body, /127\.0\.0\.1/);
  assert.match(body, /Image \\\| alt/);
});

test('lists new issues first and summarises the baseline', () => {
  const result = {
    ...baseResult,
    summary: {
      ...baseResult.summary,
      newIssuesBySeverity: { critical: 0, major: 1, minor: 0, info: 0 },
      baseline: { knownElements: 3, fixedElements: 2 }
    },
    issues: [
      { ...baseResult.issues[1], isNew: false },
      { ...baseResult.issues[0], isNew: true }
    ]
  };
  const body = renderGithubComment(result);
  assert.match(body, /\*\*1 new issue\(s\)\*\*/);
  assert.match(body, /2 known element\(s\) fixed/);
  const rows = body.split('\n').filter((line) => line.startsWith('|') && line.includes('`'));
  assert.ok(rows[0].includes('image-alt'), 'new issue comes first');
});

test('links to the full report when a URL is given', () => {
  const body = renderByFormat(baseResult, 'github', {
    reportUrl: 'https://github.com/o/r/actions/runs/1'
  });
  assert.match(body, /\[workflow run\]\(https:\/\/github\.com\/o\/r\/actions\/runs\/1\)/);
});

test('caps the number of rows', () => {
  const issues = Array.from({ length: 60 }, (_, i) => ({
    ...baseResult.issues[0],
    id: `rule-${i}`
  }));
  const body = renderGithubComment({ ...baseResult, issues });
  assert.match(body, /…and 10 more\./);
});

test('renders in French with the failed criteria', () => {
  const body = renderGithubComment({
    ...baseResult,
    lang: 'fr',
    criteria: [
      { criterion: '1.1', outcome: 'failed' },
      { criterion: '3.2', outcome: 'passed' },
      { criterion: '11.1', outcome: 'failed' }
    ]
  });
  assert.match(body, /## Rapport d’accessibilité astro-a11y/);
  assert.match(body, /\| Pages analysées \| Critique \| Majeur \| Mineur \| Info \|/);
  assert.match(body, /\*\*Critères RGAA en défaut :\*\* 1\.1, 11\.1\./);
  assert.match(body, /\| majeur \| 1\.1 \|/);
});

test('never links to a non-http report URL', () => {
  const body = renderGithubComment(baseResult, { reportUrl: 'javascript:alert(1)' });
  assert.doesNotMatch(body, /javascript:/);
});
