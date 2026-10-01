import { HomeClient } from "./HomeClient";
import { publicMetadata } from "@/lib/seo";

/**
 * Landing (/) — server component so the route has full SEO metadata.
 * Interactive auth redirect + sections live in HomeClient.
 * Clean URL: https://controlkey.vercel.app/ (canonical, no trailing-slash dupes).
 */
export const metadata = publicMetadata({
  title: "Control Key — You Control AI, Not the Other Way",
  description:
    "Set locks like 'Teach me, don't solve.' AI can't cross them. Free forever for everyone.",
  path: "/",
});

export default function Home() {
  return <HomeClient />;
}
