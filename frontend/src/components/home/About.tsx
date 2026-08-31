"use client";

import { useHomeContent } from "@/lib/home-content";
import { Reveal } from "./Reveal";

export function About() {
  const { t } = useHomeContent();
  return (
    <section id="about" className="bg-white">
      <div className="container-trust py-16 sm:py-20 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Content column */}
          <Reveal>
            <div>
              <span className="eyebrow">{t("home.about.eyebrow", "Who We Are")}</span>
              <h2 className="h2-section mt-5">{t("home.about.title", "A Trust Built on Education and Compassion")}</h2>
              <p className="mt-5 leading-relaxed text-muted-foreground">
                {t(
                  "home.about.description",
                  "Neelakannu Educational Trust was established to support meritorious yet economically challenged students in pursuing their educational dreams. We believe every child deserves the opportunity to learn, grow and succeed."
                )}
              </p>

              <div className="mt-9 rounded-2xl border border-gold/25 bg-gold-soft p-6">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-600">
                  {t("home.about.visionTitle", "Our Vision")}
                </p>
                <p className="mt-3 font-serif text-xl font-bold leading-snug text-navy">
                  A society where every deserving student, regardless of economic background, has access to quality
                  education and the opportunity to reach their full potential.
                </p>
                <p className="mt-4 text-sm font-semibold text-navy-700">
                  &ldquo;{t("home.hero.quote", "Empowering education, enabling dreams")}&rdquo;
                </p>
              </div>

              <div className="mt-9 grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-muted p-6">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold-soft text-navy">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-6 w-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                  <h3 className="mt-4 font-semibold text-navy">{t("home.about.missionTitle", "Our Mission")}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(
                      "home.about.mission",
                      "To identify promising students, provide financial assistance and mentorship, and empower them to build brighter futures."
                    )}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-muted p-6">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold-soft text-navy">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-6 w-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                    </svg>
                  </span>
                  <h3 className="mt-4 font-semibold text-navy">Our Purpose</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    To remove financial barriers so talent and hard work, not circumstance, decide a student&rsquo;s future.
                  </p>
                </div>
              </div>

              <a href="#scholarships" className="btn-primary mt-9">
                Explore Scholarships
              </a>
            </div>
          </Reveal>

          {/* Visual column */}
          <Reveal delay={120} className="lg:justify-self-end">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy to-navy-700 p-10 shadow-2xl">
              <div
                className="pointer-events-none absolute -bottom-12 -right-12 h-56 w-56 rounded-full bg-gold/20 blur-2xl"
                aria-hidden="true"
              />
              <svg viewBox="0 0 200 120" fill="none" className="mx-auto w-44 text-gold">
                <path d="M100 12 L176 50 L100 88 L24 50 Z" fill="currentColor" opacity="0.95" />
                <path d="M38 60 L38 84 C38 96 68 104 100 104 C132 104 162 96 162 84 L162 60" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" fill="none" />
                <path d="M176 50 L176 86" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
              </svg>
              <p className="mt-8 text-center font-serif text-2xl italic leading-snug text-white">
                &ldquo;Education is the most powerful weapon which you can use to change the world.&rdquo;
              </p>
              <p className="mt-4 text-center text-sm font-semibold uppercase tracking-[0.18em] text-gold">
                Nurturing Potential
              </p>

              <div className="mx-auto mt-8 grid max-w-xs gap-3">
                <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <p className="font-semibold text-white">Every deserving student</p>
                  <p className="text-sm text-white/75">deserves access to quality education</p>
                </div>
                <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <p className="font-semibold text-white">Regardless of background</p>
                  <p className="text-sm text-white/75">opportunity to reach full potential</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
