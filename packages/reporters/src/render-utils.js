import { renderTerminal } from "./terminal.js";
import { renderJson } from "./json.js";
import { renderHtml } from "./html.js";
import { renderMarkdown } from "./markdown.js";
import { sanitizeResult } from "./sanitize.js";
import { renderGithubComment } from "./github.js";

export function renderByFormat(result, format, options = {}) {
  const sanitized = sanitizeResult(result, options);
  switch (format) {
    case "json": return renderJson(sanitized);
    case "html": return renderHtml(sanitized);
    case "markdown": return renderMarkdown(sanitized);
    case "github": return renderGithubComment(sanitized, options);
    case "terminal":
    default: return renderTerminal(sanitized);
  }
}

export { renderTerminal, renderJson, renderHtml, renderMarkdown, renderGithubComment, sanitizeResult };
