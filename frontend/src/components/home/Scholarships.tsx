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
          <p className="mt-4 text-muted-foreground">{t("home.scholarships.description")}</p>
        </div>

        <Reveal delay={120}>
          <div className="mx-auto mt-10 max-w-3xl">
            <div className="card-trust flex flex-col items-center justify-between gap-6 p-7 text-center sm:flex-row sm:text-left">
              <div>
                <h3 className="font-serif text-xl font-bold text-navy dark:text-white">Application Fee</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {showFee ? (
                    <>
                      {t("home.scholarships.feeNote", "A nominal, non-refundable application fee applies and is set by the Trust.")}{" "}
                      <span className="font-semibold text-navy dark:text-gold">
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
