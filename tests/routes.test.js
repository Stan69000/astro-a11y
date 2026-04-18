import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { collectHtmlRoutesFromDirectory } from "../packages/core/src/routes.js";

test("discovers html routes in a static dist folder", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "astro-a11y-routes-"));
  try {
    await writeFile(path.join(tempRoot, "index.html"), "<!doctype html><html><body>home</body></html>", "utf8");
    await mkdir(path.join(tempRoot, "contact"), { recursive: true });
    await writeFile(path.join(tempRoot, "contact", "index.html"), "<!doctype html><html><body>contact</body></html>", "utf8");

    const routes = await collectHtmlRoutesFromDirectory(tempRoot);
    assert.ok(routes.includes("/"));
    assert.ok(routes.includes("/contact/"));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
