import Link from "next/link";
import type { Metadata } from "next";
import { publicMetadata } from "@/lib/seo";

/** Shared shell for legal/help pages (privacy, terms, parents, faq). */
export function LegalShell({
  icon,
  title,
  updated,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="ck-container max-w-3xl py-12">
      <Link href="/" className="text-sm font-bold text-[#4F46E5] hover:underline">
        ← Back home
      </Link>
      {icon && (
        <div
          aria-hidden
          className="mt-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500"
        >
          {icon}
        </div>
      )}
      <h1 className="font-heading mt-3 text-3xl font-extrabold text-[#0F172A] dark:text-white">{title}</h1>
      <p className="mt-1 text-xs text-slate-400">Last updated: {updated} · Short sentences, no jargon.</p>
      <div className="prose mt-6 max-w-none text-[15px] text-slate-700 dark:text-slate-200">{children}</div>
      <div className="mt-10 flex flex-col gap-2 sm:flex-row">
        <Link href="/onboarding" className="ck-btn-primary flex-1">
          Start Free — Get My Key
        </Link>
      </div>
    </main>
  );
}

export const legalMetadata = (title: string, description: string, path: string): Metadata =>
  publicMetadata({ title: `${title} — Control Key`, description, path });
