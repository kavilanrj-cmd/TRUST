"use client";

import Image from "next/image";
import { useHomeContent } from "@/lib/home-content";

export function Hero() {
  const { t } = useHomeContent();
  return (
    <section id="home" className="relative overflow-hidden bg-white">
      {/* Soft professional background treatment */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(1000px_520px_at_88%_-10%,rgba(200,162,74,0.14),transparent_60%),radial-gradient(760px_420px_at_-6%_0%,rgba(22,41,74,0.07),transparent_55%)]" />
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-navy/[0.02]" />
      </div>

      <div className="container-trust relative grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        {/* Left copy */}
        <div className="animate-fade-up">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/neelakannu-trust-logo.png"
              alt="Neelakannu Educational Trust"
              width={56}
              height={56}
              className="h-14 w-14"
              priority
            />
            <span className="eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
              {t("home.hero.badge", "Scholarships for Deserving Students")}
            </span>
          </div>

          <h1 className="mt-6 font-serif text-4xl font-bold leading-[1.08] tracking-tight text-navy sm:text-5xl lg:text-[3.4rem]">
            {t("home.hero.title", "Neelakannu Educational Trust")}
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {t(
              "home.hero.description",
              "Empowering deserving students through educational scholarships and trust management since 2018."
            )}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a href="/student/application" className="btn-gold">
              {t("home.hero.primaryButton", "Apply for Scholarship")}
            </a>
            <a href="#about" className="btn-outline">
              {t("home.hero.secondaryButton", "Learn More")}
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-5 border-t border-border pt-6">
            <div className="min-w-[120px]">
              <p className="font-serif text-3xl font-bold text-navy">{t("home.hero.stat1", "2018")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("home.hero.stat1Label", "Established")}</p>
            </div>
            <div className="min-w-[150px] border-l border-border pl-10">
              <p className="font-serif text-3xl font-bold text-gold-600">{t("home.hero.stat2", "100+")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("home.hero.stat2Label", "Students Supported")}</p>
            </div>
            <div className="min-w-[150px] border-l border-border pl-10">
              <p className="font-serif text-3xl font-bold text-navy">{t("home.hero.stat3", "100%")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("home.hero.stat3Label", "Commitment to Education")}</p>
            </div>
          </div>
        </div>

        {/* Right visual */}
        <div className="relative animate-fade-up delay-150 lg:justify-self-end">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-700 to-navy p-8 shadow-2xl sm:p-10">
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-gold/25 blur-2xl"
              aria-hidden="true"
            />

            {/* graduation cap illustration */}
            <div className="mx-auto w-full max-w-sm text-center">
              <div className="relative mx-auto mb-8 w-24">
                <svg viewBox="0 0 200 120" fill="none" className="w-24 text-gold">
                  <path d="M100 12 L176 50 L100 88 L24 50 Z" fill="currentColor" opacity="0.95" />
                  <path d="M38 60 L38 84 C38 96 68 104 100 104 C132 104 162 96 162 84 L162 60" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" fill="none" />
                  <path d="M176 50 L176 86" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </div>

              <p className="font-serif text-2xl font-bold italic leading-snug text-white">
                &ldquo;{t("home.hero.quote", "Empowering education, enabling dreams")}&rdquo;
              </p>
              <p className="mt-3 text-sm text-white/80">
                {t("home.hero.quoteSub", "Scholarships for deserving students since 2018")}
              </p>

              <div className="mx-auto mt-8 grid max-w-xs grid-cols-2 gap-3 text-left">
                <div className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                  <p className="font-serif text-xl font-bold text-gold">2018</p>
                  <p className="text-xs text-white/75">Founded</p>
                </div>
                <div className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                  <p className="font-serif text-xl font-bold text-gold">100%</p>
                  <p className="text-xs text-white/75">Student Focus</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
