import { fileURLToPath } from 'node:url';
import { htmlFileToRoute } from '@astro-a11y/core';

/**
 * Keeps only the routes that produce an HTML page on disk at build time:
 * prerendered pages. Endpoints (RSS, sitemap, robots.txt…), redirects and
 * on-demand (SSR) pages have no static HTML file to scan.
 *
 * @param {Array<{ type: string, isPrerendered: boolean }>} routes Routes from `astro:routes:resolved`.
 */
export function selectPrerenderedPages(routes) {
  return routes.filter((route) => route.type === 'page' && route.isPrerendered);
}

/**
 * Resolves the URL routes to scan from the files Astro actually generated.
 *
 * Dynamic routes (`[slug].astro`, `[...path].astro`) have no `pathname`, but
 * Astro lists every HTML file they produced in the `assets` map of
 * `astro:build:done`, keyed by route pattern.
 *
 * @param {Array<{ pattern: string }>} pages Prerendered page routes.
 * @param {Map<string, URL[]> | undefined} assets The `assets` map from `astro:build:done`.
 * @param {string} rootDir Absolute path of the build output directory.
 * @returns {string[]} Unique routes, or an empty array when nothing can be resolved.
 */
export function resolveRoutesFromAssets(pages, assets, rootDir) {
  if (!(assets instanceof Map)) return [];

  const routes = new Set();
  for (const page of pages) {
    for (const fileUrl of assets.get(page.pattern) ?? []) {
      const route = htmlFileToRoute(rootDir, fileURLToPath(fileUrl));
      if (route) routes.add(route);
    }
  }
  return Array.from(routes);
}
