import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RGAA_CRITERIA,
  RGAA_TOPICS,
  RGAA_VERSION,
  criterionTitle,
  criterionTopic
} from '../packages/core/src/rgaa.js';
import { MAPPED_AXE_RULES, mapAxeToRgaa, enrichViolation } from '../packages/core/src/mappings.js';
import { KEYBOARD_RULES } from '../packages/core/src/keyboard.js';

test('shared reference: RGAA 4.1.2, 13 topics, 106 criteria', () => {
  assert.equal(RGAA_VERSION, '4.1.2');
  assert.equal(Object.keys(RGAA_TOPICS).length, 13);
  assert.equal(Object.keys(RGAA_CRITERIA).length, 106);
  assert.equal(criterionTopic('12.9'), 'Navigation');
  assert.match(criterionTitle('12.9'), /piège au clavier/);
  assert.equal(criterionTitle('99.9'), undefined);
});

test('every axe and keyboard rule points to an existing criterion', () => {
  assert.ok(MAPPED_AXE_RULES.length >= 80);
  for (const ruleId of MAPPED_AXE_RULES) {
    const { rgaa } = mapAxeToRgaa(ruleId);
    assert.ok(criterionTitle(rgaa), `${ruleId} → ${rgaa} is not an RGAA criterion`);
  }
  for (const [ruleId, rule] of Object.entries(KEYBOARD_RULES)) {
    assert.ok(criterionTitle(rule.rgaa), `${ruleId} → ${rule.rgaa} is not an RGAA criterion`);
  }
});

test('issues carry the official criterion title', () => {
  const issue = enrichViolation(
    { id: 'image-alt', nodes: [], help: '', helpUrl: '' },
    '/',
    'balanced'
  );
  assert.equal(issue.rgaaTitle, criterionTitle('1.1'));
  const unknown = enrichViolation(
    { id: 'unknown-rule', nodes: [], help: '', helpUrl: '' },
    '/',
    'balanced'
  );
  assert.equal(unknown.rgaaTitle, undefined);
});
