"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { useHomeContent } from "@/lib/home-content";
import { ApplicationDeadline } from "./ApplicationDeadline";

interface DeadlineConfig {
  deadline: string | null;
  formatted: string | null;
  closed: boolean;
}

export function Hero() {
  const { t } = useHomeContent();
  const [deadline, setDeadline] = useState<DeadlineConfig | null>(null);
  const isClosed = !!deadline?.deadline && deadline.closed;

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/application-deadline`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setDeadline(d);
      })
      .catch(() => {
        /* ignore network errors */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="home" className="relative overflow-hidden bg-white dark:bg-[#0d1224]">
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

          <h1 className="mt-6 font-serif text-4xl font-bold leading-[1.08] tracking-tight text-navy sm:text-5xl lg:text-[3.4rem] dark:text-white">
            {t("home.hero.title", "Neelakannu Educational Trust")}
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {t(
              "home.hero.description",
              "Empowering deserving students through educational scholarships and trust management since 2018."
            )}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {isClosed ? (
              <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-navy-50 px-6 py-3 text-sm font-semibold text-muted-foreground">
                Applications Closed
              </span>
            ) : (
              <Link href="/login" className="btn-gold">
                {t("home.hero.loginCta", "Login to Apply")}
              </Link>
            )}
            <a href="#about" className="btn-outline">
              {t("home.hero.secondaryButton", "Learn More")}
            </a>
          </div>

          {isClosed && deadline?.formatted && (
            <p className="mt-4 max-w-xl text-sm font-medium text-red-600">
              Applications Closed. The last date to apply was {deadline.formatted}.
            </p>
          )}

          <ApplicationDeadline />
        </div>

        {/* Right visual */}
        <div className="relative animate-fade-up delay-150 lg:justify-self-end">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-700 to-navy p-8 shadow-2xl sm:p-10">
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-gold/25 blur-2xl"
              aria-hidden="true"
            />

            {/* Trust logo — centered, responsive, keeps aspect ratio */}
            <div className="mx-auto w-full max-w-sm text-center">
              <div className="relative mx-auto mb-8 flex justify-center">
                <Image
                  src="/assets/neelakannu-trust-logo.png"
                  alt="Neelakannu Educational Trust logo"
                  width={200}
                  height={200}
                  className="h-auto w-32 rounded-3xl shadow-2xl sm:w-40 lg:w-48"
                  priority
                />
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
