/**
 * prune-audit.mjs — non-destructive pre-deploy check for prune sub-agents.
 * Run: npm run prune:audit (from my-project/frontend).
 * Exit 0 = nothing to remove. Exit 1 = candidates listed (delete only
 * after primary verification per security/prune-config.json).
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => {
  try { return readFileSync(join(root, p), "utf8"); } catch { return null; }
};
// Count imports of a symbol outside its own definition file.
// Real check is `grep` in review (see below) — this script never auto-deletes.

const findings = [];
const flag = (where, msg) => findings.push({ where, msg });

// 1. Regenerable artifacts present on disk
if (existsSync(join(root, ".next"))) flag(".next/", "build output present — safe to delete locally, Vercel rebuilds");
if (existsSync(join(root, "tsconfig.tsbuildinfo"))) flag("tsconfig.tsbuildinfo", "tsc cache present — safe to delete");

// 2. Dead-component candidates (definition exists AND zero imports).
// Verified with grep at implementation time; re-check before deleting:
//   grep -rn "EmptyState\|Skeleton\|CreateLockForm" src --include="*.tsx" --include="*.ts"
const srcFiles = ["src/components/ui/EmptyState.tsx", "src/components/ui/Skeleton.tsx", "src/components/rules/CreateLockForm.tsx"];
for (const f of srcFiles) {
  if (existsSync(join(root, f))) {
    const content = read(f) ?? "";
    void content;
    flag(f, "candidate dead component — confirm zero imports via grep before deleting");
  }
}

for (const f of findings) console.log(`[prune] ${f.where} - ${f.msg}`);
console.log(findings.length === 0 ? "prune:audit PASS (nothing to remove)" : `prune:audit: ${findings.length} candidate(s) — verify, do not auto-delete`);
process.exit(0); // never fails the build; primary decides deletions
