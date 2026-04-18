import { existsSync } from "node:fs";

const required = [
  "packages/core/package.json",
  "packages/reporters/package.json",
  "packages/cli/package.json",
  "packages/astro-integration/package.json"
];

const missing = required.filter((file) => !existsSync(file));
if (missing.length > 0) {
  console.error("Missing workspace files:");
  for (const file of missing) console.error(`- ${file}`);
  process.exit(1);
}

console.log("Workspace structure looks valid.");
