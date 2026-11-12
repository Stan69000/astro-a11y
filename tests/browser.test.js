import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import {
  browserInstallCommand,
  explainLaunchError,
  playwrightCliPath
} from '../packages/core/src/browser.js';

test('resolves the Playwright CLI bundled with the core package', () => {
  assert.ok(existsSync(playwrightCliPath()));
  assert.match(browserInstallCommand(), /cli\.js" install chromium$/);
});

test('explains a missing browser with an actionable command', () => {
  const original = new Error("browserType.launch: Executable doesn't exist at /x/chrome");
  const explained = explainLaunchError(original);
  assert.match(explained.message, /npx astro-a11y install-browser/);
  assert.equal(explained.cause, original);
});

test('explains a sandbox failure, including the Ubuntu AppArmor restriction', () => {
  const original = new Error('browserType.launch: Chromium sandboxing failed!');
  const explained = explainLaunchError(original);
  assert.match(explained.message, /paranoid mode requires the Chromium sandbox/);
  assert.match(explained.message, /apparmor_restrict_unprivileged_userns/);
  assert.equal(explained.cause, original);
});

test('leaves unrelated launch errors untouched', () => {
  const original = new Error('Target page, context or browser has been closed');
  assert.equal(explainLaunchError(original), original);
});
