import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeIssues } from '../packages/core/src/scan.js';

test('pagesScanned counts every scanned page, not only pages with issues', () => {
  const issues = [
    { severity: 'major', page: '/a' },
    { severity: 'critical', page: '/a' }
  ];
  const summary = summarizeIssues(issues, 3);
  assert.equal(summary.pagesScanned, 3);
  assert.deepEqual(summary.issuesBySeverity, { critical: 1, major: 1, minor: 0, info: 0 });
  assert.equal(summary.failed, true);
});

test('a clean site still reports the pages it scanned', () => {
  const summary = summarizeIssues([], 5);
  assert.equal(summary.pagesScanned, 5);
  assert.equal(summary.failed, false);
});

test('requires the number of scanned pages', () => {
  assert.throws(() => summarizeIssues([]), TypeError);
  assert.throws(() => summarizeIssues([], -1), TypeError);
});
