import { Buffer } from 'node:buffer';
import { open, readdir } from 'node:fs/promises';
import path from 'node:path';

/**
 * Value of `<meta name="generator">` in astro-a11y HTML reports.
 * Must match REPORT_GENERATOR in packages/reporters/src/html.js.
 */
export const REPORT_GENERATOR = 'astro-a11y-report';

const REPORT_MARKER = `<meta name="generator" content="${REPORT_GENERATOR}">`;
// The marker sits in the report <head>, well within the first bytes.
const REPORT_SNIFF_BYTES = 2048;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else {
      files.push(full);
    }
  }

  return files;
}

/**
 * Tells whether an HTML file is a report written by astro-a11y itself.
 *
 * @param {string} file Absolute path of an HTML file.
 * @returns {Promise<boolean>}
 */
export async function isGeneratedReport(file) {
  const handle = await open(file, 'r');
  try {
    const buffer = Buffer.alloc(REPORT_SNIFF_BYTES);
    const { bytesRead } = await handle.read(buffer, 0, REPORT_SNIFF_BYTES, 0);
    return buffer.subarray(0, bytesRead).toString('utf8').includes(REPORT_MARKER);
  } finally {
    await handle.close();
  }
}

/**
 * Converts a built HTML file path into the URL route that serves it.
 * Returns `null` for files outside `rootDir` or that are not HTML.
 *
 * @param {string} rootDir Absolute path of the build output directory.
 * @param {string} file Absolute path of a file inside `rootDir`.
 * @returns {string | null}
 */
export function htmlFileToRoute(rootDir, file) {
  if (!file.endsWith('.html')) return null;

  const rel = path.relative(rootDir, file).replace(/\\/g, '/');
  if (rel === '' || rel.startsWith('../') || path.isAbsolute(rel)) return null;

  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel}`;
}

/**
 * Lists the routes of every HTML page in a build directory, skipping the
 * reports previously written by astro-a11y.
 */
export async function collectHtmlRoutesFromDirectory(rootDir) {
  const routes = new Set();
  for (const file of await walk(rootDir)) {
    const route = htmlFileToRoute(rootDir, file);
    if (route && !(await isGeneratedReport(file))) routes.add(route);
  }
  return Array.from(routes);
}
