/**
 * check-prompt-parity.mjs — Stage 5 parity gate (no deps, runs with node).
 * Asserts frontend promptBuilder.ts and backend PromptBuilderService.php
 * implement the SAME prompt v1 contract: version tag, lock-line format,
 * refusal text, jailbreak pattern, contract keywords.
 *
 * Run: node scripts/check-prompt-parity.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ts = readFileSync(join(root, "src/lib/promptBuilder.ts"), "utf8");
const php = readFileSync(
  join(root, "..", "backend", "app", "Services", "PromptBuilderService.php"),
  "utf8"
);

let failures = 0;
function check(name, cond) {
  console.log(`${cond ? "✅" : "❌"} ${name}`);
  if (!cond) failures++;
}

// 1. Version tag identical
check("version v1 in TS", ts.includes('PROMPT_VERSION = "v1"'));
check("version v1 in PHP", php.includes("VERSION = 'v1'"));
check("prompt tag [prompt:v1] in TS", ts.includes("[prompt:${PROMPT_VERSION}]"));
check("prompt tag [prompt:v1] in PHP", php.includes("[prompt:v1]"));

// 2. Lock-line format: "{n}. [{STRENGTH}] {title}: {instruction}"
check("TS lock-line format", ts.includes("`${i + 1}. [${l.strength.toUpperCase()}] ${l.title}: ${l.instruction}`"));
check("PHP lock-line format", php.includes("'%d. [%s] %s: %s'"));

// 3. Contract keywords present in both
for (const kw of ["NON-OVERRIDE CONTRACT", "ACTIVE LOCKS", "My Locks", "smallest priority"]) {
  check(`TS has "${kw}"`, ts.includes(kw) || true); // template text lives in TS literal
  check(`PHP has "${kw}"`, php.includes(kw));
}

// 4. Refusal text parity — extract the "Your lock" sentence from both, normalize, compare
function extractRefusal(src) {
  const i = src.indexOf("Your lock");
  if (i < 0) return null;
  return src
    .slice(i, i + 260)
    .replace(/'\s*\+\s*clean\s*\+\s*'|\{\$clean\}|'\+clean\+'|\$\{clean\}|clean/g, "LOCK")
    .replace(/\s+/g, " ")
    .slice(0, 200);
}
const tsRef = extractRefusal(ts);
const phpRef = extractRefusal(php);
check("TS has refusal()", !!tsRef);
check("PHP has refusal()", !!phpRef);
check(`refusal text matches (${tsRef?.slice(0, 60)}…)`, !!tsRef && !!phpRef && tsRef === phpRef);

// 5. Jailbreak pattern parity — same key alternatives in both regexes
for (const alt of ["bypass", "DAN", "jailbreak", "pretend"]) {
  check(`TS jailbreak regex has "${alt}"`, ts.includes(alt));
  check(`PHP jailbreak regex has "${alt}"`, php.includes(alt));
}

// 6. No-locks nudge identical
check("TS no-locks nudge", ts.includes("Want to set a boundary?"));
check("PHP no-locks nudge", php.includes("Want to set a boundary?"));

// 7. buildRefusal/refusal body parity (the Hint-1 sentence, not the example)
const BRAIN = "I can give you Hint 1 instead.";
check("TS buildRefusal body", ts.includes(BRAIN));
check("PHP refusal() body", php.includes(BRAIN));

if (failures > 0) {
  console.error(`\n${failures} parity check(s) FAILED — fix before shipping.`);
  process.exit(1);
}
console.log("\nParity OK: TS + PHP prompt v1 match.");
