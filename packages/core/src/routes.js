import { readdir } from "node:fs/promises";
import path from "node:path";

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else {
      files.push(full);
    }
  }

  return files;
}

export async function collectHtmlRoutesFromDirectory(rootDir) {
  const files = await walk(rootDir);
  const htmlFiles = files.filter((file) => file.endsWith(".html"));
  const routes = htmlFiles.map((file) => {
    const rel = path.relative(rootDir, file).replace(/\\/g, "/");
    if (rel === "index.html") return "/";
    if (rel.endsWith("/index.html")) return `/${rel.slice(0, -"index.html".length)}`;
    return `/${rel}`;
  });

  return Array.from(new Set(routes));
}
