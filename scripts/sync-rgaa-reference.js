// Keeps packages/core/src/rgaa-criteria.cjs identical to rgaa-audit's shared RGAA reference.
//
//   node scripts/sync-rgaa-reference.js            # update the local copy
//   node scripts/sync-rgaa-reference.js --check    # exit 1 if it differs from upstream
//   node scripts/sync-rgaa-reference.js --source ../rgaa-audit/extension/shared/rgaa-criteria.js
import { readFile, writeFile } from 'node:fs/promises';

const DEFAULT_SOURCE =
  'https://raw.githubusercontent.com/Stan69000/rgaa-audit/main/extension/shared/rgaa-criteria.js';
const TARGET = 'packages/core/src/rgaa-criteria.cjs';

const args = process.argv.slice(2);
const check = args.includes('--check');
const sourceIndex = args.indexOf('--source');
const source = sourceIndex === -1 ? DEFAULT_SOURCE : args[sourceIndex + 1];
if (!source) {
  console.error(
    'Usage: node scripts/sync-rgaa-reference.js [--check] [--source <file or https URL>]'
  );
  process.exit(1);
}

async function load(location) {
  if (!/^https:\/\//.test(location)) return readFile(location, 'utf8');
  const response = await fetch(location, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${location}`);
  return response.text();
}

const upstream = await load(source);
if (!/const api = \{ RGAA_VERSION: '[\d.]+', RGAA_TOPICS, RGAA_CRITERIA \};/.test(upstream)) {
  console.error(`Unexpected content in ${source}: refusing to use it.`);
  process.exit(1);
}
const local = await readFile(TARGET, 'utf8');

if (local === upstream) {
  console.log(`${TARGET} matches ${source}.`);
} else if (check) {
  console.error(`${TARGET} differs from ${source}. Run: node scripts/sync-rgaa-reference.js`);
  process.exit(1);
} else {
  await writeFile(TARGET, upstream, 'utf8');
  console.log(`${TARGET} updated from ${source}. Review the diff and run the tests.`);
}
