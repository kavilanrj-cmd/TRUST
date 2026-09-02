"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useHomeContent } from "@/lib/home-content";
import { useAuth } from "@/lib/auth";
import DarkModeToggle from "@/components/DarkModeToggle";

const STAFF_ROLES = ["FOUNDER", "ADMIN", "REVIEWER"];

const NAV_LINKS = [
  { key: "nav.home", href: "/", label: "Home" },
  { key: "nav.about", href: "/about", label: "About Us" },
  { key: "nav.whatWeDo", href: "/what-we-do", label: "What We Do" },
  { key: "nav.howToApply", href: "/how-to-apply", label: "How to Apply" },
  { key: "nav.successStories", href: "/success-stories", label: "Success Stories" },
  { key: "nav.contact", href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const { t } = useHomeContent();
  const { user, isLoading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isStaff = !!user && STAFF_ROLES.includes(user.role);

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

  const initials = (user?.name || user?.email || "U")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = () => {
    setUserMenuOpen(false);
    setOpen(false);
    logout();
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b bg-white transition-all dark:bg-[#0b1020] ${
        scrolled
          ? "border-border shadow-[0_2px_20px_-6px_rgba(22,41,74,0.18)]"
          : "border-transparent"
      }`}
    >
      <div className="container-trust flex h-[76px] items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3" aria-label="Neelakannu Educational Trust">
          <Image
            src="/assets/neelakannu-trust-logo.png"
            alt="Neelakannu Educational Trust logo"
            width={52}
            height={52}
            className="h-12 w-12 shrink-0"
            priority
          />
          <span className="leading-tight">
            <span className="block font-serif text-lg font-bold tracking-tight text-navy dark:text-white">
              Neelakannu
            </span>
            <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-gold-600">
              Educational Trust
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[15px] font-medium text-navy/80 transition hover:text-gold-600 dark:text-white/80 dark:hover:text-gold"
            >
              {t(link.key, link.label)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {!isLoading && !user && (
            <>
              <Link
                href="/login"
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-navy-700 transition hover:text-navy dark:text-white/80 dark:hover:text-white"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg border border-navy/15 px-4 py-2.5 text-sm font-semibold text-navy transition hover:border-gold hover:bg-gold-soft dark:border-white/15 dark:text-white/90 dark:hover:bg-white/10"
              >
                Sign Up
              </Link>
              <DarkModeToggle />
            </>
          )}

          {!isLoading && user && (
            <>
              <Link
                href="/student/application"
                className="btn-gold rounded-xl px-5 py-2.5 text-sm shadow-sm"
              >
                {t("nav.applyLabel", "Apply Now")}
              </Link>
              <DarkModeToggle />

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  className="flex items-center gap-2 rounded-full border border-border py-1.5 pl-1.5 pr-3 transition hover:bg-muted dark:border-white/15"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-white dark:bg-gold dark:text-navy">
                    {initials}
                  </span>
                  <span className="hidden max-w-[110px] truncate text-sm font-medium text-navy sm:block dark:text-white">
                    {user.name || user.email}
                  </span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-muted-foreground">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-border bg-white p-1.5 shadow-lg dark:border-white/15 dark:bg-[#131a2e]">
                      <div className="border-b border-border px-3 py-2 dark:border-white/10">
                        <p className="text-sm font-semibold text-navy dark:text-white">{user.name || "Account"}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <Link
                        href="/student/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="block rounded-md px-3 py-2 text-sm text-navy hover:bg-muted dark:text-white dark:hover:bg-white/10"
                      >
                        My Dashboard
                      </Link>
                      <Link
                        href="/student/application"
                        onClick={() => setUserMenuOpen(false)}
                        className="block rounded-md px-3 py-2 text-sm text-navy hover:bg-muted dark:text-white dark:hover:bg-white/10"
                      >
                        My Application
                      </Link>
                      {isStaff && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="block rounded-md px-3 py-2 text-sm font-semibold text-gold-600 hover:bg-gold/10"
                        >
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="block w-full rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        Log out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <DarkModeToggle />
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border text-navy dark:border-white/15 dark:text-white"
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
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 top-[76px] z-40 overflow-y-auto bg-white lg:hidden dark:bg-[#0b1020]">
          <nav className="container-trust flex flex-col gap-1 py-6" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-navy transition hover:bg-muted dark:text-white dark:hover:bg-white/10"
              >
                {t(link.key, link.label)}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-5 dark:border-white/15">
              {!isLoading && !user && (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="btn-outline dark:border-white/20 dark:bg-transparent dark:text-white"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="btn-gold"
                  >
                    Sign Up
                  </Link>
                </>
              )}

              {!isLoading && user && (
                <>
                  <Link
                    href="/student/application"
                    onClick={() => setOpen(false)}
                    className="btn-gold"
                  >
                    {t("nav.applyLabel", "Apply Now")}
                  </Link>
                  <Link
                    href="/student/dashboard"
                    onClick={() => setOpen(false)}
                    className="btn-outline dark:border-white/20 dark:bg-transparent dark:text-white"
                  >
                    My Dashboard · {user.name || user.email}
                  </Link>
                  {isStaff && (
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-3 text-base font-semibold text-gold-600 transition hover:bg-gold/10 dark:text-gold"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="rounded-lg px-3 py-3 text-left text-base font-medium text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    Log out
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
