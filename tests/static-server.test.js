import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { startStaticServer } from "../packages/core/src/static-server.js";

async function withServer(rootDir, fn) {
  let server;
  try {
    server = await startStaticServer(rootDir);
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
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "astro-a11y-server-"));
  try {
    await writeFile(path.join(tempRoot, "index.html"), "<!doctype html><html><body>ok</body></html>", "utf8");
    await withServer(tempRoot, async (server) => {
      const response = await fetch(`${server.baseUrl}/../package.json`);
      assert.ok(response.status === 403 || response.status === 404);
    });
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("serves static files normally", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "astro-a11y-server-"));
  try {
    await writeFile(path.join(tempRoot, "index.html"), "<!doctype html><html><body>hello</body></html>", "utf8");
    await withServer(tempRoot, async (server) => {
      const response = await fetch(`${server.baseUrl}/index.html`);
      assert.equal(response.status, 200);
      const text = await response.text();
      assert.match(text, /html/i);
    });
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
