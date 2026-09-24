import Image from "next/image";
import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";

/**
 * Hero — Professional Light Mode.
 * Focal point: circular black/silver key logo (brand).
 * No cartoon, no robot. One H1, one CTA.
 */
export function Hero() {
  return (
    <section className="ck-container flex flex-col items-center bg-white py-16 text-center md:py-24">
      <div className="flex flex-col items-center">
        <Image
          src="/logo-circle.svg"
          alt="Control Key — circular black logo with silver key"
          width={160}
          height={160}
          priority
          className="h-[128px] w-[128px] rounded-full object-cover shadow-[0_8px_30px_rgba(17,24,39,0.12)] md:h-[160px] md:w-[160px]"
        />
        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-1.5 text-xs font-bold text-[#64748B]">
          <ShieldCheck size={14} className="text-[#16A34A]" aria-hidden />
          AI stays inside your rules
        </div>
      </div>
      <h1 className="font-heading mt-6 max-w-2xl text-balance text-4xl font-extrabold leading-[1.1] tracking-tight text-[#111827] md:text-5xl">
        You Hold the Key. AI Follows YOUR Rules.
      </h1>
      <p className="mt-4 max-w-md text-lg leading-relaxed text-[#64748B]">
        Set locks like &ldquo;Teach me, don&rsquo;t solve.&rdquo; AI can&rsquo;t
        cross them. Free forever.
      </p>
      <Link
        href="/onboarding"
        className="ck-btn-primary mt-8 w-full sm:w-auto"
      >
        <Lock size={18} aria-hidden className="mr-2" />
        Start Free — Get My Key
      </Link>
      <p className="mt-3 text-xs font-medium text-[#64748B]">
        Free • No card • Your key stays yours
      </p>
    </section>
  );
}
