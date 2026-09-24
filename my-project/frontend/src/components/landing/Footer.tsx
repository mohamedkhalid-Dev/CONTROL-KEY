import Image from "next/image";
import Link from "next/link";
import { APP_VERSION } from "@/lib/version";

/** Minimal footer — privacy, guide, contact. Light Mode only. */
export function Footer() {
  return (
    <footer className="border-t border-[#E2E8F0] bg-white">
      <div className="ck-container flex flex-col items-center gap-6 py-10 md:flex-row md:justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/logo-circle.svg"
            alt="Control Key logo"
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
          />
          <span className="font-heading font-extrabold text-[#111827]">
            Control Key
          </span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-[#64748B]">
          <Link href="/guide/get-key" className="hover:text-[#2563EB]">
            Get a key
          </Link>
          <Link href="/privacy" className="hover:text-[#2563EB]">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-[#2563EB]">
            Terms
          </Link>
          <Link href="/faq" className="hover:text-[#2563EB]">
            FAQ
          </Link>
          <Link href="/parents" className="hover:text-[#2563EB]">
            Parents
          </Link>
          <a href="mailto:hello@controlkey.app" className="hover:text-[#2563EB]">
            Contact
          </a>
        </nav>
        <p className="text-xs text-[#64748B]">Made for students · Free forever · v{APP_VERSION}</p>
      </div>
    </footer>
  );
}
