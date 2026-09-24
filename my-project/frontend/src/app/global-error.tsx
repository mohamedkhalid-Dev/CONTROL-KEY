"use client";

/**
 * Root crash fallback — renders when even layout fails.
 * Must be self-contained: no fonts, no theme, no imports that can crash.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", textAlign: "center", padding: 60 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#F1F5F9",
          }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        </span>
        <h1>Something went wrong</h1>
        <p>Please reload — your data is saved in your browser.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
          <button
            type="button"
            onClick={reset}
            style={{ padding: "14px 28px", borderRadius: 12, background: "#4F46E5", color: "#fff", border: 0, fontWeight: 800 }}
          >
            Retry
          </button>
          <a href="/" style={{ padding: 14, fontWeight: 700 }}>
            Go home
          </a>
        </div>
      </body>
    </html>
  );
}
