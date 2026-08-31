"use client";

import Image from "next/image";
import Link from "next/link";
import { useHomeContent } from "@/lib/home-content";

const QUICK_LINKS = [
  { label: "Home", href: "/#home" },
  { label: "About Us", href: "/about" },
  { label: "Scholarship", href: "/scholarship" },
  { label: "How to Apply", href: "/#how-to-apply" },
  { label: "Success Stories", href: "/#success-stories" },
  { label: "News & Events", href: "/announcements" },
];

const DISCOVER_LINKS = [
  { label: "Our Vision & Mission", href: "/vision-mission" },
  { label: "Check Eligibility", href: "/#eligibility" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy Policy", href: "/contact" },
  { label: "Terms & Conditions", href: "/contact" },
];

export function SiteFooter() {
  const { t } = useHomeContent();
  const year = new Date().getFullYear();

  return (
    <footer id="contact" className="bg-navy text-white">
      <div className="container-trust py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/#home" className="flex items-center gap-3">
              <Image
                src="/neelakannu-logo.svg"
                alt="Neelakannu Educational Trust logo"
                width={54}
                height={54}
                className="h-14 w-14"
              />
              <span className="leading-tight">
                <span className="block font-serif text-lg font-bold tracking-tight text-white">Neelakannu</span>
                <span className="block text-xs font-bold uppercase tracking-[0.18em] text-gold">
                  Educational Trust
                </span>
              </span>
            </Link>
            <p className="mt-5 text-sm leading-relaxed text-white/70">
              {t(
                "home.footer.description",
                "Neelakannu Educational Trust empowers deserving students through scholarships and financial assistance."
              )}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-gold">Quick Links</h3>
            <ul className="mt-5 space-y-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-white/80 transition hover:text-gold">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Discover */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-gold">Discover</h3>
            <ul className="mt-5 space-y-3">
              {DISCOVER_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-white/80 transition hover:text-gold">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-gold">Contact</h3>
            <ul className="mt-5 space-y-4 text-sm text-white/80">
              <li className="flex gap-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-5 w-5 shrink-0 text-gold">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span>
                  No. 1/82, Ayyanar Street, Shakthi Ayyanar Nagar, Thiruvanchery, Chennai - 600 126, Tamil Nadu, India
                </span>
              </li>
              <li className="flex gap-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-5 w-5 shrink-0 text-gold">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <a href="mailto:neelakannueducationaltrust@gmail.com" className="transition hover:text-gold">
                  neelakannueducationaltrust@gmail.com
                </a>
              </li>
              <li className="flex gap-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-5 w-5 shrink-0 text-gold">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                <span>94443 27336</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-trust flex flex-col items-center justify-between gap-3 py-6 text-center sm:flex-row sm:text-left">
          <p className="text-sm text-white/60">© {year} Neelakannu Educational Trust. All rights reserved.</p>
          <p className="text-xs text-white/50">Founded by Prof. Dr. K. Chidambaram</p>
        </div>
      </div>
    </footer>
  );
}
