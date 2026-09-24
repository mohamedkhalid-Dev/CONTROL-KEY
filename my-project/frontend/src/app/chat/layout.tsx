import type { Metadata } from "next";
import { canonical, privateMetadata } from "@/lib/seo";

/** /chat is a private app screen — never indexed (see robots.txt). */
export const metadata: Metadata = {
  title: "My Control Room — Control Key",
  description: "Your private AI study coach. Chats and locks stay yours.",
  alternates: { canonical: canonical("/chat") },
  robots: privateMetadata,
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
