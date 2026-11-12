import http from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".vtt": "text/vtt; charset=utf-8",
  ".pdf": "application/pdf",
  ".wasm": "application/wasm"
};

function contentType(filePath) {
  return CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

function isInside(root, candidate) {
  return candidate === root || candidate.startsWith(root + path.sep);
}

/**
 * Resolves a request path to a file inside `realRoot`, following symlinks so that a
 * link pointing outside the build directory (e.g. to /etc) is refused.
 *
 * @returns {Promise<string | null>} Absolute real path, or null when not servable.
 */
async function resolveFile(realRoot, pathname) {
  const requested = path.resolve(realRoot, "." + path.posix.normalize("/" + pathname));
  if (!isInside(realRoot, requested)) return null;

  for (const candidate of [requested, path.join(requested, "index.html")]) {
    let real;
    try {
      real = await realpath(candidate);
    } catch {
      continue;
    }
    if (!isInside(realRoot, real)) return null;
    const info = await stat(real);
    if (info.isFile()) return real;
  }
  return null;
}

export async function startStaticServer(rootDir) {
  const realRoot = await realpath(path.resolve(rootDir));

  const server = http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url ?? "/", "http://127.0.0.1");
      const pathname = decodeURIComponent(requestUrl.pathname);
      if (pathname.includes("\0")) {
        res.statusCode = 400;
        res.end("Bad request");
        return;
      }

      const file = await resolveFile(realRoot, pathname);
      if (!file) {
        res.statusCode = 404;
        res.end("Not found");
        return;
      }

      const body = await readFile(file);
      res.statusCode = 200;
      res.setHeader("content-type", contentType(file));
      res.setHeader("x-content-type-options", "nosniff");
      res.end(body);
    } catch {
      res.statusCode = 404;
      res.end("Not found");
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Unable to start local static server.");
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    async close() {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  };
}
