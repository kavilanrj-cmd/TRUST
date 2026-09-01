"use client";

import { useHomeContent } from "@/lib/home-content";
import { Reveal } from "./Reveal";

export function FinalCta() {
  const { t } = useHomeContent();
  return (
    <section id="final-cta" aria-label="Take the next step" className="bg-white">
      <div className="container-trust py-16 sm:py-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy to-navy-700 px-8 py-16 text-center shadow-2xl sm:px-16">
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold/20 blur-2xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-2xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(640px_320px_at_50%_-25%,rgba(255,255,255,0.08),transparent_60%)]"
              aria-hidden="true"
            />

            <p className="font-serif text-xs uppercase tracking-[0.28em] text-gold">
              {t("home.hero.quote", "Empowering education, enabling dreams")}
            </p>
            <h2 className="mx-auto mt-4 max-w-3xl font-serif text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              {t("home.finalCta.title", "Your Education. Your Future. Our Support.")}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-white/90">
              {t(
                "home.finalCta.description",
                "Take the first step today and apply for a scholarship with Neelakannu Educational Trust."
              )}
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <a
                href="/student/application"
                className="inline-flex items-center gap-2 rounded-lg bg-gold px-7 py-3.5 text-sm font-semibold text-navy shadow-lg transition hover:bg-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-600 focus-visible:ring-offset-2 ring-offset-navy"
              >
                {t("home.finalCta.primaryButton", "Apply Now")}
              </a>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 ring-offset-navy"
              >
                {t("home.finalCta.secondaryButton", "Contact Us")}
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
