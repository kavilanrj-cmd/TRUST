"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { useHomeContent } from "@/lib/home-content";
import { Reveal } from "@/components/home/Reveal";

interface Certificate {
  id: string;
  title: string;
  fileType: string;
  fileSize: number | null;
  originalFileName: string | null;
  createdAt: string;
}

function fileSizeLabel(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CertificatesPage() {
  const { t } = useHomeContent();
  const [certificates, setCertificates] = useState<Certificate[] | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/certificates`, { cache: "no-store" });
        if (!res.ok) throw new Error("not available");
        const data = (await res.json()) as { certificates: Certificate[] };
        if (!cancelled && Array.isArray(data.certificates)) setCertificates(data.certificates);
      } catch {
        setCertificates([]);
      } finally {
        if (!cancelled) setChecked(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-background">
      <section className="container-trust section-pad">
        <Reveal>
          <header className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">{t("nav.certificates", "Certificates")}</span>
            <h1 className="h2-section mt-4">{t("nav.certificates", "Certificates")}</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Official certificates issued by Neelakannu Educational Trust. Certificate files are
              available to download by the recipients.
            </p>
          </header>
        </Reveal>

        {!checked ? (
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : certificates && certificates.length > 0 ? (
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {certificates.map((cert, i) => (
              <Reveal key={cert.id} delay={(i % 3) * 90}>
                <figure className="card-trust flex h-full flex-col rounded-2xl bg-white p-7 transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-18px_rgba(22,41,74,0.3)] dark:bg-[#131a2e]">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-soft text-navy dark:text-gold">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-7 w-7" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h6M6 2h12a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 14.5 10 17l6-7" />
                    </svg>
                  </span>
                  <figcaption className="mt-4 flex-1 text-center font-semibold text-navy dark:text-white">
                    {cert.title}
                  </figcaption>
                  {cert.originalFileName && (
                    <p className="mt-1 text-center text-sm text-muted-foreground">{cert.originalFileName}</p>
                  )}
                  <p className="mt-1 text-center text-xs text-muted-foreground">
                    {new Date(cert.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {fileSizeLabel(cert.fileSize) ? ` · ${fileSizeLabel(cert.fileSize)}` : ""}
                  </p>
                  <div className="mt-5 flex items-center justify-center gap-3">
                    <a
                      href={`${API_BASE_URL}/api/certificates/${cert.id}/file`}
                      target="_blank"
                      rel="noopener noreferrer"
                      referrerPolicy="no-referrer"
                      className="btn-outline px-4 py-2 text-sm"
                    >
                      View
                    </a>
                    <a
                      href={`${API_BASE_URL}/api/certificates/${cert.id}/file?download=1`}
                      rel="noopener noreferrer"
                      referrerPolicy="no-referrer"
                      className="btn-gold px-4 py-2 text-sm"
                    >
                      Download
                    </a>
                  </div>
                </figure>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="card-trust mx-auto mt-14 max-w-2xl rounded-2xl bg-white p-10 text-center dark:bg-[#131a2e]">
            <p className="mt-2 text-muted-foreground">
              Certificates will be published here as the Trust releases them.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}