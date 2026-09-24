import Link from "next/link";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata({
  title: "How to Get a Free OpenRouter Key — Control Key",
  description: "Get a free AI key in 2 minutes with pictures. Then paste it into Control Key.",
  path: "/guide/get-key",
});

const STEPS = [
  {
    title: "1. Make a free account",
    text: "Open openrouter.ai and click Sign In. Use Google or email. No card needed.",
  },
  {
    title: "2. Open the Keys page",
    text: "Go to openrouter.ai/keys. This is where all keys live.",
  },
  {
    title: "3. Click Create Key",
    text: "Give it any name like My Study Key. Leave credit at $0. Free models still work.",
  },
  {
    title: "4. Copy and paste",
    text: "Copy the key starting with sk-or-. Paste it in Step 3 of onboarding. Spaces cut off alone.",
  },
];

/** Helper page for age 10+ — short words, big steps. */
export default function GetKeyGuidePage() {
  return (
    <main className="ck-container max-w-2xl py-12">
      <Link href="/onboarding?step=3" className="text-sm font-bold text-[#4F46E5]">
        ← Back to onboarding
      </Link>
      <h1 className="font-heading mt-4 text-3xl font-extrabold text-[#0F172A] dark:text-white">
        Get your free AI key in 2 min
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        Like a library card for robots. Free. No card.
      </p>

      <div className="mt-8 space-y-4">
        {STEPS.map((s) => (
          <div key={s.title} className="ck-card p-6">
            <h2 className="font-heading font-bold text-[#0F172A] dark:text-white">
              {s.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {s.text}
            </p>
          </div>
        ))}
      </div>

      <div className="ck-card mt-6 border-yellow-200 bg-yellow-50 p-5 text-sm text-yellow-900 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-100">
        <strong>Under 13?</strong> Ask a parent to click Create Key with you.
        Then you do the rest alone.
      </div>

      <div className="ck-card mt-4 p-5 text-sm text-slate-600 dark:text-slate-300">
        <strong>Video coming soon.</strong> For now follow the 4 boxes above.
        Stuck? Email hello@controlkey.app
      </div>

      <a
        href="https://openrouter.ai/keys"
        target="_blank"
        rel="noopener noreferrer"
        className="ck-btn-primary mt-8 w-full"
      >
        Open openrouter.ai/keys ↗
      </a>
      <Link
        href="/onboarding?step=3"
        className="mt-3 flex min-h-[48px] items-center justify-center text-sm font-bold text-[#4F46E5]"
      >
        I have my key — go back →
      </Link>
    </main>
  );
}
