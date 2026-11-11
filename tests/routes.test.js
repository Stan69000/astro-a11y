import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import {
  collectHtmlRoutesFromDirectory,
  REPORT_GENERATOR as CORE_REPORT_GENERATOR
} from "../packages/core/src/routes.js";
import { renderHtml, REPORT_GENERATOR as REPORTER_REPORT_GENERATOR } from "../packages/reporters/src/html.js";

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

test("skips HTML reports previously written by astro-a11y", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "astro-a11y-routes-"));
  try {
    await writeFile(path.join(tempRoot, "index.html"), "<!doctype html><html><body>home</body></html>", "utf8");
    await mkdir(path.join(tempRoot, "astro-a11y"), { recursive: true });
    const report = renderHtml({
      target: tempRoot,
      mode: "balanced",
      generatedAt: "2026-01-01T00:00:00.000Z",
      summary: { pagesScanned: 1, issuesBySeverity: { critical: 0, major: 0, minor: 0, info: 0 } },
      issues: []
    });
    await writeFile(path.join(tempRoot, "astro-a11y", "report.html"), report, "utf8");

    const routes = await collectHtmlRoutesFromDirectory(tempRoot);
    assert.deepEqual(routes, ["/"]);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("core and reporters agree on the report marker", () => {
  assert.equal(CORE_REPORT_GENERATOR, REPORTER_REPORT_GENERATOR);
});
