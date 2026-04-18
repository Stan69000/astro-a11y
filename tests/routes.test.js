import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { collectHtmlRoutesFromDirectory } from "../packages/core/src/routes.js";

test("discovers html routes in a static dist folder", async () => {
  const routes = await collectHtmlRoutesFromDirectory(path.resolve("examples/static-site/dist"));
  assert.ok(routes.includes("/"));
  assert.ok(routes.includes("/contact/"));
});
