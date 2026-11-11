// Runs real key presses in Chromium. Needs the browser: `node packages/cli/dist/bin.js install-browser`.
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { runKeyboardChecks } from '../../packages/core/src/keyboard.js';
import { startStaticServer } from '../../packages/core/src/static-server.js';

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'keyboard');
let server;
let browser;

before(async () => {
  server = await startStaticServer(fixtures);
  browser = await chromium.launch({ headless: true });
});

after(async () => {
  await browser?.close();
  await server?.close();
});

async function check(fixture) {
  const page = await browser.newPage();
  try {
    const url = new URL(fixture, server.baseUrl).toString();
    await page.goto(url);
    const { issues } = await runKeyboardChecks(page, url, 'balanced');
    return issues;
  } finally {
    await page.close();
  }
}

const ids = (issues) => issues.map((issue) => issue.id).sort();

test('a keyboard-friendly page has no keyboard issue', async () => {
  assert.deepEqual(ids(await check('good.html')), []);
});

test('detects a removed focus outline, but not a :focus-visible replacement', async () => {
  const issues = await check('no-outline.html');
  assert.deepEqual(ids(issues), ['keyboard-focus-visible']);
  assert.equal(issues[0].rgaa, '10.7');
  assert.deepEqual(
    issues[0].nodes.map((node) => node.target),
    ['main > a']
  );
});

test('detects a keyboard trap', async () => {
  const issues = await check('trap.html');
  assert.ok(ids(issues).includes('keyboard-trap'));
  const trap = issues.find((issue) => issue.id === 'keyboard-trap');
  assert.equal(trap.rgaa, '12.9');
  assert.deepEqual(trap.nodes.map((node) => node.target).sort(), ['#deux', '#un']);
});

test('detects a skip link without target', async () => {
  const issues = await check('broken-skip.html');
  assert.deepEqual(ids(issues), ['keyboard-skip-link']);
  assert.match(issues[0].nodes[0].failureSummary, /No element with id "contenu"/);
});

test('detects a skip link cancelled by JavaScript', async () => {
  const issues = await check('cancelled-skip.html');
  assert.deepEqual(ids(issues), ['keyboard-skip-link']);
  assert.match(issues[0].nodes[0].failureSummary, /Tab does not continue from its target/);
});

test('focus moving inside an iframe is not a trap', async () => {
  assert.deepEqual(ids(await check('iframe.html')), []);
});

test('reports outcomes per rule and French texts', async () => {
  const page = await browser.newPage();
  try {
    const url = new URL('broken-skip.html', server.baseUrl).toString();
    await page.goto(url);
    const { issues, outcomes } = await runKeyboardChecks(page, url, 'learning', { lang: 'fr' });
    assert.deepEqual(outcomes, {
      'keyboard-trap': 'passed',
      'keyboard-focus-visible': 'passed',
      'keyboard-skip-link': 'failed'
    });
    assert.equal(issues[0].title, 'Lien d’évitement inopérant');
    assert.match(issues[0].nodes[0].failureSummary, /Aucun élément avec l’id « contenu »/);
  } finally {
    await page.close();
  }
});
