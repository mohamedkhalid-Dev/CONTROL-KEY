"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth";

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#examples", label: "My Locks" },
  { href: "#faq", label: "FAQ" },
];

/** Sticky minimal navbar — max 3 links + CTA. Mobile menu with X close. */
export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const loggedIn = !!user;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open ]);

  return (
    <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-white/90 backdrop-blur">
      <nav
        aria-label="Main"
        className="ck-container flex h-16 items-center justify-between"
      >
        <Link href="/" className="flex items-center gap-2.5" aria-label="Control Key home">
          <Image
            src="/logo-circle.svg"
            alt="Control Key logo"
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover"
            priority
          />
          <span className="font-heading text-lg font-extrabold text-[#111827]">
            Control Key
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-semibold text-[#64748B] hover:text-[#2563EB]"
            >
              {l.label}
            </a>
          ))}
          <Link
            href={loggedIn ? "/chat" : "/onboarding"}
            className="ck-btn-primary h-11 min-h-[44px] px-6 text-sm"
          >
            {loggedIn ? "My Control Room" : "Start Free"}
          </Link>
        </div>

        <button
          className="flex h-11 w-11 items-center justify-center rounded-xl text-[#111827] hover:bg-[#F8FAFC] md:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-[#E2E8F0] bg-white px-6 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-base font-semibold text-[#111827] hover:bg-[#F8FAFC]"
              >
                {l.label}
              </a>
            ))}
            <Link
              href={loggedIn ? "/chat" : "/onboarding"}
              onClick={() => setOpen(false)}
              className="ck-btn-primary mt-2 w-full"
            >
              {loggedIn ? "My Control Room" : "Start Free — Get My Key"}
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="mt-2 flex h-11 items-center justify-center gap-2 text-sm font-semibold text-[#64748B]"
            >
              <X size={18} /> Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
