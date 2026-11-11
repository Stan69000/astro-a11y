import test from 'node:test';
import assert from 'node:assert/strict';
import dns from 'node:dns/promises';
import {
  discoverSitemapUrls,
  parseRobotsSitemaps,
  parseSitemap
} from '../packages/core/src/sitemap.js';

const urlset = (...locs) =>
  `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locs
    .map((loc) => `<url><loc>${loc}</loc></url>`)
    .join('')}</urlset>`;
const index = (...locs) =>
  `<?xml version="1.0"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locs
    .map((loc) => `<sitemap><loc>${loc}</loc></sitemap>`)
    .join('')}</sitemapindex>`;

function mockSite(t, documents) {
  t.mock.method(dns, 'lookup', async () => [{ address: '93.184.216.34' }]);
  const requested = [];
  t.mock.method(globalThis, 'fetch', async (url) => {
    const key = String(url);
    requested.push(key);
    const doc = documents[key];
    if (doc === undefined) return new Response('not found', { status: 404 });
    if (typeof doc === 'object') return new Response('', doc);
    return new Response(doc, { status: 200 });
  });
  return requested;
}

test('parses url sets, indexes, CDATA and XML entities', () => {
  assert.deepEqual(
    parseSitemap(urlset('https://a.fr/x?a=1&amp;b=2', '<![CDATA[https://a.fr/y]]>')),
    {
      kind: 'urlset',
      locs: ['https://a.fr/x?a=1&b=2', 'https://a.fr/y']
    }
  );
  assert.equal(parseSitemap(index('https://a.fr/sitemap-0.xml')).kind, 'index');
  assert.equal(parseSitemap('<html></html>').kind, 'unknown');
});

test('reads Sitemap lines from robots.txt', () => {
  assert.deepEqual(
    parseRobotsSitemaps('User-agent: *\nSitemap: https://a.fr/s.xml\n  sitemap:https://a.fr/t.xml'),
    ['https://a.fr/s.xml', 'https://a.fr/t.xml']
  );
});

test("follows Astro's sitemap index and keeps only the site's own pages", async (t) => {
  mockSite(t, {
    'https://site.fr/sitemap-index.xml': index(
      'https://site.fr/sitemap-0.xml',
      'https://evil.example/sitemap.xml'
    ),
    'https://site.fr/sitemap-0.xml': urlset(
      'https://site.fr/',
      'https://site.fr/blog/#top',
      'https://other.example/page',
      'javascript:alert(1)'
    )
  });
  const { urls, sitemaps } = await discoverSitemapUrls('https://site.fr/blog/', {
    securityOptions: {}
  });
  assert.deepEqual(urls, ['https://site.fr/', 'https://site.fr/blog/']);
  assert.deepEqual(sitemaps, [
    'https://site.fr/sitemap-index.xml',
    'https://site.fr/sitemap-0.xml'
  ]);
});

test('uses the sitemaps declared in robots.txt first', async (t) => {
  const requested = mockSite(t, {
    'https://site.fr/robots.txt': 'Sitemap: https://site.fr/custom.xml',
    'https://site.fr/custom.xml': urlset('https://site.fr/a')
  });
  const { urls } = await discoverSitemapUrls('https://site.fr', { securityOptions: {} });
  assert.deepEqual(urls, ['https://site.fr/a']);
  assert.ok(
    requested.indexOf('https://site.fr/custom.xml') <
      requested.indexOf('https://site.fr/sitemap-index.xml')
  );
});

test('stops at maxPages', async (t) => {
  mockSite(t, {
    'https://site.fr/sitemap.xml': urlset(
      'https://site.fr/1',
      'https://site.fr/2',
      'https://site.fr/3'
    )
  });
  const { urls } = await discoverSitemapUrls('https://site.fr', {
    securityOptions: {},
    maxPages: 2
  });
  assert.equal(urls.length, 2);
});

test('never fetches a sitemap that redirects to a private host', async (t) => {
  t.mock.method(dns, 'lookup', async (hostname) =>
    hostname === 'site.fr' ? [{ address: '93.184.216.34' }] : [{ address: '127.0.0.1' }]
  );
  const requested = [];
  t.mock.method(globalThis, 'fetch', async (url) => {
    requested.push(String(url));
    if (String(url) === 'https://site.fr/sitemap.xml') {
      return new Response('', {
        status: 302,
        headers: { location: 'http://internal.example/admin.xml' }
      });
    }
    return new Response('not found', { status: 404 });
  });
  await assert.rejects(
    () => discoverSitemapUrls('https://site.fr', { securityOptions: {} }),
    /No sitemap found.*Blocked remote target address: internal\.example -> 127\.0\.0\.1/
  );
  assert.ok(!requested.some((url) => url.includes('internal.example')));
});

test('refuses a private site before fetching anything', async (t) => {
  const requested = mockSite(t, {});
  await assert.rejects(
    () => discoverSitemapUrls('http://localhost:4321/', { securityOptions: {} }),
    /Blocked remote target hostname: localhost/
  );
  assert.deepEqual(requested, []);
});

test('rejects an explicit sitemap on another host and a site without sitemap', async (t) => {
  mockSite(t, {});
  await assert.rejects(
    () => discoverSitemapUrls('https://site.fr', { sitemapUrl: 'https://evil.example/s.xml' }),
    /Sitemap must be on site\.fr/
  );
  await assert.rejects(
    () => discoverSitemapUrls('https://site.fr', {}),
    /No sitemap found for https:\/\/site\.fr/
  );
  await assert.rejects(() => discoverSitemapUrls('https://site.fr', { maxPages: 0 }), /maxPages/);
});
