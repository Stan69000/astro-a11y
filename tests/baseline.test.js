import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyBaseline,
  createBaseline,
  pageKey,
  parseBaseline
} from '../packages/core/src/baseline.js';
import { hasIssuesAtOrAbove } from '../packages/core/src/thresholds.js';

const issue = (id, page, targets, severity = 'major') => ({
  id,
  page,
  severity,
  nodes: targets.map((target) => ({ target }))
});

const resultWith = (issues) => ({
  target: '/dist',
  issues,
  summary: {
    pagesScanned: 2,
    issuesBySeverity: { critical: 0, major: issues.length, minor: 0, info: 0 }
  }
});

test('page identity ignores host and port', () => {
  assert.equal(pageKey('http://127.0.0.1:51234/contact/'), '/contact/');
  assert.equal(pageKey('http://127.0.0.1:60000/contact/'), '/contact/');
  assert.equal(pageKey('https://example.com/a?x=1'), '/a?x=1');
});

test('a baseline taken on another port still recognises every issue', () => {
  const before = resultWith([issue('image-alt', 'http://127.0.0.1:5000/', ['img'])]);
  const after = resultWith([issue('image-alt', 'http://127.0.0.1:6000/', ['img'])]);
  const applied = applyBaseline(after, createBaseline(before));
  assert.equal(applied.issues[0].isNew, false);
  assert.equal(applied.summary.newIssuesBySeverity.major, 0);
});

test('flags new elements, counts fixed ones, and gates only on new issues', () => {
  const baseline = createBaseline(
    resultWith([
      issue('image-alt', 'http://x/', ['img.a']),
      issue('label', 'http://x/contact/', ['input'])
    ])
  );
  const current = resultWith([
    issue('image-alt', 'http://x/', ['img.a', 'img.b']), // img.b is new
    issue('frame-title', 'http://x/', ['iframe'], 'critical') // new rule
  ]);
  const applied = applyBaseline(current, baseline);

  assert.equal(applied.issues[0].isNew, true);
  assert.deepEqual(
    applied.issues[0].nodes.map((node) => node.isNew),
    [false, true]
  );
  assert.equal(applied.issues[1].isNew, true);
  assert.deepEqual(applied.summary.newIssuesBySeverity, {
    critical: 1,
    major: 1,
    minor: 0,
    info: 0
  });
  assert.deepEqual(applied.summary.baseline, { knownElements: 2, fixedElements: 1 });
  assert.equal(hasIssuesAtOrAbove(applied.summary, 'critical'), true);
});

test('known issues alone never fail the run', () => {
  const current = resultWith([issue('image-alt', 'http://x/', ['img'], 'critical')]);
  const applied = applyBaseline(current, createBaseline(current));
  assert.equal(hasIssuesAtOrAbove(applied.summary, 'info'), false);
  assert.equal(hasIssuesAtOrAbove(current.summary, 'info'), true);
});

test('baseline files are stable and validated', () => {
  const result = resultWith([issue('b', 'http://x/', ['t']), issue('a', 'http://x/', ['t'])]);
  const baseline = createBaseline(result);
  assert.deepEqual(baseline.fingerprints, [...baseline.fingerprints].sort());
  assert.deepEqual(parseBaseline(JSON.stringify(baseline)).fingerprints, baseline.fingerprints);
  assert.throws(() => parseBaseline('{'), /not valid JSON/);
  assert.throws(
    () => parseBaseline('{"version":2,"fingerprints":[]}'),
    /Unsupported baseline version/
  );
  assert.throws(() => parseBaseline('{"version":1,"fingerprints":[1]}'), /array of strings/);
});
