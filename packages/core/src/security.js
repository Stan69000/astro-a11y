import dns from "node:dns/promises";
import net from "node:net";

const DNS_LOOKUP_TIMEOUT_MS = 5000;
const REDIRECT_FETCH_TIMEOUT_MS = 8000;
const DEFAULT_MAX_REDIRECTS = 3;

const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);

const SENSITIVE_PORTS = new Set([
  20, 21, 22, 23, 25, 53, 69, 111, 123, 135, 137, 138, 139, 143, 161, 389, 445, 512, 513, 514, 873, 1433, 1521,
  2049, 2375, 2376, 3306, 3389, 5432, 6379, 9200, 11211, 27017
]);

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "169.254.169.254",
  "0.0.0.0"
]);

function normalizeIPv6(ip) {
  if (ip.startsWith("::ffff:")) return ip.slice(7);
  if (ip.startsWith("0:0:0:0:0:ffff:")) return ip.slice(15);
  if (/^::[\da-f]+$/i.test(ip)) {
    const hex = ip.slice(2);
    const parts = hex.match(/.{1,4}/g) ?? [];
    if (parts.length <= 2) {
      const decimal = parts.map((h) => parseInt(h, 16));
      return decimal.join(".");
    }
  }
  return ip;
}

async function lookupWithTimeout(hostname) {
  const timeout = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error(`DNS lookup timed out for: ${hostname}`)),
      DNS_LOOKUP_TIMEOUT_MS
    )
  );
  return Promise.race([dns.lookup(hostname, { all: true }), timeout]);
}

function normalizeSecurityOptions(optionsOrAllowUnsafeTargets) {
  if (typeof optionsOrAllowUnsafeTargets === "boolean") {
    return {
      allowUnsafeTargets: optionsOrAllowUnsafeTargets,
      allowedDomains: undefined,
      maxRedirects: DEFAULT_MAX_REDIRECTS,
      blockSensitivePorts: false
    };
  }

  return {
    allowUnsafeTargets: optionsOrAllowUnsafeTargets?.allowUnsafeTargets === true,
    allowedDomains: optionsOrAllowUnsafeTargets?.allowedDomains,
    maxRedirects: optionsOrAllowUnsafeTargets?.maxRedirects ?? DEFAULT_MAX_REDIRECTS,
    blockSensitivePorts: optionsOrAllowUnsafeTargets?.blockSensitivePorts === true
  };
}

function isAllowedDomain(hostname, allowedDomains) {
  if (!allowedDomains?.length) return true;
  const normalizedHostname = hostname.toLowerCase();
  return allowedDomains.some((domain) => {
    const normalizedDomain = String(domain).trim().toLowerCase();
    if (!normalizedDomain) return false;
    return normalizedHostname === normalizedDomain || normalizedHostname.endsWith(`.${normalizedDomain}`);
  });
}

function isSensitivePort(url) {
  if (!url.port) return false;
  const port = Number(url.port);
  return Number.isInteger(port) && SENSITIVE_PORTS.has(port);
}

function assertSupportedProtocol(url) {
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`Unsupported protocol: ${url.protocol}`);
  }
}

export function isUnsafeHostname(hostname) {
  const lowered = hostname.trim().toLowerCase();
  if (BLOCKED_HOSTNAMES.has(lowered)) return true;
  if (lowered.endsWith(".local")) return true;
  return false;
}

export function isPrivateHost(ip) {
  const normalized = normalizeIPv6(ip);

  if (normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (normalized.startsWith("fe80:")) return true;

  if (!net.isIP(normalized)) return false;

  const parts = normalized.split(".").map((part) => Number(part));
  if (parts.length !== 4) return false;

  const [a, b] = parts;

  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a >= 224) return true;

  return false;
}

export async function assertAllowedRemoteTarget(rawUrl, optionsOrAllowUnsafeTargets = false) {
  const options = normalizeSecurityOptions(optionsOrAllowUnsafeTargets);

  const url = new URL(rawUrl);
  assertSupportedProtocol(url);

  if (options.blockSensitivePorts && isSensitivePort(url)) {
    throw new Error(`Blocked remote target port: ${url.port}`);
  }

  const hostname = url.hostname;
  if (!isAllowedDomain(hostname, options.allowedDomains)) {
    throw new Error(`Blocked remote target domain: ${hostname}`);
  }

  if (options.allowUnsafeTargets) return;

  if (isUnsafeHostname(hostname)) {
    throw new Error(`Blocked remote target hostname: ${hostname}`);
  }

  const records = await lookupWithTimeout(hostname);
  for (const record of records) {
    if (isPrivateHost(record.address)) {
      throw new Error(`Blocked remote target address: ${hostname} -> ${record.address}`);
    }
  }
}

async function fetchManualRedirect(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error("Redirect probe timeout")), REDIRECT_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal
    });
    if (response.body) {
      await response.body.cancel();
    }
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export async function resolveSafeRemoteUrl(rawUrl, optionsOrAllowUnsafeTargets = {}) {
  const options = normalizeSecurityOptions(optionsOrAllowUnsafeTargets);
  const maxRedirects = Math.max(0, Number(options.maxRedirects ?? DEFAULT_MAX_REDIRECTS) || 0);
  let currentUrl = new URL(rawUrl);

  for (let redirects = 0; redirects <= maxRedirects; redirects += 1) {
    await assertAllowedRemoteTarget(currentUrl.toString(), options);

    const response = await fetchManualRedirect(currentUrl);
    const location = response.headers.get("location");
    const isRedirect = REDIRECT_STATUS_CODES.has(response.status) && location;

    if (!isRedirect) {
      return currentUrl.toString();
    }

    if (maxRedirects === 0) {
      throw new Error("Redirects are disabled in the current security mode.");
    }
    if (redirects >= maxRedirects) {
      throw new Error(`Too many redirects for remote target: ${rawUrl}`);
    }

    currentUrl = new URL(location, currentUrl);
  }

  return currentUrl.toString();
}
