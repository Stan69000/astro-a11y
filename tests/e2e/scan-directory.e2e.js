// Scans a real build directory in Chromium. Needs the browser: `node packages/cli/dist/bin.js install-browser`.
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { scanDirectory } from '../../packages/core/src/scan.js';

const page = (body, head = '') =>
  `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Page</title>${head}</head><body><main><h1>Titre</h1>${body}</main></body></html>`;

async function site(files) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'astro-a11y-scan-'));
  for (const [route, html] of Object.entries(files)) {
    await mkdir(path.join(root, route), { recursive: true });
    await writeFile(path.join(root, route, 'index.html'), html, 'utf8');
  }
  return root;
}

test('skips meta refresh redirects instead of crashing', async () => {
  const root = await site({
    '': page('<p>Accueil</p>'),
    asso: page('<p>Association</p>'),
    projets:
      '<!doctype html><title>Redirecting to: /asso/</title><meta http-equiv="refresh" content="0;url=/asso/"><body><a href="/asso/">Redirecting</a></body>',
    'lexique-seo': page('<p>x</p>', '<meta http-equiv="refresh" content="2;url=/asso/">')
  });
  try {
    const result = await scanDirectory(root, { keyboard: false });
    assert.deepEqual([...result.routes].sort(), ['/', '/asso/']);
    assert.equal(result.summary.pagesScanned, 2);
    assert.equal(result.pageErrors, undefined);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('records a page that cannot be scanned and scans the others', async () => {
  const root = await site({ '': page('<p>Accueil</p>'), autre: page('<p>Autre</p>') });
  try {
    const result = await scanDirectory(root, {
      routes: ['/', '/absente/', '/autre/'],
      keyboard: false
    });
    assert.equal(result.summary.pagesScanned, 2);
    assert.equal(result.pageErrors.length, 1);
    assert.equal(result.pageErrors[0].page, '/absente/');
    assert.match(result.pageErrors[0].message, /HTTP 404/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('a page that navigates away by script does not abort the scan', async () => {
  const root = await site({
    '': page('<p>Accueil</p>'),
    partie: page('<p>Partie</p><script>location.replace("/")</script>'),
    fin: page('<p>Fin</p>')
  });
  try {
    const result = await scanDirectory(root, { routes: ['/partie/', '/fin/'] });
    assert.equal(result.summary.pagesScanned + (result.pageErrors?.length ?? 0), 2);
    assert.ok(result.routes.includes('/fin/'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
