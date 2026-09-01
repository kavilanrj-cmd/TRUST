"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useHomeContent } from "@/lib/home-content";

const NAV_LINKS = [
  { key: "nav.home", href: "#home" },
  { key: "nav.about", href: "#about" },
  { key: "nav.whatWeDo", href: "#what-we-do" },
  { key: "nav.scholarships", href: "#scholarships" },
  { key: "nav.howToApply", href: "#how-to-apply" },
  { key: "nav.successStories", href: "#success-stories" },
  { key: "nav.contact", href: "#contact" },
];

export function SiteHeader() {
  const { t } = useHomeContent();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b bg-white transition-all ${
        scrolled
          ? "border-border shadow-[0_2px_20px_-6px_rgba(22,41,74,0.18)]"
          : "border-transparent"
      }`}
    >
      <div className="container-trust flex h-[76px] items-center justify-between gap-4">
        <a href="#home" className="flex items-center gap-3" aria-label="Neelakannu Educational Trust">
          <Image
            src="/assets/neelakannu-trust-logo.png"
            alt="Neelakannu Educational Trust logo"
            width={52}
            height={52}
            className="h-12 w-12 shrink-0"
            priority
          />
          <span className="leading-tight">
            <span className="block font-serif text-lg font-bold tracking-tight text-navy">
              Neelakannu
            </span>
            <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-gold-600">
              Educational Trust
            </span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[15px] font-medium text-navy/80 transition hover:text-gold-600"
            >
              {t(link.key, link.href.slice(1).replace(/-/g, " "))}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-navy-700 transition hover:text-navy"
          >
            Login
          </Link>
          <a
            href="/student/application"
            className="btn-gold rounded-lg px-6 py-2.5 text-sm shadow-sm"
          >
            {t("nav.applyLabel", "Apply Now")}
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border text-navy lg:hidden"
        >
          {open ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 top-[76px] z-40 overflow-y-auto bg-white lg:hidden">
          <nav className="container-trust flex flex-col gap-1 py-6" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-navy transition hover:bg-muted"
              >
                {t(link.key, link.href.slice(1).replace(/-/g, " "))}
              </a>
            ))}
            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-5">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="btn-outline"
              >
                Login
              </Link>
              <a
                href="/student/application"
                onClick={() => setOpen(false)}
                className="btn-gold"
              >
                {t("nav.applyLabel", "Apply Now")}
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
