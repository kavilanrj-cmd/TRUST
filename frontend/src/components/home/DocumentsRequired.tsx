"use client";

import { Reveal } from "./Reveal";

const DOCUMENTS = [
  "SSLC",
  "HSC",
  "Bonafide Certificate",
  "ID Card",
  "Community Certificate",
  "Income Certificate",
  "PAN",
  "Aadhar",
  "Bank Passbook (Student Account)",
  "Disability Certificate",
  "Sports Certificate",
];

export function DocumentsRequired() {
  return (
    <section id="documents-required" className="bg-cream dark:bg-[#0e1425]">
      <div className="container-trust section-pad">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Documents</span>
          <h2 className="h2-section mt-4">Documents Required</h2>
          <p className="mt-4 text-muted-foreground">
            Please keep soft copies of all required documents ready before accessing the application form.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <Reveal>
            <div className="card-trust p-7 sm:p-9">
              <ul className="grid gap-3 sm:grid-cols-2">
                {DOCUMENTS.map((doc, idx) => (
                  <li
                    key={doc}
                    className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 dark:bg-[#131a2e]"
                  >
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gold-soft text-gold-600">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-navy dark:text-white">
                      <span className="mr-1.5 text-gold-600">{String(idx + 1)}.</span>
                      {doc}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-gold/30 bg-gold-soft p-6 text-center">
            <p className="text-sm leading-relaxed text-navy-800">
              Please keep soft copies of all required documents ready before accessing the application form.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
