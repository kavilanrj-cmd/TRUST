"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { Reveal } from "@/components/home/Reveal";

interface Certificate {
  id: string;
  title: string;
  fileType: string;
  fileSize: number | null;
  originalFileName: string | null;
  createdAt: string;
}

// The Trust's legal paperwork is listed in this order on the public page. Titles
// are matched loosely (case/space/punctuation) so an admin can type the title in
// the admin panel and still get the official ordering. Anything the Trust has
// published beyond these four keeps its own row and follows in upload order, so
// a newly uploaded certificate still appears — it is never hidden from the
// public page.
const LEGAL_DOCUMENT_ORDER = [
  "12 A Registration",
  "Registration Certificate",
  "80 G Certificate",
  "PAN Details of the Organization",
];

function normaliseTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

const ORDER_INDEX = new Map<string, number>(
  LEGAL_DOCUMENT_ORDER.map((title, i) => [normaliseTitle(title), i])
);

function sortCertificates(list: Certificate[]): Certificate[] {
  return [...list]
    .map((cert, index) => ({ cert, index }))
    .sort((a, b) => {
      const aOrder = ORDER_INDEX.get(normaliseTitle(a.cert.title));
      const bOrder = ORDER_INDEX.get(normaliseTitle(b.cert.title));
      if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder;
      // An unrecognised document stays below the four legal ones, in the order
      // the public API returned it (newest first).
      if (aOrder !== undefined) return -1;
      if (bOrder !== undefined) return 1;
      return a.index - b.index;
    })
    .map((entry) => entry.cert);
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75v11.25m0 0 4-4m-4 4-4-4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 16.5v1.875A2.625 2.625 0 006.375 21h11.25a2.625 2.625 0 002.625-2.625V16.5" />
    </svg>
  );
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[] | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // The public endpoint returns published certificates only, so an
        // unpublished document can never appear or be downloaded here.
        const res = await fetch(`${API_BASE_URL}/api/certificates`, { cache: "no-store" });
        if (!res.ok) throw new Error("not available");
        const data = (await res.json()) as { certificates: Certificate[] };
        if (!cancelled && Array.isArray(data.certificates)) {
          setCertificates(sortCertificates(data.certificates));
        }
      } catch {
        if (!cancelled) setCertificates([]);
      } finally {
        if (!cancelled) setChecked(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasCertificates = !!certificates && certificates.length > 0;

  return (
    <div className="bg-surface-muted">
      <section className="container-trust section-pad">
        {/* ===== Page header ===== */}
        <Reveal>
          <header className="mx-auto max-w-3xl text-center">
            <span className="eyebrow">Certificates</span>
            <h1
              className="mt-4 font-serif font-bold tracking-tight text-navy dark:text-white"
              style={{ fontSize: "clamp(2.25rem, 5vw, 3.25rem)" }}
            >
              TRUST CERTIFICATES
            </h1>
            <div className="mx-auto mt-5 flex items-center justify-center gap-2" aria-hidden="true">
              <span className="h-px w-16 bg-gold/40" />
              <span className="h-2 w-2 rounded-full bg-gold" />
              <span className="h-px w-16 bg-gold/40" />
            </div>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              Legal Certificates of Trust
            </p>
          </header>
        </Reveal>

        {/* ===== Single category ===== */}
        <Reveal delay={90}>
          <div className="card-trust mt-12 overflow-hidden rounded-2xl sm:mt-14">
            <div className="flex items-center gap-3 border-b border-border bg-navy px-5 py-4 sm:px-7 dark:border-white/10">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold text-navy">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-5 w-5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.746 3.746 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296C3.63 14.39 3 13.268 3 12s.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296C20.37 9.61 21 10.732 21 12Z" />
                </svg>
              </span>
              <h2 className="font-serif text-xl font-bold tracking-wide text-white sm:text-2xl">
                LEGAL CERTIFICATES
              </h2>
            </div>

            {!checked ? (
              <div className="space-y-3 p-5 sm:p-7" aria-hidden="true">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : hasCertificates ? (
              <>
                <table className="w-full table-fixed border-collapse text-left">
                  <caption className="sr-only">
                    Legal certificates of NEELAKANNU EDUCATIONAL TRUST, with a download link for each document.
                  </caption>
                  <thead>
                    <tr className="border-b border-border bg-gold-soft/60 dark:border-white/10 dark:bg-white/5">
                      <th
                        scope="col"
                        className="w-[72%] px-5 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-navy-800 sm:px-7 dark:text-gold"
                      >
                        Documents
                      </th>
                      <th
                        scope="col"
                        className="w-[28%] px-3 py-3.5 text-right text-xs font-bold uppercase tracking-[0.15em] text-navy-800 sm:px-5 sm:pr-7 dark:text-gold"
                      >
                        PDF
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificates.map((cert) => (
                      <tr
                        key={cert.id}
                        className="border-b border-border transition-colors last:border-b-0 hover:bg-gold-soft/40 dark:border-white/10 dark:hover:bg-white/5"
                      >
                        <th
                          scope="row"
                          className="min-w-0 break-words px-5 py-4 align-middle text-sm font-semibold text-navy sm:px-7 sm:text-base dark:text-white"
                        >
                          {cert.title}
                          {cert.originalFileName && (
                            <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">
                              {cert.originalFileName}
                            </span>
                          )}
                        </th>
                        <td className="px-3 py-4 text-right align-middle sm:px-5 sm:pr-7">
                          <a
                            href={`${API_BASE_URL}/api/certificates/${cert.id}/file?download=1`}
                            className="btn-gold inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold shadow-sm transition hover:bg-gold-600 sm:px-5 sm:py-2.5 sm:text-sm"
                          >
                            <DownloadIcon className="h-4 w-4 shrink-0" />
                            Download
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="border-t border-border px-5 py-4 text-xs text-muted-foreground sm:px-7 dark:border-white/10">
                  These are the original Trust documents. Each file opens directly from the
                  Trust&rsquo;s published records.
                </p>
              </>
            ) : (
              <div className="px-5 py-12 text-center sm:px-7">
                <p className="text-base text-muted-foreground">
                  No certificates have been published yet.
                </p>
              </div>
            )}
          </div>
        </Reveal>
      </section>
    </div>
  );
}