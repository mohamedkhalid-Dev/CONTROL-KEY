import { PRIVATE_ROUTES, SITE_URL } from "@/lib/seo";

/**
 * Robots — allows public pages, blocks private app screens,
 * and points crawlers at the sitemap. Served at /robots.txt.
 * Mirrored in public/robots.txt as a static fallback.
 */
export async function GET() {
  const disallow = PRIVATE_ROUTES.map((p) => `Disallow: ${p}`).join("\n");
  const body = `User-agent: *\nAllow: /\n${disallow}\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
