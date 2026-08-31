"use client";

import type { ReactNode } from "react";
import { useHomeContent } from "@/lib/home-content";
import { Reveal } from "./Reveal";

const STEP_ICON = "h-6 w-6";

const ICONS: ReactNode[] = [
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className={STEP_ICON} key="1">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className={STEP_ICON} key="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className={STEP_ICON} key="3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M18 21h-12a3 3 0 01-3-3v-12a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3zM14.25 7.5h.008v.008h-.008V7.5z" />
  </svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className={STEP_ICON} key="4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className={STEP_ICON} key="5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-2.25 10.5h4.5a2.25 2.25 0 002.25-2.25v-4.5a2.25 2.25 0 00-.293-1.086l-4.5-9A2.25 2.25 0 0012.621 3H7.5a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h4.5z" />
  </svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className={STEP_ICON} key="6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>,
];

export function HowToApply() {
  const { t } = useHomeContent();
  const steps: { number: string; title: string; description: string; icon: ReactNode }[] = [
    { number: "01", title: t("home.howToApply.step1.title", "Create an Account"), description: t("home.howToApply.step1.description", "Register on our portal with a valid email address."), icon: ICONS[0] },
    { number: "02", title: t("home.howToApply.step2.title", "Complete Your Application"), description: t("home.howToApply.step2.description", "Fill in your personal, academic and family details accurately."), icon: ICONS[1] },
    { number: "03", title: t("home.howToApply.step3.title", "Upload Documents"), description: t("home.howToApply.step3.description", "Upload the required supporting documents."), icon: ICONS[2] },
    { number: "04", title: t("home.howToApply.step4.title", "Submit Application"), description: t("home.howToApply.step4.description", "Review your information and submit your application."), icon: ICONS[3] },
    { number: "05", title: t("home.howToApply.step5.title", "Verification"), description: t("home.howToApply.step5.description", "Our team verifies your details and documents."), icon: ICONS[4] },
    { number: "06", title: t("home.howToApply.step6.title", "Scholarship Decision"), description: t("home.howToApply.step6.description", "Receive your scholarship decision and funding."), icon: ICONS[5] },
  ];

  return (
    <section id="how-to-apply" className="bg-cream">
      <div className="container-trust section-pad">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">{t("home.howToApply.eyebrow", "How to Apply")}</span>
          <h2 className="h2-section mt-4">{t("home.howToApply.title", "Application Process")}</h2>
          <p className="mt-4 text-muted-foreground">
            {t(
              "home.howToApply.description",
              "Follow these simple steps to submit your scholarship application."
            )}
          </p>
        </div>

        <div className="relative mt-14">
          {/* connecting line (desktop) */}
          <div
            className="pointer-events-none absolute left-0 right-0 top-[26px] hidden h-0.5 bg-gradient-to-r from-transparent via-gold/30 to-transparent lg:block"
            aria-hidden="true"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {steps.map((step, i) => (
              <Reveal key={step.number} delay={(i % 3) * 90}>
                <div className="card-trust relative h-full p-7 transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-18px_rgba(22,41,74,0.3)]">
                  <span className="relative z-10 inline-flex h-13 w-13 items-center justify-center rounded-2xl bg-navy text-gold shadow-md">
                    {step.icon}
                  </span>
                  <span
                    className="pointer-events-none absolute right-5 top-3 font-serif text-6xl font-bold text-navy/5"
                    aria-hidden="true"
                  >
                    {step.number}
                  </span>
                  <h3 className="mt-5 font-semibold text-navy">
                    <span className="mr-2 text-sm font-bold text-gold-600">{step.number}</span>
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <a href="#apply" className="btn-primary">
            Start Application
          </a>
        </div>
      </div>
    </section>
  );
}
