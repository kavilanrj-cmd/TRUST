"use client";

import type { ReactNode } from "react";
import { useHomeContent } from "@/lib/home-content";
import { Reveal } from "./Reveal";

const ICON = "h-6 w-6";

const ICONS: ReactNode[] = [
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className={ICON} key="1">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className={ICON} key="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className={ICON} key="3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className={ICON} key="4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
  </svg>,
];

export function WhyChooseUs() {
  const { t } = useHomeContent();
  const features: { title: string; description: string; icon: ReactNode }[] = [
    { title: t("home.whyChooseUs.f1.title", "Transparent Process"), description: t("home.whyChooseUs.f1.description", "Clear, published criteria and a fair review process for every applicant."), icon: ICONS[0] },
    { title: t("home.whyChooseUs.f2.title", "Student-Focused Support"), description: t("home.whyChooseUs.f2.description", "We are here to guide you at every step of your application journey."), icon: ICONS[1] },
    { title: t("home.whyChooseUs.f3.title", "Secure Applications"), description: t("home.whyChooseUs.f3.description", "Your personal information and documents are handled securely and confidentially."), icon: ICONS[2] },
    { title: t("home.whyChooseUs.f4.title", "Education for Every Deserving Student"), description: t("home.whyChooseUs.f4.description", "Our mission is to make quality education accessible to those who need it most."), icon: ICONS[3] },
  ];

  return (
    <section id="why-us" className="bg-white">
      <div className="container-trust section-pad">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">{t("home.whyChooseUs.eyebrow", "Why Choose Us")}</span>
          <h2 className="h2-section mt-4">{t("home.whyChooseUs.title", "Why Families Trust Us")}</h2>
          <p className="mt-4 text-muted-foreground">
            We are committed to a fair, secure and caring experience for every student who applies.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 4) * 80}>
              <div className="card-trust h-full p-7 text-center transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-18px_rgba(22,41,74,0.3)]">
                <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-soft text-navy">
                  {feature.icon}
                </span>
                <h3 className="mt-5 font-semibold text-navy">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
