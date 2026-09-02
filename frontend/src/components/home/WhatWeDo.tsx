"use client";

import { useHomeContent } from "@/lib/home-content";
import { Reveal } from "./Reveal";

export function WhatWeDo() {
  const { t } = useHomeContent();
  const pillars = [
    {
      title: t("home.whatWeDo.p1.title", "Scholarships"),
      description: t(
        "home.whatWeDo.p1.description",
        "Financial support that helps needy students continue their education."
      ),
    },
    {
      title: t("home.whatWeDo.p2.title", "Grants"),
      description: t(
        "home.whatWeDo.p2.description",
        "Direct grants offered to deserving and economically challenged students."
      ),
    },
  ];

  return (
    <section id="what-we-do" className="bg-white dark:bg-[#0d1224]">
      <div className="container-trust section-pad">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Content */}
          <Reveal>
            <div>
              <span className="eyebrow">{t("home.whatWeDo.eyebrow", "What We Do")}</span>
              <h2 className="h2-section mt-5">{t("home.whatWeDo.title", "Scholarships and Grants")}</h2>
              <p className="mt-5 leading-relaxed text-muted-foreground">
                {t(
                  "home.whatWeDo.description",
                  "Since its inception, the trust has promoted education mainly by way of scholarships and grants to deserving and needy students."
                )}
              </p>

              <div className="mt-9 grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-muted p-6 dark:bg-[#131a2e]">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold-soft text-navy">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-6 w-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
                    </svg>
                  </span>
                  <h3 className="mt-4 font-semibold text-navy dark:text-white">{pillars[0].title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillars[0].description}</p>
                </div>
                <div className="rounded-2xl border border-border bg-muted p-6 dark:bg-[#131a2e]">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold-soft text-navy">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-6 w-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <h3 className="mt-4 font-semibold text-navy dark:text-white">{pillars[1].title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillars[1].description}</p>
                </div>
              </div>

              <div className="mt-9 flex flex-wrap gap-4">
                <a href="#scholarships" className="btn-outline">
                  {t("home.whatWeDo.cta", "View Scholarships")}
                </a>
              </div>
            </div>
          </Reveal>

          {/* Visual column */}
          <Reveal delay={120} className="lg:justify-self-end">
            <div className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-navy to-navy-700 p-10 shadow-2xl">
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
                {t(
                  "home.whatWeDo.quote",
                  "Promoting education through scholarships and grants to deserving and needy students."
                )}
              </p>
              <p className="mt-4 text-center text-sm font-semibold uppercase tracking-[0.18em] text-gold">
                {t("home.whatWeDo.quoteTitle", "Scholarships & Grants")}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
