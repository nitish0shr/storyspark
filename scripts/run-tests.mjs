#!/usr/bin/env node
/**
 * Zero-dependency test runner for Starmee.
 *
 * Replit's package firewall blocks vitest/jest, so this uses what is already
 * available: the TypeScript compiler plus Node 20's built-in `node --test`.
 *
 *   1. Compile src/ + tests/ to .test-build/ (CommonJS).
 *   2. Rewrite the "@/..." path alias to real relative paths in the output,
 *      because tsc resolves the alias for type-checking but does not rewrite
 *      it on emit.
 *   3. Run every *.test.js under .test-build/tests.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, ".test-build");

fs.rmSync(OUT, { recursive: true, force: true });

console.log("[tests] compiling...");
try {
  execFileSync("npx", ["--no-install", "tsc", "-p", "tsconfig.test.json"], { stdio: "inherit" });
} catch {
  console.error("[tests] TypeScript compilation failed.");
  process.exit(1);
}

const srcRoot = path.join(OUT, "src");
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (p.endsWith(".js")) out.push(p);
  }
  return out;
}

let rewritten = 0;
for (const file of walk(OUT)) {
  const original = fs.readFileSync(file, "utf8");
  const updated = original.replace(/require\("@\/([^"]+)"\)/g, (_m, sub) => {
    let rel = path.relative(path.dirname(file), path.join(srcRoot, sub));
    if (!rel.startsWith(".")) rel = "./" + rel;
    return 'require("' + rel.split(path.sep).join("/") + '")';
  });
  if (updated !== original) { fs.writeFileSync(file, updated); rewritten++; }
}
console.log("[tests] rewrote @/ alias in " + rewritten + " file(s)");

const testDir = path.join(OUT, "tests");
if (!fs.existsSync(testDir)) { console.error("[tests] no compiled tests found"); process.exit(1); }
const testFiles = walk(testDir).filter((f) => f.endsWith(".test.js"));
console.log("[tests] running " + testFiles.length + " test file(s)\n");
try {
  execFileSync(process.execPath, ["--test", ...testFiles], { stdio: "inherit" });
} catch {
  process.exit(1);
}
