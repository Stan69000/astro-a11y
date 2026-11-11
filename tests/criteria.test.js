import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCriteriaView,
  recordAxeOutcomes,
  recordOutcome
} from '../packages/core/src/criteria.js';
import { KEYBOARD_RULES } from '../packages/core/src/keyboard.js';

test('keeps the strongest outcome of a rule across pages', () => {
  const outcomes = new Map();
  recordAxeOutcomes(outcomes, {
    violations: [],
    incomplete: [],
    passes: [{ id: 'image-alt' }],
    inapplicable: [{ id: 'label' }]
  });
  recordAxeOutcomes(outcomes, {
    violations: [],
    incomplete: [{ id: 'image-alt' }],
    passes: [{ id: 'label' }],
    inapplicable: []
  });
  recordOutcome(outcomes, 'label', 'inapplicable');
  assert.equal(outcomes.get('image-alt'), 'review');
  assert.equal(outcomes.get('label'), 'passed');
});

test('builds one line per criterion, sorted, with counts and worst severity', () => {
  const outcomes = new Map([
    ['image-alt', 'failed'],
    ['svg-img-alt', 'passed'],
    ['label', 'passed'],
    ['heading-order', 'review'],
    ['keyboard-trap', 'passed'],
    ['frame-title', 'inapplicable'],
    ['target-size', 'failed'] // no RGAA criterion: ignored
  ]);
  const issues = [
    { id: 'image-alt', rgaa: '1.1', severity: 'major', nodes: [{}, {}] },
    { id: 'area-alt', rgaa: '1.1', severity: 'critical', nodes: [{}] },
    { id: 'target-size', rgaa: 'manual-check', severity: 'minor', nodes: [{}] }
  ];
  const view = buildCriteriaView(outcomes, issues, KEYBOARD_RULES);

  assert.deepEqual(
    view.map((line) => `${line.criterion}:${line.outcome}`),
    ['1.1:failed', '2.1:inapplicable', '9.1:review', '11.1:passed', '12.9:passed']
  );
  const images = view[0];
  assert.equal(images.topic, 'Images');
  assert.match(images.title, /alternative textuelle/);
  assert.equal(images.issues, 2);
  assert.equal(images.elements, 3);
  assert.equal(images.maxSeverity, 'critical');
  assert.deepEqual(images.rules, ['area-alt', 'image-alt', 'svg-img-alt']);
});

test('criteria are ordered numerically (2.1 before 10.7 before 12.9)', () => {
  const view = buildCriteriaView(
    new Map([
      ['keyboard-trap', 'passed'],
      ['keyboard-focus-visible', 'passed'],
      ['frame-title', 'passed']
    ]),
    [],
    KEYBOARD_RULES
  );
  assert.deepEqual(
    view.map((line) => line.criterion),
    ['2.1', '10.7', '12.9']
  );
});
