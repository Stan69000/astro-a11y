import { Buffer } from 'node:buffer';
import { assertAllowedRemoteTarget, resolveSafeRemoteUrl } from './security.js';

/**
 * Discovers the pages of a remote site from its sitemaps, with the same SSRF
 * guards as single-URL scans: every fetched URL (and every redirect hop) is
 * validated, and only URLs on the site's own hostname are kept.
 */

export const DEFAULT_MAX_PAGES = 50;
const MAX_SITEMAP_DOCUMENTS = 20;
const MAX_SITEMAP_BYTES = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10000;

// Astro's @astrojs/sitemap writes sitemap-index.xml; most other generators write sitemap.xml.
const DEFAULT_SITEMAP_PATHS = ['/sitemap-index.xml', '/sitemap.xml'];

const XML_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decodeXml(value) {
  return value
    .replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, '$1')
    .replace(/&(amp|lt|gt|quot|apos);/g, (_, name) => XML_ENTITIES[name])
    .trim();
}

/**
 * @param {string} xml
 * @returns {{ kind: 'index' | 'urlset' | 'unknown', locs: string[] }}
 */
export function parseSitemap(xml) {
  const kind = /<sitemapindex[\s>]/i.test(xml)
    ? 'index'
    : /<urlset[\s>]/i.test(xml)
      ? 'urlset'
      : 'unknown';
  const locs = [];
  for (const match of xml.matchAll(/<loc>\s*([\s\S]*?)\s*<\/loc>/gi)) {
    const loc = decodeXml(match[1]);
    if (loc) locs.push(loc);
  }
  return { kind, locs };
}

/** `Sitemap:` lines of a robots.txt file. */
export function parseRobotsSitemaps(robotsTxt) {
  return Array.from(robotsTxt.matchAll(/^\s*sitemap\s*:\s*(\S+)\s*$/gim), (match) => match[1]);
}

function sameHost(candidate, site) {
  try {
    const url = new URL(candidate, site);
    return ['http:', 'https:'].includes(url.protocol) && url.hostname === site.hostname
      ? url
      : null;
  } catch {
    return null;
  }
}

async function readCapped(response, maxBytes) {
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    await response.body?.cancel();
    throw new Error(`Response larger than ${maxBytes} bytes`);
  }
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error(`Response larger than ${maxBytes} bytes`);
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

/** Fetches a text document after validating it (and its redirects) against the security options. */
async function fetchText(rawUrl, securityOptions) {
  const safeUrl = await resolveSafeRemoteUrl(rawUrl, securityOptions);
  const response = await fetch(safeUrl, {
    redirect: 'error',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });
  if (!response.ok) {
    await response.body?.cancel();
    return null;
  }
  return readCapped(response, MAX_SITEMAP_BYTES);
}

/**
 * @param {string} siteUrl Any URL of the site; only its origin is used for defaults.
 * @param {{ securityOptions?: object, maxPages?: number, sitemapUrl?: string }} [options]
 * @returns {Promise<{ sitemaps: string[], urls: string[] }>}
 */
export async function discoverSitemapUrls(siteUrl, options = {}) {
  const site = new URL(siteUrl);
  const maxPages = options.maxPages ?? DEFAULT_MAX_PAGES;
  if (!Number.isInteger(maxPages) || maxPages <= 0) {
    throw new Error(`maxPages must be a positive integer, got: ${maxPages}`);
  }
  const securityOptions = options.securityOptions ?? {};
  // Fail with the real reason when the site itself is not an allowed target.
  await assertAllowedRemoteTarget(site.toString(), securityOptions);

  let queue;
  if (options.sitemapUrl) {
    const explicit = sameHost(options.sitemapUrl, site);
    if (!explicit) throw new Error(`Sitemap must be on ${site.hostname}: ${options.sitemapUrl}`);
    queue = [explicit.toString()];
  } else {
    const robots = await fetchText(new URL('/robots.txt', site).toString(), securityOptions).catch(
      () => null
    );
    const declared = robots ? parseRobotsSitemaps(robots) : [];
    queue = [...declared, ...DEFAULT_SITEMAP_PATHS]
      .map((candidate) => sameHost(candidate, site)?.toString())
      .filter(Boolean);
  }

  const visited = new Set();
  const usedSitemaps = [];
  const pages = new Set();
  const failures = [];

  while (queue.length > 0 && pages.size < maxPages && visited.size < MAX_SITEMAP_DOCUMENTS) {
    const sitemapUrl = queue.shift();
    if (visited.has(sitemapUrl)) continue;
    visited.add(sitemapUrl);

    const xml = await fetchText(sitemapUrl, securityOptions).catch((error) => {
      failures.push(`${sitemapUrl}: ${error.message}`);
      return null;
    });
    if (!xml) continue;
    const { kind, locs } = parseSitemap(xml);
    if (kind === 'unknown') continue;
    usedSitemaps.push(sitemapUrl);

    for (const loc of locs) {
      const url = sameHost(loc, site);
      if (!url) continue;
      if (kind === 'index') {
        queue.push(url.toString());
      } else if (pages.size < maxPages) {
        url.hash = '';
        pages.add(url.toString());
      }
    }
  }

  if (pages.size === 0) {
    const reason = options.sitemapUrl
      ? `No page found in sitemap ${options.sitemapUrl}`
      : `No sitemap found for ${site.origin} (robots.txt, /sitemap-index.xml, /sitemap.xml)`;
    throw new Error(failures.length > 0 ? `${reason}. ${failures.join('; ')}` : reason);
  }
  return { sitemaps: usedSitemaps, urls: Array.from(pages) };
}
