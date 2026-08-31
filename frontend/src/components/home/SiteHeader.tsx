"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About Us", href: "#about" },
  { label: "Scholarships", href: "#scholarships" },
  { label: "How to Apply", href: "#how-to-apply" },
  { label: "Success Stories", href: "#success-stories" },
  { label: "News & Events", href: "#news" },
  { label: "Contact", href: "#contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
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
      className={`sticky top-0 z-50 w-full border-b transition-colors ${
        scrolled ? "border-border bg-white/95 backdrop-blur" : "border-transparent bg-white"
      }`}
    >
      <div className="container-trust flex h-20 items-center justify-between gap-4">
        <a href="#home" className="flex items-center gap-3">
          <Image
            src="/neelakannu-logo.svg"
            alt="Neelakannu Educational Trust logo"
            width={48}
            height={48}
            className="h-12 w-12"
            priority
          />
          <span className="leading-tight">
            <span className="block font-serif text-lg font-bold tracking-tight text-navy">
              Neelakannu
            </span>
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-gold-600">
              Educational Trust
            </span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-navy/80 transition hover:text-gold-600"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-navy transition hover:bg-muted"
          >
            Login
          </Link>
          <a
            href="#apply"
            className="btn-gold rounded-lg px-5 py-2.5 text-sm font-semibold"
          >
            Apply Now
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
        <div className="fixed inset-0 top-20 z-40 overflow-y-auto bg-white lg:hidden">
          <nav className="container-trust flex flex-col gap-1 py-6" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-navy transition hover:bg-muted"
              >
                {link.label}
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
                href="#apply"
                onClick={() => setOpen(false)}
                className="btn-gold"
              >
                Apply Now
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
