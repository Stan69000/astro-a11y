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

test('ignores the scoping hashes Astro adds to selectors', () => {
  const before = resultWith([
    issue('color-contrast', 'http://x/', [
      '.nav > li[data-astro-cid-fzpbxy5g=""]:nth-child(1) > a[href$="blog/"][data-astro-cid-fzpbxy5g=""]',
      'p.astro-j7pv25f6'
    ])
  ]);
  // Same elements after a change in the component: Astro generated new hashes.
  const after = resultWith([
    issue('color-contrast', 'http://x/', [
      '.nav > li[data-astro-cid-0a1b2c3d=""]:nth-child(1) > a[href$="blog/"][data-astro-cid-0a1b2c3d=""]',
      'p.astro-k8qw36g7'
    ])
  ]);
  const applied = applyBaseline(after, createBaseline(before));
  assert.equal(applied.issues[0].isNew, false);
  assert.equal(applied.summary.baseline.fixedElements, 0);
});

test('still recognises the issues of a baseline written by 0.2.2', async () => {
  const { createHash } = await import('node:crypto');
  const target = 'li[data-astro-cid-fzpbxy5g=""] > a';
  const legacy = createHash('sha256')
    .update(['color-contrast', '/', target].join('\u0000'))
    .digest('hex')
    .slice(0, 20);
  const baseline = { version: 1, fingerprints: [legacy] };
  const applied = applyBaseline(
    resultWith([issue('color-contrast', 'http://127.0.0.1:4000/', [target])]),
    baseline
  );
  assert.equal(applied.issues[0].isNew, false);
  assert.equal(applied.summary.baseline.fixedElements, 0);
});
