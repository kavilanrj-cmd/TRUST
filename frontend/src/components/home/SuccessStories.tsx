"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { useHomeContent } from "@/lib/home-content";
import { Reveal } from "./Reveal";

interface Story {
  id: string;
  name: string;
  course: string;
  testimonial: string;
  scholarship: string;
}

export function SuccessStories() {
  const { t } = useHomeContent();
  const [stories, setStories] = useState<Story[] | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/success-stories`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("not available");
        const data = (await res.json()) as Story[];
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setStories(data);
        }
      } catch {
        /* no published stories available */
      } finally {
        if (!cancelled) setChecked(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!checked) {
    return (
      <section id="success-stories" className="bg-white">
        <div className="container-trust section-pad">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">{t("home.successStories.eyebrow", "Success Stories")}</span>
            <h2 className="h2-section mt-4">{t("home.successStories.title", "Stories of Achievement")}</h2>
          </div>
          <div className="mt-12 h-56 animate-pulse rounded-2xl bg-muted" />
        </div>
      </section>
    );
  }

  return (
    <section id="success-stories" className="bg-white">
      <div className="container-trust section-pad">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">{t("home.successStories.eyebrow", "Success Stories")}</span>
          <h2 className="h2-section mt-4">{t("home.successStories.title", "Stories of Achievement")}</h2>
          <p className="mt-4 text-muted-foreground">
            {t(
              "home.successStories.description",
              "Real journeys of students supported by the Neelakannu Educational Trust scholarship program."
            )}
          </p>
        </div>

        {stories && stories.length > 0 ? (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stories.map((story, i) => (
              <Reveal key={story.id} delay={(i % 3) * 90}>
                <figure className="card-trust flex h-full flex-col p-7 transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-18px_rgba(22,41,74,0.3)]">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-gold/40" aria-hidden="true">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                  <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                    &ldquo;{story.testimonial}&rdquo;
                  </blockquote>
                  <div className="mt-6 flex items-center gap-4 border-t border-border pt-5">
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-navy font-serif text-lg font-bold text-gold"
                      aria-hidden="true"
                    >
                      {story.name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <figcaption className="font-semibold text-navy">{story.name}</figcaption>
                      <p className="text-sm text-muted-foreground">{story.course}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gold-600">
                    {story.scholarship}
                  </p>
                </figure>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="card-trust mx-auto mt-12 max-w-2xl p-10 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-soft text-navy">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-8 w-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
              </svg>
            </span>
            <p className="mt-5 font-serif text-2xl font-bold text-navy">Become a success story</p>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              Student stories are shared here as the Trust publishes them. If you are a scholarship recipient,
              your journey could inspire the next generation of students.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
