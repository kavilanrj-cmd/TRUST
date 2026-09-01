"use client";

import { useHomeContent } from "@/lib/home-content";
import { Reveal } from "./Reveal";

export function FeaturedCta() {
  const { t } = useHomeContent();
  return (
    <section id="apply" aria-label="Apply for scholarship" className="bg-white">
      <div className="container-trust py-16 sm:py-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy to-navy-700 px-8 py-14 text-center shadow-xl sm:px-14">
            {/* decorative accents */}
            <div
              className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-gold/20 blur-2xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-2xl"
              aria-hidden="true"
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_300px_at_50%_-20%,rgba(255,255,255,0.08),transparent_60%)]" aria-hidden="true" />

            <span className="inline-flex items-center rounded-full bg-gold px-4 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-navy">
              Applications Open
            </span>
            <h2 className="mx-auto mt-5 max-w-2xl font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {t("home.featuredCta.title", "Ready to take the next step?")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/90">
              {t(
                "home.featuredCta.description",
                "Apply for a scholarship today and begin your journey towards a brighter educational future."
              )}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href="#eligibility"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-navy shadow-md transition hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2"
              >
                {t("home.featuredCta.primaryButton", "Check Eligibility")}
              </a>
              <a
                href="/student/application"
                className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-navy shadow-md transition hover:bg-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-600 focus-visible:ring-offset-2 ring-offset-navy"
              >
                {t("home.featuredCta.secondaryButton", "Apply Now")}
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
