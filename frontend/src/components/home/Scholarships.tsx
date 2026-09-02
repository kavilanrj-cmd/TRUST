"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { useHomeContent } from "@/lib/home-content";
import { Reveal } from "./Reveal";

interface FeeConfig {
  amount: number;
  enabled: boolean;
  currency: string;
}

export function Scholarships() {
  const { t } = useHomeContent();
  const [fee, setFee] = useState<FeeConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/application-fee`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setFee(d);
      })
      .catch(() => {
        /* ignore network errors */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pillars = [
    {
      title: t("home.scholarships.p1.title", "Scholarships"),
      description: t(
        "home.scholarships.p1.description",
        "Financial support that helps needy students continue their education."
      ),
    },
    {
      title: t("home.scholarships.p2.title", "Grants"),
      description: t(
        "home.scholarships.p2.description",
        "Direct grants offered to deserving and economically challenged students."
      ),
    },
  ];

  const showFee = fee && fee.enabled && fee.amount > 0;

  return (
    <section id="scholarships" className="bg-cream">
      <div className="container-trust section-pad">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">{t("home.scholarships.eyebrow", "Scholarships")}</span>
          <h2 className="h2-section mt-4">{t("home.scholarships.title", "Scholarships and Grants")}</h2>
          <p className="mt-4 text-muted-foreground">{t("home.scholarships.description")}</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {pillars.map((pillar, idx) => (
            <Reveal key={pillar.title} delay={idx * 90}>
              <article className="card-trust flex h-full flex-col p-7 transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_45px_-20px_rgba(22,41,74,0.35)]">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy text-gold">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-6 w-6">
                    {idx === 0 ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
                  </svg>
                </span>
                <h3 className="mt-5 font-serif text-xl font-bold text-navy">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{pillar.description}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mx-auto mt-10 max-w-3xl">
            <div className="card-trust flex flex-col items-center justify-between gap-6 p-7 text-center sm:flex-row sm:text-left">
              <div>
                <h3 className="font-serif text-xl font-bold text-navy">Application Fee</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {showFee ? (
                    <>
                      {t("home.scholarships.feeNote", "A nominal, non-refundable application fee applies and is set by the Trust.")}{" "}
                      <span className="font-semibold text-navy">
                        ₹{Number(fee!.amount).toLocaleString("en-IN")}
                      </span>
                    </>
                  ) : (
                    t(
                      "home.scholarships.feeNote",
                      "A nominal, non-refundable application fee applies and is set by the Trust."
                    )
                  )}
                </p>
              </div>
              <Link href="/how-to-apply" className="btn-outline rounded-lg px-6 py-3 text-sm">
                How to Apply
              </Link>
            </div>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              {t("home.scholarships.note", "New scholarship opportunities are announced regularly. Applications open for the current intake.")}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
