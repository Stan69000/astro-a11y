import test from "node:test";
import assert from "node:assert/strict";
import { renderTerminal } from "../packages/reporters/src/terminal.js";
import { renderJson } from "../packages/reporters/src/json.js";
import { renderHtml } from "../packages/reporters/src/html.js";
import { renderMarkdown } from "../packages/reporters/src/markdown.js";
import { renderByFormat } from "../packages/reporters/src/render-utils.js";

const mockResult = {
  target: "/dist",
  mode: "balanced",
  generatedAt: "2024-01-01T00:00:00.000Z",
  summary: {
    pagesScanned: 2,
    issuesBySeverity: { critical: 1, major: 2, minor: 1, info: 0 }
  },
  issues: [
    {
      id: "image-alt",
      rgaa: "1.1",
      severity: "major",
      title: "Alternative text missing on image",
      page: "/index.html",
      why: "Screen readers cannot understand the image.",
      howToFix: "Add alt attribute.",
      nodes: [{ target: "img", failureSummary: "Fix this" }]
    }
  ]
};

test("renderTerminal returns string with issues", () => {
  const output = renderTerminal(mockResult);
  assert.match(output, /astro-a11y report/);
  assert.match(output, /Pages scanned: 2/);
  assert.match(output, /major=2/);
});

test("renderTerminal handles empty issues", () => {
  const result = { ...mockResult, issues: [] };
  const output = renderTerminal(result);
  assert.match(output, /No accessibility issues detected/);
});

test("renderJson returns valid JSON", () => {
  const output = renderJson(mockResult);
  const parsed = JSON.parse(output);
  assert.equal(parsed.target, "/dist");
  assert.equal(parsed.summary.pagesScanned, 2);
});

test("renderHtml returns full HTML document", () => {
  const output = renderHtml(mockResult);
  assert.match(output, /<!DOCTYPE html>/);
  assert.match(output, /<html lang="en">/);
  assert.match(output, /Pages scanned/);
  assert.match(output, /Alternative text missing/);
});

test("renderHtml escapes special characters", () => {
  const result = {
    ...mockResult,
    issues: [{ ...mockResult.issues[0], title: "<script>alert(1)</script>" }]
  };
  const output = renderHtml(result);
  assert.match(output, /&lt;script&gt;/);
});

test("renderMarkdown returns markdown content", () => {
  const output = renderMarkdown(mockResult);
  assert.match(output, /^# astro-a11y report/);
  assert.match(output, /\| Severity \|/);
  assert.match(output, /## Alternative text missing/);
});

test("renderMarkdown handles empty issues", () => {
  const result = { ...mockResult, issues: [] };
  const output = renderMarkdown(result);
  assert.match(output, /No accessibility issues detected/);
});

test("renderByFormat truncates oversized fields", () => {
  const veryLongTitle = "x".repeat(6000);
  const output = renderByFormat(
    {
      ...mockResult,
      issues: [{ ...mockResult.issues[0], title: veryLongTitle }]
    },
    "json",
    { maxFieldLength: 200 }
  );
  assert.match(output, /\.\.\.\[truncated\]/);
});

test("renderByFormat strips raw html in safe-report mode", () => {
  const output = renderByFormat(
    {
      ...mockResult,
      issues: [
        {
          ...mockResult.issues[0],
          before: "<img src=x>",
          nodes: [{ target: "img", html: "<img src=x>" }]
        }
      ]
    },
    "json",
    { safeReport: true }
  );
  const parsed = JSON.parse(output);
  assert.equal(parsed.issues[0].before, undefined);
  assert.equal(parsed.issues[0].nodes[0].html, undefined);
});
