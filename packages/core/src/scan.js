import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { assertAllowedRemoteTarget, isUnsafeHostname } from './security.js';
import { collectHtmlRoutesFromDirectory } from './routes.js';
import { startStaticServer } from './static-server.js';
import { enrichViolation } from './mappings.js';

const DEFAULT_TIMEOUT_MS = 15000;

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

export function summarizeIssues(issues) {
  const issuesBySeverity = { critical: 0, major: 0, minor: 0, info: 0 };
  const pages = new Set();
  for (const issue of issues) {
    issuesBySeverity[issue.severity] += 1;
    pages.add(issue.page);
  }
  return {
    pagesScanned: pages.size,
    issuesBySeverity,
    failed: issuesBySeverity.critical > 0 || issuesBySeverity.major > 0
  };
}

async function resolveDirectoryRoutes(rootDir, providedRoutes) {
  if (providedRoutes?.length) return normalizeRoutes(providedRoutes);
  return collectHtmlRoutesFromDirectory(rootDir);
}

async function scanPage(page, url, mode, includeTags, excludeRules, timeout, allowUnsafeTargets) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout });

  const finalUrl = page.url();
  if (finalUrl !== url && isUrl(finalUrl)) {
    await assertAllowedRemoteTarget(finalUrl, allowUnsafeTargets === true);
  }

  let builder = new AxeBuilder({ page });

  if (includeTags?.length) builder = builder.withTags(includeTags);
  if (excludeRules?.length) builder = builder.disableRules(excludeRules);

  const results = await builder.analyze();
  return results.violations.map((violation) => enrichViolation(violation, url, mode));
}

export async function scanRemoteUrl(url, options = {}) {
  await assertAllowedRemoteTarget(url, options.allowUnsafeTargets === true);
  const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const issues = await scanPage(
      page,
      url,
      options.mode ?? 'balanced',
      options.includeTags,
      options.excludeRules,
      timeout,
      options.allowUnsafeTargets
    );

    return {
      target: url,
      mode: options.mode ?? 'balanced',
      generatedAt: new Date().toISOString(),
      issues,
      summary: summarizeIssues(issues)
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
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
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
        options.allowUnsafeTargets
      );
      issues.push(...pageIssues);
    }

    return {
      target: path.resolve(rootDir),
      mode: options.mode ?? 'balanced',
      generatedAt: new Date().toISOString(),
      issues,
      routes,
      summary: summarizeIssues(issues)
    };
  } finally {
    await browser.close();
    await server.close();
  }
}

export async function scanTarget(target, options = {}) {
  if (isUrl(target)) {
    return scanRemoteUrl(target, options);
  }
  return scanDirectory(target, options);
}
