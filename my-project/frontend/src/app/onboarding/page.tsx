import { Suspense } from "react";
import type { Metadata } from "next";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { canonical, privateMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Get Started — Control Key",
  description: "Log in, enter your name, age, and free OpenRouter key. 4 steps to your Control Room.",
  alternates: { canonical: canonical("/onboarding") },
  robots: privateMetadata,
};

/** useSearchParams needs a Suspense boundary in App Router. */
export default function OnboardingPage() {
  return (
    <Suspense fallback={<main className="ck-container py-20 text-center">Loading…</main>}>
      <OnboardingWizard />
    </Suspense>
  );
}
