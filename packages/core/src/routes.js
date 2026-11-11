import { readdir } from 'node:fs/promises';
import path from 'node:path';

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

export async function collectHtmlRoutesFromDirectory(rootDir) {
  const files = await walk(rootDir);
  const routes = files.map((file) => htmlFileToRoute(rootDir, file)).filter(Boolean);
  return Array.from(new Set(routes));
}
