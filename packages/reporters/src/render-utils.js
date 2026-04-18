import { renderTerminal } from "./terminal.js";
import { renderJson } from "./json.js";
import { renderHtml } from "./html.js";
import { renderMarkdown } from "./markdown.js";

export function renderByFormat(result, format) {
  switch (format) {
    case "json": return renderJson(result);
    case "html": return renderHtml(result);
    case "markdown": return renderMarkdown(result);
    case "terminal":
    default: return renderTerminal(result);
  }
}

export { renderTerminal, renderJson, renderHtml, renderMarkdown };