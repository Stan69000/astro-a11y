import { cp, mkdir } from "node:fs/promises";
import path from "node:path";

const [, , fromRel, toRel] = process.argv;
if (!fromRel || !toRel) {
  console.error("Usage: node scripts/copy-package.js <from> <to>");
  process.exit(1);
}

const from = path.resolve(fromRel);
const to = path.resolve(toRel);

await mkdir(to, { recursive: true });
await cp(from, to, { recursive: true });
console.log(`Copied ${fromRel} -> ${toRel}`);
