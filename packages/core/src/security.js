import dns from "node:dns/promises";
import net from "node:net";

const DNS_LOOKUP_TIMEOUT_MS = 5000;

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

export async function assertAllowedRemoteTarget(rawUrl, allowUnsafeTargets = false) {
  if (allowUnsafeTargets) return;

  const url = new URL(rawUrl);
  const hostname = url.hostname;

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
