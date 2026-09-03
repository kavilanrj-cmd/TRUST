"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { useHomeContent } from "@/lib/home-content";
import { Reveal } from "@/components/home/Reveal";

interface FeeConfig {
  amount: number;
  enabled: boolean;
  currency: string;
}

export default function HowToApplyPage() {
  const { t } = useHomeContent();
  const [fee, setFee] = useState<FeeConfig | null>(null);
  const [declarationAgreed, setDeclarationAgreed] = useState(false);
  const [declarationError, setDeclarationError] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/application-fee`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setFee(d))
      .catch(() => setFee(null));
  }, []);

  const steps = [
    { n: "01", title: t("home.howToApply.step1.title", "Create an Account"), description: t("home.howToApply.step1.description", "Register on our portal with a valid email address.") },
    { n: "02", title: t("home.howToApply.step2.title", "Complete Your Application"), description: t("home.howToApply.step2.description", "Fill in your personal, academic and family details accurately.") },
    { n: "03", title: t("home.howToApply.step3.title", "Upload Documents"), description: t("home.howToApply.step3.description", "Upload the required supporting documents.") },
    { n: "04", title: "Review Details", description: "Verify all your information and documents before proceeding." },
    { n: "05", title: "Pay Application Fee", description: "Pay the application fee to finalise your application." },
    { n: "06", title: t("home.howToApply.step4.title", "Submit Application"), description: t("home.howToApply.step4.description", "Review your information and submit your application.") },
    { n: "07", title: "Track Application", description: "Track the status of your application from your dashboard." },
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

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={(i % 3) * 80}>
              <div className="card-trust flex h-full flex-col rounded-2xl bg-white p-7 transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-18px_rgba(22,41,74,0.3)] dark:bg-[#131a2e]">
                <span className="font-serif text-4xl font-bold text-gold/40">{s.n}</span>
                <h2 className="mt-4 font-serif text-xl font-bold text-navy dark:text-white">{s.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
              </div>
            </Reveal>
          ))}
        </div>

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
                <span className="mt-1 text-gold-600"></span>
                <span className="text-muted-foreground">Candidate must submit the scholarship application within the deadline specified by the trust.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-gold-600"></span>
                <span className="text-muted-foreground">Application that is incomplete are missing required document will be summerly rejected</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-gold-600"></span>
                <span className="text-muted-foreground">Application will be considered on first come first serve basis, academic eligibility and income criteria</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-gold-600"></span>
                <span className="text-muted-foreground">Trust reserves the right to approve or reject the application</span>
              </li>
            </ul>
          </div>
        </Reveal>

        <Reveal delay={250}>
          <div className="mx-auto mt-14 max-w-3xl rounded-2xl border border-navy/10 bg-white p-8 dark:border-white/10 dark:bg-[#131a2e]">
            <h2 className="font-serif text-xl font-bold text-navy dark:text-white">
              DECLARATION
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              I hereby declare that the information provided in this scholarship application is true, complete and accurate to the best of my knowledge. I understand that any false or misleading information may result in the rejection of my application or cancellation of the scholarship at any stage.
            </p>
            <div className="mt-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={declarationAgreed}
                  onChange={(e) => {
                    setDeclarationAgreed(e.target.checked);
                    if (e.target.checked) setDeclarationError(false);
                  }}
                  className="mt-1 h-5 w-5 rounded border-navy/30 text-gold focus:ring-gold/50 cursor-pointer"
                />
                <span className="text-sm font-medium text-navy dark:text-white">
                  I agree to the above declaration
                </span>
              </label>
              {declarationError && (
                <p className="mt-2 text-sm text-destructive" role="alert">
                  You must agree to the declaration before proceeding.
                </p>
              )}
            </div>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  if (!declarationAgreed) {
                    setDeclarationError(true);
                    return;
                  }
                  window.location.href = "/student/application";
                }}
                className="btn-gold rounded-xl px-7 py-3"
              >
                Proceed to Application
              </button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
