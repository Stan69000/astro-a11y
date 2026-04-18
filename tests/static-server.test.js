import test from "node:test";
import assert from "node:assert/strict";
import { startStaticServer } from "../packages/core/src/static-server.js";

async function withServer(fn) {
  let server;
  try {
    server = await startStaticServer("./examples/static-site/dist");
  } catch (err) {
    if (err.code === "EPERM" || err.code === "EACCES") {
      test.skip("TCP binding not available in this environment");
      return;
    }
    throw err;
  }
  try {
    await fn(server);
  } finally {
    await server.close();
  }
}

test("blocks path traversal attempts", async () => {
  await withServer(async (server) => {
    const response = await fetch(`${server.baseUrl}/../package.json`);
    assert.ok(response.status === 403 || response.status === 404);
  });
});

test("serves static files normally", async () => {
  await withServer(async (server) => {
    const response = await fetch(`${server.baseUrl}/index.html`);
    assert.equal(response.status, 200);
    const text = await response.text();
    assert.match(text, /html/i);
  });
});