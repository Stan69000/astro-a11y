import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveFailThreshold, hasIssuesAtOrAbove } from '../packages/core/src/thresholds.js';

const summaryWith = (issuesBySeverity) => ({
  issuesBySeverity: { critical: 0, major: 0, minor: 0, info: 0, ...issuesBySeverity }
});

test('explicit failOn always wins, including in strict and learning modes', () => {
  assert.equal(resolveFailThreshold({ mode: 'strict', failOn: 'critical' }), 'critical');
  assert.equal(resolveFailThreshold({ mode: 'learning', failOn: 'minor' }), 'minor');
});

test('strict mode fails on major by default', () => {
  assert.equal(resolveFailThreshold({ mode: 'strict' }), 'major');
});

test('learning mode never fails, even when the build asks to fail', () => {
  assert.equal(resolveFailThreshold({ mode: 'learning', failByDefault: true }), null);
});

test('balanced mode fails only when requested', () => {
  assert.equal(resolveFailThreshold({ mode: 'balanced' }), null);
  assert.equal(resolveFailThreshold({ mode: 'balanced', failByDefault: true }), 'major');
});

test('rejects an invalid failOn value instead of silently ignoring it', () => {
  assert.throws(() => resolveFailThreshold({ failOn: 'blocker' }), /Invalid fail threshold/);
});

test('hasIssuesAtOrAbove compares severities by rank', () => {
  assert.equal(hasIssuesAtOrAbove(summaryWith({ minor: 3 }), 'major'), false);
  assert.equal(hasIssuesAtOrAbove(summaryWith({ critical: 1 }), 'major'), true);
  assert.equal(hasIssuesAtOrAbove(summaryWith({ major: 1 }), 'major'), true);
  assert.equal(hasIssuesAtOrAbove(summaryWith({ info: 1 }), 'info'), true);
  assert.equal(hasIssuesAtOrAbove(summaryWith({ critical: 5 }), null), false);
});
