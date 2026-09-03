"use client";

import Link from "next/link";
import { useHomeContent } from "@/lib/home-content";
import { Reveal } from "@/components/home/Reveal";

export default function WhatWeDoPage() {
  const { t } = useHomeContent();
  const pillars = [
    {
      title: t("home.whatWeDo.p1.title", "Scholarships"),
      description: t(
        "home.whatWeDo.p1.description",
        "Financial support that helps needy students continue their education."
      ),
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
      ),
    },
    {
      title: t("home.whatWeDo.p2.title", "Grants"),
      description: t(
        "home.whatWeDo.p2.description",
        "Direct grants offered to deserving and economically challenged students."
      ),
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
    },
  ];

  return (
    <div className="bg-background">
      <section className="container-trust section-pad">
        <Reveal>
          <header className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">{t("home.whatWeDo.eyebrow", "What We Do")}</span>
            <h1 className="h2-section mt-4">{t("home.whatWeDo.title", "Scholarships and Grants")}</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {t(
                "home.whatWeDo.description",
                "Since its inception, the trust has promoted education mainly by way of scholarships and grants to deserving and needy students."
              )}
            </p>
          </header>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {pillars.map((p, i) => (
              <div
                key={i}
                className="card-trust rounded-2xl bg-white p-8 transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-18px_rgba(22,41,74,0.3)] dark:bg-[#131a2e]"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold-soft text-navy dark:text-gold">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-6 w-6">
                    {p.icon}
                  </svg>
                </span>
                <h2 className="mt-5 font-serif text-xl font-bold text-navy dark:text-white">{p.title}</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{p.description}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div className="relative mt-14 overflow-hidden rounded-3xl bg-gradient-to-br from-navy to-navy-700 p-10 text-center shadow-2xl">
            <div className="pointer-events-none absolute -bottom-12 -right-12 h-56 w-56 rounded-full bg-gold/20 blur-2xl" aria-hidden="true" />
            <p className="mx-auto max-w-2xl font-serif text-2xl italic leading-snug text-white">
              {t(
                "home.whatWeDo.quote",
                "Promoting education through scholarships and grants to deserving and needy students."
              )}
            </p>
            <p className="mt-4 font-semibold uppercase tracking-[0.18em] text-gold">
              {t("home.whatWeDo.quoteTitle", "Scholarships & Grants")}
            </p>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="mt-14 text-center">
            <Link href="/scholarship" className="btn-gold rounded-xl px-8 py-3">
              {t("home.whatWeDo.cta", "View Scholarships")}
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
