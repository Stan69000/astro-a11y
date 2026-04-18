import test from "node:test";
import assert from "node:assert/strict";
import { mapAxeToRgaa } from "../packages/core/src/mappings.js";

test("maps known axe rules to RGAA metadata", () => {
  const mapping = mapAxeToRgaa("image-alt");
  assert.equal(mapping.rgaa, "1.1");
  assert.equal(mapping.severity, "major");
});

test("returns fallback mapping for unknown rules", () => {
  const mapping = mapAxeToRgaa("unknown-rule");
  assert.equal(mapping.rgaa, "manual-check");
});
