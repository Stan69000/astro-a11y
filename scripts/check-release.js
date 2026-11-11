// Verifies that the workspace is ready to publish version <tag> (e.g. v0.2.0).
// Usage: node scripts/check-release.js v0.2.0
import { readFile } from 'node:fs/promises';

const PACKAGES = ['core', 'reporters', 'astro-integration', 'cli'];
const REQUIRED_FIELDS = ['name', 'version', 'description', 'license', 'repository', 'files'];
const REPOSITORY_URL = 'git+https://github.com/Stan69000/astro-a11y.git';

const tag = process.argv[2];
if (!tag || !/^v\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(tag)) {
  console.error('Usage: node scripts/check-release.js v<major>.<minor>.<patch>');
  process.exit(1);
}
const version = tag.slice(1);
const errors = [];

for (const dir of PACKAGES) {
  const manifest = JSON.parse(await readFile(`packages/${dir}/package.json`, 'utf8'));
  for (const field of REQUIRED_FIELDS) {
    if (manifest[field] === undefined) errors.push(`${manifest.name ?? dir}: missing "${field}"`);
  }
  if (manifest.version !== version) {
    errors.push(`${manifest.name}: version ${manifest.version} does not match tag ${tag}`);
  }
  if (manifest.private) errors.push(`${manifest.name}: is private`);
  if (manifest.repository?.url !== REPOSITORY_URL) {
    errors.push(
      `${manifest.name}: repository.url must be ${REPOSITORY_URL} (required for provenance)`
    );
  }
}

const changelog = await readFile('CHANGELOG.md', 'utf8');
if (!changelog.includes(`## [${version}]`)) {
  errors.push(`CHANGELOG.md: no "## [${version}]" section`);
}

if (errors.length > 0) {
  console.error(`Release ${tag} is not ready:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Release ${tag} is ready: ${PACKAGES.length} packages at ${version}.`);
