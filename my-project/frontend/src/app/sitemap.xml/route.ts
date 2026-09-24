import { PUBLIC_ROUTES, SITE_URL } from "@/lib/seo";

/**
 * Sitemap — public pages only (/chat, /onboarding, /login are private).
 * Single source of truth: PUBLIC_ROUTES in lib/seo.ts.
 * Served at /sitemap.xml with lastmod so crawlers know what's fresh.
 */
export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  const urls = PUBLIC_ROUTES.map(
    ({ path, priority }) =>
      `  <url><loc>${SITE_URL}${path === "/" ? "/" : path}</loc>` +
      `<lastmod>${today}</lastmod><changefreq>weekly</changefreq>` +
      `<priority>${priority.toFixed(1)}</priority></url>`
  ).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
