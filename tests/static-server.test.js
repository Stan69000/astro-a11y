import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
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

function rawGet(baseUrl, rawPath) {
  const { port } = new URL(baseUrl);
  return new Promise((resolve, reject) => {
    const request = http.request({ host: "127.0.0.1", port, path: rawPath, method: "GET" }, (response) => {
      let body = "";
      response.on("data", (chunk) => (body += chunk));
      response.on("end", () => resolve({ status: response.statusCode, body, type: response.headers["content-type"] }));
    });
    request.on("error", reject);
    request.end();
  });
}

test("refuses encoded traversal and symlinks pointing outside the build", async () => {
  const outside = await mkdtemp(path.join(os.tmpdir(), "astro-a11y-outside-"));
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "astro-a11y-server-"));
  try {
    await writeFile(path.join(outside, "secret.txt"), "TOP SECRET", "utf8");
    await writeFile(path.join(tempRoot, "index.html"), "<!doctype html><title>ok</title>", "utf8");
    await symlink(path.join(outside, "secret.txt"), path.join(tempRoot, "leak.txt"));
    await symlink(outside, path.join(tempRoot, "leakdir"));
    await withServer(tempRoot, async (server) => {
      for (const rawPath of [
        "/leak.txt",
        "/leakdir/secret.txt",
        `/%2e%2e/${path.basename(outside)}/secret.txt`,
        `/..%2f${path.basename(outside)}%2fsecret.txt`,
        "/index.html%00.txt"
      ]) {
        const response = await rawGet(server.baseUrl, rawPath);
        assert.notEqual(response.status, 200, rawPath);
        assert.doesNotMatch(response.body, /TOP SECRET/, rawPath);
      }
      const ok = await rawGet(server.baseUrl, "/");
      assert.equal(ok.status, 200);
      assert.match(ok.type, /text\/html/);
    });
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

test("serves fonts and modern images with their content type", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "astro-a11y-server-"));
  try {
    await writeFile(path.join(tempRoot, "font.woff2"), "x");
    await writeFile(path.join(tempRoot, "photo.webp"), "x");
    await withServer(tempRoot, async (server) => {
      assert.equal((await rawGet(server.baseUrl, "/font.woff2")).type, "font/woff2");
      assert.equal((await rawGet(server.baseUrl, "/photo.webp")).type, "image/webp");
    });
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
