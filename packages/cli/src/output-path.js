import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export function resolveOutputPath(filePath, cwd = process.cwd()) {
  const resolvedCwd = path.resolve(cwd);
  const fullPath = path.resolve(resolvedCwd, filePath);
  if (!fullPath.startsWith(resolvedCwd + path.sep) && fullPath !== resolvedCwd) {
    throw new Error("Output path must be within current working directory.");
  }
  return fullPath;
}

export async function writeOutput(filePath, contents, cwd = process.cwd()) {
  const fullPath = resolveOutputPath(filePath, cwd);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, contents, "utf8");
}
