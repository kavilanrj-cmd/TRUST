"use client";

import { Reveal } from "./Reveal";

const NOTES = [
  "Preference will be given to girl students, children from lower income group families, differently abled children, and children from single-parent families.",
  "The application form needs to be filled online, and the documents requested should also be uploaded while submitting the application form.",
  "Kindly download the list of documents required and keep soft copies of the same ready before accessing the application form.",
];

export function Notes() {
  return (
    <section id="notes" className="bg-white dark:bg-[#0d1224]">
      <div className="container-trust section-pad">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gold-soft px-8 py-10 sm:px-12 sm:py-12 dark:border-gold/30 dark:bg-[#1d2740]">
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/15 blur-2xl"
              aria-hidden="true"
            />
            <span className="inline-flex items-center rounded-full bg-navy px-4 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-gold">
              Important Notes
            </span>
            <h2 className="mt-4 font-serif text-2xl font-bold tracking-tight text-navy sm:text-3xl dark:text-white">
              Before You Apply
            </h2>
            <ul className="mt-6 space-y-4">
              {NOTES.map((note, idx) => (
                <li key={idx} className="flex gap-4">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-navy">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                  <p className="leading-relaxed text-navy-800 dark:text-slate-200">{note}</p>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
