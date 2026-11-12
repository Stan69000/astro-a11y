import { assertAllowedRemoteTarget } from './security.js';

/**
 * Request-level SSRF guard for the browser.
 *
 * Checking the scanned URL is not enough: once loaded, a page can make the browser
 * fetch images, scripts, iframes, XHR or WebSockets from anywhere, including the
 * scanner's own network (localhost, 192.168.x.x, cloud metadata endpoints). This
 * guard applies the remote-target rules to every request of the browser context.
 *
 * - Private, loopback, link-local and metadata destinations are blocked.
 * - The domain allowlist (--allowed-domains) only applies to the scanned pages, not to
 *   subresources: CDNs and font providers stay reachable.
 * - `allowOrigins` lets the local static server of a directory scan through.
 * - data: and blob: URLs never leave the browser and are always allowed.
 *
 * Limitation: the browser resolves DNS again after this check, so a domain that
 * switches to a private address between the two lookups (DNS rebinding) is not caught.
 * Run scans of untrusted sites in an isolated environment with restricted egress.
 */

const ALWAYS_ALLOWED_PROTOCOLS = new Set(['data:', 'blob:', 'about:']);

/**
 * @param {import('playwright').BrowserContext} context
 * @param {{ securityOptions?: object, allowOrigins?: string[] }} [options]
 * @returns {Promise<{ blocked: string[] }>} URLs refused so far (first 50), updated live.
 */
export async function installNetworkGuard(
  context,
  { securityOptions = {}, allowOrigins = [] } = {}
) {
  const blocked = [];
  const allowed = new Set(allowOrigins);
  const verdicts = new Map(); // origin → Promise<boolean>
  const subresourceOptions = { ...securityOptions, allowedDomains: undefined };

  const isAllowed = (rawUrl) => {
    let url;
    try {
      url = new URL(rawUrl);
    } catch {
      return Promise.resolve(false);
    }
    if (ALWAYS_ALLOWED_PROTOCOLS.has(url.protocol)) return Promise.resolve(true);
    if (allowed.has(url.origin)) return Promise.resolve(true);
    if (!['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol)) return Promise.resolve(false);

    const httpUrl = new URL(url.href);
    if (url.protocol === 'ws:') httpUrl.protocol = 'http:';
    if (url.protocol === 'wss:') httpUrl.protocol = 'https:';
    if (!verdicts.has(httpUrl.origin)) {
      verdicts.set(
        httpUrl.origin,
        assertAllowedRemoteTarget(httpUrl.href, subresourceOptions).then(
          () => true,
          () => false
        )
      );
    }
    return verdicts.get(httpUrl.origin);
  };

  const record = (url) => {
    if (blocked.length < 50) blocked.push(url);
  };

  await context.route('**/*', async (route) => {
    const url = route.request().url();
    if (await isAllowed(url)) return route.continue();
    record(url);
    return route.abort('blockedbyclient');
  });

  await context.routeWebSocket(/.*/, async (ws) => {
    if (await isAllowed(ws.url())) {
      ws.connectToServer();
    } else {
      record(ws.url());
      await ws.close({ code: 1008, reason: 'Blocked by astro-a11y network guard' });
    }
  });

  return { blocked };
}
