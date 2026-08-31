import type { ReactNode } from "react";

interface Step {
  number: string;
  title: string;
  description: string;
  icon: ReactNode;
}

const STEP_ICON = "h-6 w-6";

const STEPS: Step[] = [
  {
    number: "01",
    title: "Register",
    description: "Create your account on the trust application portal to get started.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className={STEP_ICON}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Complete Application",
    description: "Fill in your personal, academic and family details accurately.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className={STEP_ICON}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Upload Documents",
    description: "Upload ID proof, income certificate, marksheet and photograph.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className={STEP_ICON}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M18 21h-12a3 3 0 01-3-3v-12a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3zM14.25 7.5h.008v.008h-.008V7.5z" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Submit Application",
    description: "Review your details, pay the fee via Razorpay and submit.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className={STEP_ICON}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    number: "05",
    title: "Verification",
    description: "Our team verifies your application and submitted documents.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className={STEP_ICON}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-2.25 10.5h4.5a2.25 2.25 0 002.25-2.25v-4.5a2.25 2.25 0 00-.293-1.086l-4.5-9A2.25 2.25 0 0012.621 3H7.5a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h4.5z" />
      </svg>
    ),
  },
  {
    number: "06",
    title: "Scholarship Decision",
    description: "Receive the final decision and track your status on the portal.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className={STEP_ICON}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
  },
];

export function HowToApply() {
  return (
    <section id="how-to-apply" className="bg-cream">
      <div className="container-trust section-pad">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">How It Works</span>
          <h2 className="h2-section mt-4">How to Apply</h2>
          <p className="mt-4 text-muted-foreground">
            A simple, transparent six-step process from registration to
            scholarship decision.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number} className="card-trust relative p-7 transition hover:-translate-y-1">
              <span className="absolute right-5 top-4 font-serif text-5xl font-bold text-navy/8" aria-hidden="true">
                {step.number}
              </span>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-gold">
                {step.icon}
              </span>
              <h3 className="mt-5 font-semibold text-navy">
                <span className="mr-2 text-gold-600">{step.number}</span>
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href="#apply"
            className="btn-primary"
          >
            Start Application
          </a>
        </div>
      </div>
    </section>
  );
}
