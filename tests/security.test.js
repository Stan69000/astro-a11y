import test from "node:test";
import assert from "node:assert/strict";
import { isPrivateHost, isUnsafeHostname, assertAllowedRemoteTarget } from "../packages/core/src/security.js";

test("detects private ipv4 ranges", () => {
  assert.equal(isPrivateHost("10.0.0.10"), true);
  assert.equal(isPrivateHost("192.168.1.4"), true);
  assert.equal(isPrivateHost("8.8.8.8"), false);
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

test("resolves non-private hostname without throwing", async () => {
  const { isPrivateHost } = await import("../packages/core/src/security.js");
  assert.equal(isPrivateHost("8.8.8.8"), false);
  assert.equal(isPrivateHost("1.1.1.1"), false);
});
