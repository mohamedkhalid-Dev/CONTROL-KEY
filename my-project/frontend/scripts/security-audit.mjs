/**
 * security-audit.mjs — machine checks for the 4 monitor sub-agents.
 * Run: npm run security:audit (from my-project/frontend).
 * Fails (exit 1) on High/Med signals; Low signals warn only.
 * Never prints secret values — presence only.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => {
  try { return readFileSync(join(root, p), "utf8"); } catch { return null; }
};

const findings = [];
const flag = (sev, where, msg) => findings.push({ sev, where, msg });

// 1. FRONTEND: open redirect guard
const login = read("src/components/auth/LoginForm.tsx") ?? "";
if (login.includes('params.get("next")') && !login.includes("safeNextPath") && !login.includes('startsWith("/")')) {
  flag("Med", "LoginForm.tsx", "next param not validated — use safeNextPath()");
}

// 2. FRONTEND: draft must not persist key
const wizard = read("src/components/onboarding/OnboardingWizard.tsx") ?? "";
if (wizard.includes("draftStorage.set({ name, age, key:")) {
  flag("Med", "OnboardingWizard.tsx", "draft persists key — store name/age only");
}

// 3. FRONTEND: CSP checks
const csp = read("next.config.mjs") ?? "";
if (csp.includes("unsafe-eval")) flag("Low", "next.config.mjs", "CSP allows unsafe-eval — trial removal");
if (!csp.includes("NEXT_PUBLIC_BACKEND_URL") && csp.includes("connect-src") && !/connect-src[^;]*backend/i.test(csp)) {
  flag("Med", "next.config.mjs", "connect-src omits backend origin — prod /log blocked");
}

// 4. FRONTEND: markdown link allowlist
const bubble = read("src/components/chat/MessageBubble.tsx") ?? "";
if (bubble.includes("<a href={href}") && !bubble.includes("safeHref") && !bubble.includes("https?")) {
  flag("Low", "MessageBubble.tsx", "link href has no https allowlist — use safeHref()");
}

// 5. SUPABASE: deleteRule scoping
const rules = read("src/lib/supabase/rules.ts") ?? "";
if (rules.includes('.delete().eq("id", id)') && !rules.includes('.eq("user_id"')) {
  const scoped = (rules.match(/\.eq\("user_id"/g) ?? []).length;
  if (scoped < 2) flag("Low", "supabase/rules.ts", "deleteRule scopes by id only — add .eq(user_id)");
}

// 6. SECRETS: no service_role in frontend src (High)
// Ignores warning comments ("NEVER service_role") — flags real usage only.
for (const f of ["src/lib/supabaseClient.ts", "src/lib/supabase/client.ts"]) {
  const c = read(f) ?? "";
  const codeLines = c.split("\n").filter((l) => !/NEVER|publishable|anon.*only|warning/i.test(l));
  const code = codeLines.join("\n");
  if (/SUPABASE_SERVICE|SERVICE_ROLE.*createClient|createClient\([^)]*service/i.test(code)
    || /process\.env\.[A-Z_]*(SERVICE_ROLE|SERVICE_KEY)/.test(code)) {
    flag("High", f, "server secret in browser bundle");
  }
}

// 7. BACKEND pointers (checked in CI where backend exists)
const backendEnvExample = (() => {
  try { return readFileSync(join(root, "../../backend/.env.example"), "utf8"); } catch { return null; }
})();
if (backendEnvExample && backendEnvExample.includes("APP_DEBUG=true")) {
  flag("Med", "backend/.env.example", "APP_DEBUG=true in template — set false for prod");
}

// 8. DEPLOY: .next should not ship with audit
if (existsSync(join(root, ".next"))) {
  flag("Low", ".next/", "build output present — delete before sharing, let Vercel rebuild");
}

const med = findings.filter((f) => f.sev !== "Low");
for (const f of findings) console.log(`[${f.sev}] ${f.where} - ${f.msg}`);
console.log(med.length === 0 ? "security:audit PASS" : `security:audit FAIL (${med.length} Med+)`);
process.exit(med.length === 0 ? 0 : 1);
