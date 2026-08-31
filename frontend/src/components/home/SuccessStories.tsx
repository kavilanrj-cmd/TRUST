"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

interface Story {
  id: string;
  name: string;
  course: string;
  testimonial: string;
  scholarship: string;
}

export function SuccessStories() {
  const [stories, setStories] = useState<Story[] | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Success stories are exposed via this endpoint when the trust publishes
    // verified student stories.
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
      <section id="success-stories" className="bg-cream">
        <div className="container-trust section-pad">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Impact</span>
            <h2 className="h2-section mt-4">Success Stories</h2>
          </div>
          <div className="mt-12 h-56 animate-pulse rounded-2xl bg-muted" />
        </div>
      </section>
    );
  }

  return (
    <section id="success-stories" className="bg-cream">
      <div className="container-trust section-pad">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Impact</span>
          <h2 className="h2-section mt-4">Success Stories</h2>
          <p className="mt-4 text-muted-foreground">
            Real journeys of students supported by the Neelakannu Educational
            Trust scholarship program.
          </p>
        </div>

        {stories && stories.length > 0 ? (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <figure key={story.id} className="card-trust flex flex-col p-7">
                <div className="flex items-center gap-4">
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
                <blockquote className="mt-5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{story.testimonial}&rdquo;
                </blockquote>
                <p className="mt-5 border-t border-border pt-4 text-xs font-semibold uppercase tracking-wide text-gold-600">
                  {story.scholarship}
                </p>
              </figure>
            ))}
          </div>
        ) : (
          <div className="card-trust mx-auto mt-12 max-w-2xl p-10 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-soft text-navy">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-8 w-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
              </svg>
            </span>
            <p className="mt-5 font-serif text-2xl font-bold text-navy">
              Become a success story
            </p>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              Student stories are shared here as the Trust publishes them. If
              you are a scholarship recipient, your journey could inspire the
              next generation of students.
            </p>
            <a href="#apply" className="btn-gold mt-6">
              Apply Now
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
