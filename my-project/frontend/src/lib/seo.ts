import type { Metadata } from "next";

/**
 * Central SEO config (DRY — single source of truth).
 * Site URL comes from NEXT_PUBLIC_SITE_URL so preview/prod stay correct.
 * Falls back to the production domain when the env var is unset.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
  "https://controlkey-gbqs40uak-show16.vercel.app";

export const SITE_NAME = "Control Key";
export const SITE_TAGLINE = "You Hold the Key. AI Follows YOUR Rules.";
export const SITE_DESCRIPTION =
  "Set locks like 'Teach me, don't solve.' AI can't cross them. Free forever for students 10-20.";
export const OG_IMAGE = "/og-image.png"; // 1200x630 social card in public/
export const SITE_LOCALE = "en_US";

/** Public (indexable) clean URLs — private app routes excluded. */
export const PUBLIC_ROUTES: { path: string; priority: number }[] = [
  { path: "/", priority: 1.0 },
  { path: "/guide/get-key", priority: 0.8 },
  { path: "/faq", priority: 0.7 },
  { path: "/privacy", priority: 0.5 },
  { path: "/terms", priority: 0.5 },
  { path: "/parents", priority: 0.7 },
];

/** Private app routes — never indexed, disallowed in robots.txt. */
export const PRIVATE_ROUTES = ["/chat", "/onboarding", "/login", "/auth/callback", "/api"];

/** Canonical URL helper — keeps one clean URL per page (no trailing slash). */
export function canonical(path: string): string {
  const clean = path === "/" ? "/" : path.replace(/\/$/, "");
  return `${SITE_URL}${clean}`;
}

type PublicMetaArgs = {
  title: string;
  description: string;
  path: string;
};

/** Shared metadata builder for public pages (canonical + OG + Twitter). */
export function publicMetadata({ title, description, path }: PublicMetaArgs): Metadata {
  const url = canonical(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      type: "website",
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: `${SITE_NAME} — ${SITE_TAGLINE}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
    robots: { index: true, follow: true },
  };
}

/** Metadata for private app screens — never indexed. */
export const privateMetadata: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
};
