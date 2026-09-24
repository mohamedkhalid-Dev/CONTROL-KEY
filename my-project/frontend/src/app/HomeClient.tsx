"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { TrustStrip } from "@/components/landing/TrustStrip";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LiveDemo } from "@/components/landing/LiveDemo";
import { LocksPreview } from "@/components/landing/LocksPreview";
import { Testimonials } from "@/components/landing/Testimonials";
import { Faq } from "@/components/landing/Faq";
import { Footer } from "@/components/landing/Footer";
import { useAuth } from "@/lib/auth";

/**
 * STAGE 2 — Landing that SELLS (Hybrid A+B).
 * Logged-out only: signed-in visitors go straight to /chat.
 * Above fold: clean hero only. Below: live demo proof + custom locks.
 * Custom-only: no DB template gallery — user writes own locks.
 *
 * Client component so page.tsx can stay a server component
 * and export SEO metadata (canonical + OG for "/").
 */
export function HomeClient() {
  const router = useRouter();
  const { user, loading } = useAuth();

  React.useEffect(() => {
    if (!loading && user) router.replace("/chat");
  }, [loading, user, router]);

  // Signed in → hand off to the app instead of flashing the landing page.
  if (!loading && user) {
    return (
      <main className="ck-container flex min-h-screen items-center justify-center py-10 text-center">
        <p className="text-sm font-bold text-slate-600">Opening your Control Room…</p>
      </main>
    );
  }

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustStrip />
        <HowItWorks />
        <LiveDemo />
        <LocksPreview />
        <Testimonials />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
