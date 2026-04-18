import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { resolveOutputPath, writeOutput } from "../packages/cli/src/output-path.js";

test("blocks output path traversal outside cwd", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "astro-a11y-cli-"));
  const outsidePath = path.join(tempRoot, "..", "escape.json");
  assert.throws(() => resolveOutputPath(outsidePath, tempRoot), {
    message: "Output path must be within current working directory."
  });
  await rm(tempRoot, { recursive: true, force: true });
});

test("writes output inside cwd", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "astro-a11y-cli-"));
  try {
    const outputPath = "reports/out.json";
    await writeOutput(outputPath, "{\"ok\":true}", tempRoot);
    const fullPath = path.join(tempRoot, outputPath);
    const content = await readFile(fullPath, "utf8");
    assert.equal(content, "{\"ok\":true}");
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
