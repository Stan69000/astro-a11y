import fs from 'node:fs/promises';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { assertAllowedRemoteTarget, resolveSafeRemoteUrl } from './security.js';
import { collectHtmlRoutesFromDirectory } from './routes.js';
import { startStaticServer } from './static-server.js';
import { enrichViolation } from './mappings.js';
import { launchChromium } from './browser.js';
import { discoverSitemapUrls } from './sitemap.js';

const DEFAULT_TIMEOUT_MS = 15000;
const isCI = process.env.CI === 'true';

function isUrl(target) {
  return /^https?:\/\//i.test(target);
}

function withLeadingSlash(route) {
  if (!route.startsWith('/')) return `/${route}`;
  return route;
}

function normalizeRoutes(routes) {
  return Array.from(new Set(routes.map(withLeadingSlash)));
}

function resolveLaunchArgs(options = {}) {
  if (options.enforceSandbox === true) return [];
  return isCI ? ['--no-sandbox', '--disable-setuid-sandbox'] : [];
}

function getSecurityOptions(options = {}) {
  return {
    allowUnsafeTargets: options.allowUnsafeTargets === true,
    allowedDomains: options.allowedDomains,
    maxRedirects: options.maxRedirects,
    blockSensitivePorts: options.blockSensitivePorts === true
  };
}

/**
 * @param {Array<{ severity: string }>} issues
 * @param {number} pagesScanned Number of pages actually analysed, including pages without issues.
 */
export function summarizeIssues(issues, pagesScanned) {
  if (!Number.isInteger(pagesScanned) || pagesScanned < 0) {
    throw new TypeError(`pagesScanned must be a non-negative integer, got: ${pagesScanned}`);
  }
  const issuesBySeverity = { critical: 0, major: 0, minor: 0, info: 0 };
  for (const issue of issues) {
    issuesBySeverity[issue.severity] += 1;
  }
  return {
    pagesScanned,
    issuesBySeverity,
    failed: issuesBySeverity.critical > 0 || issuesBySeverity.major > 0
  };
}

async function resolveDirectoryRoutes(rootDir, providedRoutes) {
  if (providedRoutes?.length) return normalizeRoutes(providedRoutes);
  return collectHtmlRoutesFromDirectory(rootDir);
}

async function scanPage(page, url, mode, includeTags, excludeRules, timeout, securityOptions) {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
  if (response && response.status() >= 400) {
    throw new Error(`HTTP ${response.status()} for ${url}`);
  }

  const finalUrl = page.url();
  if (finalUrl !== url && isUrl(finalUrl)) {
    if ((securityOptions?.maxRedirects ?? 3) === 0) {
      throw new Error('Redirects are disabled in the current security mode.');
    }
    await assertAllowedRemoteTarget(finalUrl, securityOptions);
  }

  let builder = new AxeBuilder({ page });

  if (includeTags?.length) builder = builder.withTags(includeTags);
  if (excludeRules?.length) builder = builder.disableRules(excludeRules);

  const results = await builder.analyze();
  return results.violations.map((violation) => enrichViolation(violation, url, mode));
}

export async function scanRemoteUrl(url, options = {}) {
  const securityOptions = getSecurityOptions(options);
  const resolvedUrl = await resolveSafeRemoteUrl(url, securityOptions);
  const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;

  const browser = await launchChromium({
    headless: true,
    args: resolveLaunchArgs(options)
  });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const issues = await scanPage(
      page,
      resolvedUrl,
      options.mode ?? 'balanced',
      options.includeTags,
      options.excludeRules,
      timeout,
      securityOptions
    );

    return {
      target: resolvedUrl,
      mode: options.mode ?? 'balanced',
      generatedAt: new Date().toISOString(),
      issues,
      summary: summarizeIssues(issues, 1)
    };
  } finally {
    await browser.close();
  }
}

/**
 * Scans every page listed in a remote site's sitemaps (up to `maxPages`).
 * A page that fails to load is recorded in `pageErrors` instead of aborting the scan.
 *
 * @param {string} siteUrl
 * @param {object} options Scan options, plus `maxPages` and `sitemapUrl`.
 */
export async function scanSitemap(siteUrl, options = {}) {
  const securityOptions = getSecurityOptions(options);
  const mode = options.mode ?? 'balanced';
  const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
  const { sitemaps, urls } = await discoverSitemapUrls(siteUrl, {
    securityOptions,
    maxPages: options.maxPages,
    sitemapUrl: options.sitemapUrl
  });

  const browser = await launchChromium({
    headless: true,
    args: resolveLaunchArgs(options)
  });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const issues = [];
    const pageErrors = [];
    let pagesScanned = 0;

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      options.onProgress?.({ current: i + 1, total: urls.length, route: url });
      try {
        const safeUrl = await resolveSafeRemoteUrl(url, securityOptions);
        issues.push(
          ...(await scanPage(
            page,
            safeUrl,
            mode,
            options.includeTags,
            options.excludeRules,
            timeout,
            securityOptions
          ))
        );
        pagesScanned += 1;
      } catch (error) {
        pageErrors.push({
          page: url,
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return {
      target: siteUrl,
      mode,
      generatedAt: new Date().toISOString(),
      issues,
      routes: urls,
      sitemaps,
      pageErrors,
      summary: summarizeIssues(issues, pagesScanned)
    };
  } finally {
    await browser.close();
  }
}

export async function scanDirectory(rootDir, options = {}) {
  const stat = await fs.stat(rootDir);
  if (!stat.isDirectory()) throw new Error(`Target is not a directory: ${rootDir}`);

  const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
  const progress = options.onProgress;
  const routes = await resolveDirectoryRoutes(rootDir, options.routes);
  const server = await startStaticServer(rootDir);
  const browser = await launchChromium({
    headless: true,
    args: resolveLaunchArgs(options)
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const issues = [];

    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      if (progress) progress({ current: i + 1, total: routes.length, route });
      const url = new URL(route, server.baseUrl).toString();
      const pageIssues = await scanPage(
        page,
        url,
        options.mode ?? 'balanced',
        options.includeTags,
        options.excludeRules,
        timeout,
        getSecurityOptions(options)
      );
      issues.push(...pageIssues);
    }

    return {
      target: path.resolve(rootDir),
      mode: options.mode ?? 'balanced',
      generatedAt: new Date().toISOString(),
      issues,
      routes,
      summary: summarizeIssues(issues, routes.length)
    };
  } finally {
    await browser.close();
    await server.close();
  }
}

export async function scanTarget(target, options = {}) {
  if (isUrl(target)) {
    return options.sitemap ? scanSitemap(target, options) : scanRemoteUrl(target, options);
  }
  return scanDirectory(target, options);
}
