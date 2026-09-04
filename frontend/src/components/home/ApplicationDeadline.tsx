"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { Reveal } from "./Reveal";

interface DeadlineConfig {
  deadline: string | null;
  formatted: string | null;
  closed: boolean;
}

export function ApplicationDeadline() {
  const [config, setConfig] = useState<DeadlineConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/application-deadline`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setConfig(d);
      })
      .catch(() => {
        /* ignore network errors */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // If not configured or still loading, quietly render nothing so the rest of
  // the Home page is unaffected.
  if (!config || !config.deadline) return null;

  const isClosed = config.closed;

  return (
    <section className="bg-white dark:bg-[#0d1224]">
      <div className="container-trust section-pad">
        <Reveal>
          <div className="mx-auto max-w-3xl">
            <div
              className={`relative overflow-hidden rounded-3xl p-8 shadow-2xl sm:p-10 ${
                isClosed
                  ? "bg-gradient-to-br from-navy-800 to-navy"
                  : "bg-gradient-to-br from-navy-700 to-navy"
              }`}
            >
              {/* Decorative glow */}
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-gold/25 blur-2xl"
                aria-hidden="true"
              />

              <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:text-left">
                {/* Calendar / clock visual */}
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-gold/40 bg-gold-soft text-navy-800 dark:border-gold/30 dark:bg-[#1d2740] dark:text-gold">
                  <svg
                    className="h-10 w-10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                    <line x1="12" y1="14" x2="12" y2="18" />
                    <line x1="10" y1="16" x2="14" y2="16" />
                  </svg>
                </div>

                <div className="flex-1">
                  {isClosed ? (
                    <span className="eyebrow">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400" aria-hidden="true" />
                      Applications Closed
                    </span>
                  ) : (
                    <span className="eyebrow">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
                      Scholarship Applications Open
                    </span>
                  )}

                  <h2 className="mt-3 font-serif text-2xl font-bold leading-tight text-white sm:text-3xl">
                    Last Date to Apply for Scholarship
                  </h2>

                  <p className="mt-2 font-serif text-4xl font-bold text-gold sm:text-5xl">
                    {config.formatted}
                  </p>

                  {isClosed && (
                    <p className="mt-3 text-sm text-white/85">
                      The last date to apply was {config.formatted}. New applications are now closed.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
