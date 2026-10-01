"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  UserRound,
  FilePenLine,
  FileUp,
  SearchCheck,
  Wallet,
  UserCheck,
  Send,
  LayoutDashboard,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { useHomeContent } from "@/lib/home-content";
import { Reveal } from "@/components/home/Reveal";

interface FeeConfig {
  amount: number;
  enabled: boolean;
  currency: string;
}

interface ProcessStep {
  n: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  /** Informational (non-interactive) key/value detail shown inside the card. */
  detail?: { label: string; fields: string[] };
}

export default function HowToApplyPage() {
  const { t } = useHomeContent();
  const [fee, setFee] = useState<FeeConfig | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/application-fee`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setFee(d))
      .catch(() => setFee(null));
  }, []);

  const steps: ProcessStep[] = [
    {
      n: "01",
      title: t("home.howToApply.step1.title", "Create an Account"),
      description: t(
        "home.howToApply.step1.description",
        "Register on our portal with a valid email address."
      ),
      Icon: UserRound,
    },
    {
      n: "02",
      title: t("home.howToApply.step2.title", "Complete Your Application"),
      description: t(
        "home.howToApply.step2.description",
        "Fill in your personal, academic and family details accurately."
      ),
      Icon: FilePenLine,
    },
    {
      n: "03",
      title: t("home.howToApply.step3.title", "Upload Documents"),
      description: t(
        "home.howToApply.step3.description",
        "Upload the required supporting documents."
      ),
      Icon: FileUp,
    },
    {
      n: "04",
      title: "Review Details",
      description: "Verify all your information and documents before proceeding.",
      Icon: SearchCheck,
    },
    {
      n: "05",
      title: "Pay Application Fee",
      description: "Pay the application fee to finalize your application.",
      Icon: Wallet,
    },
    {
      n: "06",
      title: "Recommendation Details",
      description:
        "Provide the name and designation of the person who recommended you for the scholarship.",
      Icon: UserCheck,
      detail: { label: "Recommended By", fields: ["Name", "Designation"] },
    },
    {
      n: "07",
      title: t("home.howToApply.step4.title", "Submit Application"),
      description: t(
        "home.howToApply.step4.description",
        "Review your information and submit your application."
      ),
      Icon: Send,
    },
    {
      n: "08",
      title: "Track Application",
      description: "Track the status of your application from your dashboard.",
      Icon: LayoutDashboard,
    },
  ];

  return (
    <div className="bg-background">
      <section className="container-trust section-pad">
        <Reveal>
          <header className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">{t("home.howToApply.eyebrow", "How to Apply")}</span>
            <h1 className="h2-section mt-4">{t("home.howToApply.title", "Application Process")}</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {t(
                "home.howToApply.description",
                "Follow these simple steps to submit your scholarship application."
              )}
            </p>
          </header>
        </Reveal>

        <ol className="mx-auto mt-14 flex max-w-3xl flex-col items-stretch">
          {steps.map((s, i) => (
            <li key={s.n} className="flex flex-col items-stretch">
              <Reveal delay={i * 70}>
                <div className="group relative overflow-hidden rounded-2xl border border-gold/45 bg-[linear-gradient(160deg,#16294a_0%,#1e365e_55%,#142340_100%)] px-6 py-7 shadow-[0_18px_44px_-24px_rgba(22,41,74,0.85)] transition duration-300 hover:border-gold/70 hover:shadow-[0_22px_52px_-20px_rgba(200,162,74,0.45)] sm:px-9 sm:py-9">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(200,162,74,0.28),transparent_68%)] transition duration-500 group-hover:bg-[radial-gradient(circle,rgba(200,162,74,0.4),transparent_68%)]"
                  />
                  <div className="relative flex items-start gap-5 sm:gap-7">
                    <div className="flex shrink-0 flex-col items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="flex h-14 w-14 items-center justify-center rounded-xl border border-gold/45 bg-[linear-gradient(160deg,rgba(200,162,74,0.22),rgba(200,162,74,0.06))] text-gold sm:h-16 sm:w-16"
                      >
                        <s.Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.6} />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="font-serif text-3xl font-bold leading-none text-gold sm:text-4xl">
                          {s.n}
                        </span>
                        <h2 className="font-serif text-xl font-bold leading-snug text-[#fafaf7] sm:text-2xl">
                          {s.title}
                        </h2>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-[#d9dfec] sm:text-[0.95rem]">
                        {s.description}
                      </p>
                      {s.detail && (
                        <div className="mt-5 rounded-xl border border-gold/30 bg-[rgba(255,255,255,0.04)] p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
                            {s.detail.label}
                          </p>
                          <dl className="mt-3 space-y-2.5">
                            {s.detail.fields.map((f) => (
                              <div
                                key={f}
                                className="flex items-center justify-between gap-4 border-b border-white/10 pb-2.5 last:border-0 last:pb-0"
                              >
                                <dt className="text-sm font-medium text-[#e7ebf4]">{f}</dt>
                                <dd
                                  aria-hidden="true"
                                  className="h-px flex-1 bg-[linear-gradient(to_right,transparent,rgba(200,162,74,0.5),transparent)]"
                                />
                              </div>
                            ))}
                          </dl>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
              {i < steps.length - 1 && (
                <div className="flex justify-center" aria-hidden="true">
                  <ChevronDown className="my-3 h-7 w-7 text-gold/80" strokeWidth={2} />
                </div>
              )}
            </li>
          ))}
        </ol>

        <Reveal delay={150}>
          <div className="mx-auto mt-14 max-w-3xl rounded-2xl border border-gold/30 bg-gold-soft p-8 dark:bg-[#1d2740]">
            <h2 className="font-serif text-xl font-bold text-navy dark:text-white">
              Important before you submit
            </h2>
            <ul className="mt-4 space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="mt-1 text-gold-600">•</span>
                <span>
                  {fee?.enabled && fee.amount > 0
                    ? `The application fee of ₹${fee.amount} is mandatory to submit your application.`
                    : "Payment of the application fee is mandatory to submit your application."}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-gold-600">•</span>
                <span>All required documents must be uploaded before submission.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-gold-600">•</span>
                <span>Please verify all your details carefully before final submission.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-gold-600">•</span>
                <span>An application cannot be submitted without a successful payment.</span>
              </li>
            </ul>
            <div className="mt-6">
              <Link href="/student/application" className="btn-gold rounded-xl px-7 py-3">
                Start Your Application
              </Link>
            </div>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="mx-auto mt-14 max-w-3xl rounded-2xl border border-navy/10 bg-white p-8 dark:border-white/10 dark:bg-[#131a2e]">
            <h2 className="font-serif text-xl font-bold text-navy dark:text-white">
              SELECTION PROCEDURE - NEELAKANNU SCHOLARSHIP-2027
            </h2>
            <ul className="mt-6 space-y-4">
              <li className="flex items-start gap-3">
                <span className="mt-1 text-gold-600"></span>
                <span className="text-muted-foreground">Candidate must submit the scholarship application within the deadline specified by the trust.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-gold-600"></span>
                <span className="text-muted-foreground">Application that is incomplete are missing required document will be summerly rejected</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-gold-600"></span>
                <span className="text-muted-foreground">Application will be considered on first come first serve basis, academic eligibility and income criteria</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-gold-600"></span>
                <span className="text-muted-foreground">Trust reserves the right to approve or reject the application</span>
              </li>
            </ul>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
