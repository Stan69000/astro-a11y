import test from "node:test";
import assert from "node:assert/strict";
import dns from "node:dns/promises";
import {
  isPrivateHost,
  isUnsafeHostname,
  assertAllowedRemoteTarget,
  resolveSafeRemoteUrl
} from "../packages/core/src/security.js";

test("detects private ipv4 ranges", () => {
  assert.equal(isPrivateHost("10.0.0.10"), true);
  assert.equal(isPrivateHost("192.168.1.4"), true);
  assert.equal(isPrivateHost("8.8.8.8"), false);
});

test("detects private ipv6 ranges", () => {
  assert.equal(isPrivateHost("fd00::1"), true);
  assert.equal(isPrivateHost("fe80::1"), true);
  assert.equal(isPrivateHost("2001:4860:4860::8888"), false);
});

test("detects unsafe hostnames", () => {
  assert.equal(isUnsafeHostname("localhost"), true);
  assert.equal(isUnsafeHostname("metadata.google.internal"), true);
  assert.equal(isUnsafeHostname("example.com"), false);
});

test("blocks unsafe remote targets", async () => {
  await assert.rejects(
    () => assertAllowedRemoteTarget("http://localhost:3000", false),
    { message: "Blocked remote target hostname: localhost" }
  );
});

test("allows safe remote targets when allowUnsafeTargets is true (no DNS needed)", async () => {
  await assertAllowedRemoteTarget("https://example.com", true);
});

test("rejects unsupported protocols", async () => {
  await assert.rejects(() => assertAllowedRemoteTarget("file:///etc/passwd"), { message: "Unsupported protocol: file:" });
});

test("applies domain allowlist", async (t) => {
  t.mock.method(dns, "lookup", async () => [{ address: "93.184.216.34" }]);

  await assert.doesNotReject(() =>
    assertAllowedRemoteTarget("https://docs.example.com", {
      allowedDomains: ["example.com"]
    })
  );
  await assert.rejects(
    () =>
      assertAllowedRemoteTarget("https://evil.com", {
        allowedDomains: ["example.com"]
      }),
    { message: "Blocked remote target domain: evil.com" }
  );
});

test("blocks sensitive ports when enabled", async (t) => {
  t.mock.method(dns, "lookup", async () => [{ address: "93.184.216.34" }]);
  await assert.rejects(
    () => assertAllowedRemoteTarget("https://example.com:22", { blockSensitivePorts: true }),
    { message: "Blocked remote target port: 22" }
  );
});

test("blocks redirects to private hosts", async (t) => {
  t.mock.method(dns, "lookup", async (hostname) => {
    if (hostname === "example.com") return [{ address: "93.184.216.34" }];
    return [{ address: "127.0.0.1" }];
  });
  t.mock.method(globalThis, "fetch", async (url) => {
    if (String(url) === "https://example.com/") {
      return new Response("", {
        status: 302,
        headers: { location: "http://localhost/internal" }
      });
    }
    return new Response("", { status: 200 });
  });

  await assert.rejects(() => resolveSafeRemoteUrl("https://example.com", { maxRedirects: 3 }), {
    message: "Blocked remote target hostname: localhost"
  });
});

test("blocks when redirect limit is exceeded", async (t) => {
  t.mock.method(dns, "lookup", async () => [{ address: "93.184.216.34" }]);
  t.mock.method(globalThis, "fetch", async (url) => {
    const current = new URL(String(url));
    const next = current.pathname === "/" ? "/r1" : current.pathname === "/r1" ? "/r2" : "/r3";
    return new Response("", {
      status: 302,
      headers: { location: next }
    });
  });

  await assert.rejects(() => resolveSafeRemoteUrl("https://example.com", { maxRedirects: 2 }), {
    message: "Too many redirects for remote target: https://example.com"
  });
});

test("rejects redirects in paranoid mode", async (t) => {
  t.mock.method(dns, "lookup", async () => [{ address: "93.184.216.34" }]);
  t.mock.method(globalThis, "fetch", async () => {
    return new Response("", {
      status: 302,
      headers: { location: "/next" }
    });
  });

  await assert.rejects(() => resolveSafeRemoteUrl("https://example.com", { maxRedirects: 0 }), {
    message: "Redirects are disabled in the current security mode."
  });
});
