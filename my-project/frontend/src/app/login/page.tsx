import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { canonical, privateMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Log in — Control Key",
  description: "Log in to sync your chats and locks in the cloud.",
  alternates: { canonical: canonical("/login") },
  robots: privateMetadata,
};

/** /login — private app page (noindex, see robots.txt). */
export default function LoginPage() {
  return (
    <main className="ck-container flex min-h-screen flex-col items-center py-10">
      <Link href="/" className="text-sm font-bold text-[#4F46E5]">
        ← Back home
      </Link>
      <p className="mt-2 text-xs font-semibold text-slate-500">
        Free • No card • Your OpenRouter key stays yours
      </p>
      <div className="mt-6 flex w-full justify-center">
        <Suspense fallback={<p className="py-20 text-center">Opening login…</p>}>
          <LoginForm />
        </Suspense>
      </div>
      <p className="mt-6 max-w-sm text-center text-xs text-slate-400">
        Under 13? Ask a parent to help make your account. We never sell emails.
      </p>
    </main>
  );
}
