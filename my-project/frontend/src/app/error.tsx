"use client";

import * as React from "react";
import Link from "next/link";
import { Flag, Home, RotateCcw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { genErrorId, reportError } from "@/lib/report";

/**
 * Route error boundary (Error Matrix #20).
 * Professional alert visual + error ID + Go home / Retry / Report. Never raw stacks.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [id] = React.useState(() => genErrorId());
  const [reported, setReported] = React.useState(false);

  React.useEffect(() => {
    // Log ID + digest for debugging (no PII, no keys, no chat text).
    console.error(`[${id}]`, error.digest ?? error.message);
  }, [id, error]);

  async function report() {
    const ok = await reportError(id, "500");
    setReported(true);
    toast.success(ok ? "Reported — thanks! We'll fix it." : "Couldn't send — please try again later.", {
      duration: 3000,
    });
  }

  return (
    <main className="ck-container flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <TriangleAlert size={30} className="text-slate-500" aria-hidden />
      </span>
      <h1 className="font-heading mt-4 text-3xl font-extrabold text-[#0F172A] dark:text-white">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-slate-500">
        Nothing of yours is lost — chats and locks are saved. Error ID:{" "}
        <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-sm dark:bg-slate-800">{id}</code>
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={reset} className="ck-btn-primary">
          <RotateCcw size={18} aria-hidden className="mr-2" />
          Retry
        </button>
        <Link
          href="/"
          className="inline-flex h-14 items-center justify-center rounded-2xl border px-8 text-base font-bold"
        >
          <Home size={18} aria-hidden className="mr-2" />
          Go home
        </Link>
        <button
          type="button"
          onClick={report}
          disabled={reported}
          className="inline-flex h-14 items-center justify-center rounded-2xl border px-8 text-base font-bold disabled:opacity-50"
        >
          <Flag size={18} aria-hidden className="mr-2" />
          {reported ? "Reported" : "Report"}
        </button>
      </div>
    </main>
  );
}
