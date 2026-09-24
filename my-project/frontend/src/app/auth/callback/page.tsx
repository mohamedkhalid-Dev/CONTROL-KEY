import type { Metadata } from "next";
import { Suspense } from "react";
import { canonical, privateMetadata } from "@/lib/seo";
import { CallbackClient } from "./CallbackClient";

export const metadata: Metadata = {
  title: "Confirming email… — Control Key",
  description: "Confirming your email. You will be redirected shortly.",
  alternates: { canonical: canonical("/auth/callback") },
  robots: privateMetadata,
};

/**
 * /auth/callback — exchanges Supabase PKCE ?code= from verification emails,
 * then forwards to ?next= (default /login?verified=1).
 * Private route: never indexed.
 */
export default function AuthCallbackPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <Suspense fallback={<p className="text-sm text-slate-500">Confirming your email…</p>}>
        <CallbackClient />
      </Suspense>
    </main>
  );
}
