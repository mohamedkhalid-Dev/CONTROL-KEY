"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { safeNextPath } from "@/lib/securityMonitor";

/**
 * Exchanges the PKCE code from Supabase email links
 * (e.g. https://controlkey-gbqs40uak-show16.vercel.app/auth/callback?code=...).
 * Uses the browser client so the stored code verifier in localStorage matches.
 */
export function CallbackClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [message, setMessage] = React.useState("Confirming your email…");

  React.useEffect(() => {
    async function run() {
      const code = params.get("code");
      const next = safeNextPath(params.get("next"), "/login?verified=1");
      if (!code) {
        router.replace("/login?error=confirm-failed");
        return;
      }
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage("Confirm link expired. Redirecting…");
          router.replace("/login?error=confirm-failed");
          return;
        }
        router.replace(next);
      } catch {
        router.replace("/login?error=confirm-failed");
      }
    }
    void run();
  }, [params, router]);

  return <p className="text-sm text-slate-500">{message}</p>;
}
