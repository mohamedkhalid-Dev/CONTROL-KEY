/**
 * Security headers (Stage 6 hardening).
 * CSP is pragmatic: Next.js inlines runtime scripts/styles and KaTeX needs
 * inline styles + data: fonts, so script/style allow 'unsafe-inline'.
 * Protection still gained: no plugins, no framing, limited connect targets,
 * no MIME sniffing. Tighten further once fully static-exported.
 *
 * connect-src includes the Laravel backend origin derived from
 * NEXT_PUBLIC_BACKEND_URL (same default as lib/report.ts) so prod /log
 * and /api calls are not blocked. Vercel bakes this at build time.
 */
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000/api";
let backendOrigin = "";
try {
  if (backendUrl.startsWith("http")) backendOrigin = new URL(backendUrl).origin;
} catch {
  backendOrigin = "";
}
const connectSrc = [
  "'self'",
  "https://openrouter.ai",
  "https://*.supabase.co",
  "wss://*.supabase.co",
  backendOrigin,
]
  .filter(Boolean)
  .join(" ");

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob:",
  `connect-src ${connectSrc}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Clean URLs: lowercase hyphenated routes, no .html, no trailing slash.
  // Canonical tags (see lib/seo.ts) point to the slash-less version so
  // /faq/ never splits ranking with /faq.
  trailingSlash: false,
  async redirects() {
    return [
      // Normalize common trailing-slash dupes to the canonical clean URL.
      { source: "/faq/", destination: "/faq", permanent: true },
      { source: "/privacy/", destination: "/privacy", permanent: true },
      { source: "/terms/", destination: "/terms", permanent: true },
      { source: "/parents/", destination: "/parents", permanent: true },
      { source: "/guide/get-key/", destination: "/guide/get-key", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        // Cache crawlers' favorite files at the edge; pages stay dynamic.
        source: "/(sitemap.xml|robots.txt)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, s-maxage=86400" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // HSTS only helps over HTTPS — harmless locally, enforced in prod.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
