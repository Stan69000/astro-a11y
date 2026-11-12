// The browser must not reach private network addresses while scanning.
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { scanDirectory } from '../../packages/core/src/scan.js';
import { launchChromium } from '../../packages/core/src/browser.js';

let internal;
let hits = 0;
let site;

before(async () => {
  // Stands for an internal service on the scanner's network (admin panel, metadata API…).
  internal = http.createServer((req, res) => {
    hits += 1;
    res.setHeader('access-control-allow-origin', '*');
    res.end('internal secret');
  });
  await new Promise((resolve) => internal.listen(0, '127.0.0.1', resolve));
  const { port } = internal.address();

  site = await mkdtemp(path.join(os.tmpdir(), 'astro-a11y-guard-'));
  await writeFile(
    path.join(site, 'index.html'),
    `<!doctype html><html lang="fr"><head><title>Guard</title></head><body><main><h1>Guard</h1>
    <img src="http://127.0.0.1:${port}/pixel.png" alt="">
    <script>
      fetch('http://127.0.0.1:${port}/api').catch(() => {});
      try { new WebSocket('ws://127.0.0.1:${port}/ws'); } catch {}
    </script></main></body></html>`
  );
});

after(async () => {
  await new Promise((resolve) => internal.close(resolve));
  await rm(site, { recursive: true, force: true });
});

test('a scanned page cannot reach a private address', async () => {
  hits = 0;
  const result = await scanDirectory(site, { keyboard: false });
  assert.equal(hits, 0, 'the internal service was contacted');
  const { port } = internal.address();
  assert.ok(result.blockedRequests.some((url) => url.includes(`127.0.0.1:${port}`)));
});

test('--allow-unsafe-targets lets the page reach it (local testing)', async () => {
  hits = 0;
  const result = await scanDirectory(site, { keyboard: false, allowUnsafeTargets: true });
  assert.ok(hits > 0);
  assert.deepEqual(result.blockedRequests, []);
});

test(
  'paranoid mode really enables the Chromium sandbox',
  { skip: process.getuid?.() === 0 && 'Chromium cannot sandbox as root' },
  async () => {
    const browser = await launchChromium({ headless: true, chromiumSandbox: true });
    try {
      const page = await browser.newPage();
      await page.goto('about:blank');
    } finally {
      await browser.close();
    }
  }
);
