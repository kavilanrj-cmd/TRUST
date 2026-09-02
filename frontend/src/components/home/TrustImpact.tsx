"use client";

import { useHomeContent } from "@/lib/home-content";
import { Reveal } from "./Reveal";

export function TrustImpact() {
  const { t } = useHomeContent();
  const STATS = [
    {
      value: t("home.hero.stat1", "2018"),
      label: t("home.hero.stat1Label", "Established"),
      note: "Trust founded on 14th November 2018",
    },
    {
      value: t("home.hero.stat2", "100+"),
      label: t("home.hero.stat2Label", "Students Supported"),
      note: "Deserving students assisted",
    },
    {
      value: t("home.impact.scholarship", "₹50L+"),
      label: t("home.impact.scholarshipLabel", "Scholarship Assistance"),
      note: "Distributed since inception",
    },
    {
      value: t("home.hero.stat3", "100%"),
      label: t("home.hero.stat3Label", "Commitment to Education"),
      note: "Focused on student success",
    },
  ];
  return (
    <section
      id="impact"
      aria-label="Trust impact statistics"
      className="border-y border-border bg-surface-muted dark:bg-[#0e1425]"
    >
      <div className="container-trust py-12">
        <Reveal>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="border-l-2 border-gold/50 pl-5"
              >
                <p className="font-serif text-4xl font-bold tracking-tight text-navy dark:text-white">
                  {stat.value}
                </p>
                <p className="mt-1 font-semibold text-gold-600">{stat.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.note}</p>
              </div>
            ))}
          </div>
        </Reveal>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          {t(
            "home.impact.note",
            "Figures are configurable by the Trust and updated as verified reporting data is published."
          )}
        </p>
      </div>
    </section>
  );
}
