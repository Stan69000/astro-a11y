import fs from 'node:fs/promises';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { assertAllowedRemoteTarget, resolveSafeRemoteUrl } from './security.js';
import { collectHtmlRoutesFromDirectory } from './routes.js';
import { startStaticServer } from './static-server.js';
import { enrichViolation, RGAA_VERSION } from './mappings.js';
import { launchChromium } from './browser.js';
import { KEYBOARD_RULES, runKeyboardChecks } from './keyboard.js';
import { buildCriteriaView, recordAxeOutcomes, recordOutcome } from './criteria.js';
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

/**
 * @param {object} options Scan options.
 * @param {object} securityOptions
 * @param {Map<string, string>} ruleOutcomes Filled with the outcome of every rule run (see criteria.js).
 */
function pageContext(options, securityOptions, ruleOutcomes) {
  return {
    mode: options.mode ?? 'balanced',
    lang: options.lang ?? 'en',
    includeTags: options.includeTags,
    excludeRules: options.excludeRules,
    timeout: options.timeout ?? DEFAULT_TIMEOUT_MS,
    securityOptions,
    keyboard: options.keyboard,
    ruleOutcomes
  };
}

/** Common shape of every scan result. */
function buildResult({ target, options, issues, pagesScanned, ruleOutcomes, ...extra }) {
  return {
    target,
    mode: options.mode ?? 'balanced',
    lang: options.lang ?? 'en',
    rgaaVersion: RGAA_VERSION,
    generatedAt: new Date().toISOString(),
    issues,
    ...extra,
    criteria: buildCriteriaView(ruleOutcomes, issues, KEYBOARD_RULES),
    summary: summarizeIssues(issues, pagesScanned)
  };
}

/**
 * @param {import('playwright').Page} page
 * @param {string} url
 * @param {{ mode: string, includeTags?: string[], excludeRules?: string[], timeout: number,
 *   securityOptions?: object, keyboard?: boolean }} context
 */
async function scanPage(
  page,
  url,
  { mode, lang, includeTags, excludeRules, timeout, securityOptions, keyboard, ruleOutcomes }
) {
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
  recordAxeOutcomes(ruleOutcomes, results);
  const issues = results.violations.map((violation) =>
    enrichViolation(violation, url, mode, { lang })
  );
  if (keyboard !== false) {
    const keyboardResult = await runKeyboardChecks(page, url, mode, { lang });
    issues.push(...keyboardResult.issues);
    for (const [ruleId, outcome] of Object.entries(keyboardResult.outcomes)) {
      recordOutcome(ruleOutcomes, ruleId, outcome);
    }
  }
  return issues;
}

export async function scanRemoteUrl(url, options = {}) {
  const securityOptions = getSecurityOptions(options);
  const resolvedUrl = await resolveSafeRemoteUrl(url, securityOptions);

  const browser = await launchChromium({
    headless: true,
    args: resolveLaunchArgs(options)
  });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const ruleOutcomes = new Map();
    const issues = await scanPage(
      page,
      resolvedUrl,
      pageContext(options, securityOptions, ruleOutcomes)
    );

    return buildResult({ target: resolvedUrl, options, issues, pagesScanned: 1, ruleOutcomes });
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
    const ruleOutcomes = new Map();
    let pagesScanned = 0;

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      options.onProgress?.({ current: i + 1, total: urls.length, route: url });
      try {
        const safeUrl = await resolveSafeRemoteUrl(url, securityOptions);
        issues.push(
          ...(await scanPage(page, safeUrl, pageContext(options, securityOptions, ruleOutcomes)))
        );
        pagesScanned += 1;
      } catch (error) {
        pageErrors.push({
          page: url,
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return buildResult({
      target: siteUrl,
      options,
      issues,
      pagesScanned,
      ruleOutcomes,
      routes: urls,
      sitemaps,
      pageErrors
    });
  } finally {
    await browser.close();
  }
}

export async function scanDirectory(rootDir, options = {}) {
  const stat = await fs.stat(rootDir);
  if (!stat.isDirectory()) throw new Error(`Target is not a directory: ${rootDir}`);

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
    const ruleOutcomes = new Map();

    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      if (progress) progress({ current: i + 1, total: routes.length, route });
      const url = new URL(route, server.baseUrl).toString();
      const pageIssues = await scanPage(
        page,
        url,
        pageContext(options, getSecurityOptions(options), ruleOutcomes)
      );
      issues.push(...pageIssues);
    }

    return buildResult({
      target: path.resolve(rootDir),
      options,
      issues,
      pagesScanned: routes.length,
      ruleOutcomes,
      routes
    });
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
