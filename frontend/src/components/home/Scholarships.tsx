"use client";

import Link from "next/link";
import { useHomeContent } from "@/lib/home-content";
import { Reveal } from "./Reveal";

export function Scholarships() {
  const { t } = useHomeContent();

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

  return (
    <section id="scholarships" className="bg-cream">
      <div className="container-trust section-pad">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">{t("home.scholarships.eyebrow", "Scholarships")}</span>
          <p className="mt-4 text-muted-foreground">{t("home.scholarships.description")}</p>
        </div>

        <Reveal delay={120}>
          <div className="mx-auto mt-10 max-w-3xl">
            <div className="card-trust flex flex-col items-center justify-between gap-6 p-7 text-center sm:flex-row sm:text-left">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-600 dark:text-gold">
                  Scholarships for Deserving Students
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Find out how to apply and what documentation is required for the current intake.
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
