import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

export async function startStaticServer(rootDir) {
  const server = http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url ?? "/", "http://127.0.0.1");
      const decodedPathname = decodeURIComponent(requestUrl.pathname);
      const filePath = path.join(rootDir, decodedPathname);

      const resolvedRoot = path.resolve(rootDir);
      const resolvedPath = path.resolve(filePath);
      if (!resolvedPath.startsWith(resolvedRoot + path.sep) && resolvedPath !== resolvedRoot) {
        res.statusCode = 403;
        res.end("Forbidden");
        return;
      }

      let resolved;

      try {
        const info = await stat(filePath);
        resolved = info.isDirectory() ? path.join(filePath, "index.html") : filePath;
      } catch {
        try {
          resolved = path.join(rootDir, decodedPathname, "index.html");
        } catch {
          res.statusCode = 404;
          res.end("Not found");
          return;
        }
      }

      if (!path.resolve(resolved).startsWith(resolvedRoot + path.sep) && path.resolve(resolved) !== resolvedRoot) {
        res.statusCode = 403;
        res.end("Forbidden");
        return;
      }

      const body = await readFile(resolved);
      res.statusCode = 200;
      res.setHeader("content-type", contentType(resolved));
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
