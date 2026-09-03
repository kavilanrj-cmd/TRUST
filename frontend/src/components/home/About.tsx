"use client";

import { useHomeContent } from "@/lib/home-content";
import { Reveal } from "./Reveal";

export function About() {
  const { t } = useHomeContent();
  return (
    <section id="about" className="bg-white dark:bg-[#0d1224]">
      <div className="container-trust py-16 sm:py-20 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Content column */}
          <Reveal>
            <div>
              <span className="eyebrow">{t("home.about.eyebrow", "Who We Are")}</span>
              <h2 className="h2-section mt-5">{t("home.about.title", "A Trust Built on Education and Compassion")}</h2>
              <p className="mt-5 leading-relaxed text-muted-foreground">
                {t(
                  "home.about.description",
                  "Neelakannu Educational Trust was established to support meritorious yet economically challenged students in pursuing their educational dreams. We believe every child deserves the opportunity to learn, grow and succeed."
                )}
              </p>

              <div className="mt-9 rounded-2xl border border-gold/25 bg-gold-soft p-6 dark:border-gold/30 dark:bg-[#1d2740]">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-600 dark:text-gold">
                  {t("home.about.visionTitle", "Our Vision")}
                </p>
                <p className="mt-3 font-serif text-xl font-bold leading-snug text-navy dark:text-slate-200">
                  To build an inclusive and equitable society in which every individual, regardless of social, economic, or physical limitations, has access to education, opportunities for holistic development and the means to lead a dignified and productive life.
                </p>
                <p className="mt-4 text-sm font-semibold text-navy-700 dark:text-gold">
                  &ldquo;{t("home.hero.quote", "Empowering education, enabling dreams")}&rdquo;
                </p>
              </div>

              <div className="mt-6 rounded-2xl border border-gold/25 bg-gold-soft p-6 dark:border-gold/30 dark:bg-[#1d2740]">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-600 dark:text-gold">
                  Our Mission
                </p>
                <p className="mt-3 font-serif text-xl font-bold leading-snug text-navy dark:text-slate-200">
                  To promote inclusive education, social upliftment, healthcare access, and cultural enrichment by establishing and supporting institutions, programs, and initiatives that empower marginalized communities and contribute to sustainable national development.
                </p>
              </div>

              <a href="#scholarships" className="btn-primary mt-9">
                Explore Scholarships
              </a>
            </div>
          </Reveal>

          {/* Visual column */}
          <Reveal delay={120} className="lg:justify-self-end">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy to-navy-700 p-10 shadow-2xl">
              <div
                className="pointer-events-none absolute -bottom-12 -right-12 h-56 w-56 rounded-full bg-gold/20 blur-2xl"
                aria-hidden="true"
              />
              <svg viewBox="0 0 200 120" fill="none" className="mx-auto w-44 text-gold">
                <path d="M100 12 L176 50 L100 88 L24 50 Z" fill="currentColor" opacity="0.95" />
                <path d="M38 60 L38 84 C38 96 68 104 100 104 C132 104 162 96 162 84 L162 60" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" fill="none" />
                <path d="M176 50 L176 86" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
              </svg>
              <p className="mt-8 text-center font-serif text-2xl italic leading-snug text-white">
                &ldquo;Education is the most powerful weapon which you can use to change the world.&rdquo;
              </p>
              <p className="mt-4 text-center text-sm font-semibold uppercase tracking-[0.18em] text-gold">
                Nurturing Potential
              </p>

              <div className="mx-auto mt-8 grid max-w-xs gap-3">
                <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <p className="font-semibold text-white">Every deserving student</p>
                  <p className="text-sm text-white/75">deserves access to quality education</p>
                </div>
                <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <p className="font-semibold text-white">Regardless of background</p>
                  <p className="text-sm text-white/75">opportunity to reach full potential</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
