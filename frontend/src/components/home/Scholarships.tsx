"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { useHomeContent } from "@/lib/home-content";
import { Reveal } from "./Reveal";

interface Scholar {
  id: string;
  name: string;
  description: string | null;
  educationLevels: string[];
  minimumMarks: number | null;
  minimumCGPA: number | null;
  maximumFamilyIncome: number | null;
  applicationFee: number;
  applicationDeadline: string | null;
  isActive: boolean;
}

function formatDeadline(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isOpen(s: Scholar): boolean {
  if (!s.isActive) return false;
  if (!s.applicationDeadline) return true;
  return new Date(s.applicationDeadline).getTime() >= Date.now();
}

const DETAIL_ICON =
  "flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm";

export function Scholarships() {
  const { t } = useHomeContent();
  const [scholarships, setScholarships] = useState<Scholar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/scholarships`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load scholarships");
        const data = (await res.json()) as Scholar[];
        if (!cancelled) {
          setScholarships(Array.isArray(data) ? data : []);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Scholarship details are temporarily unavailable.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="scholarships" className="bg-cream">
      <div className="container-trust section-pad">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">{t("home.scholarships.eyebrow", "Scholarships")}</span>
          <h2 className="h2-section mt-4">{t("home.scholarships.title", "Scholarship Program")}</h2>
          <p className="mt-4 text-muted-foreground">
            {t(
              "home.scholarships.description",
              "Our Scholarship Program supports deserving students with financial assistance and guidance so they can continue their education with confidence."
            )}
          </p>
        </div>

        <div className="mt-12">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="card-trust h-64 animate-pulse bg-muted" />
              ))}
            </div>
          ) : error ? (
            <div className="card-trust mx-auto max-w-lg p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-soft text-navy">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-7 w-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <p className="mt-4 font-medium text-navy">Scholarship details</p>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Please check back soon or contact the Trust for current opportunities.
              </p>
            </div>
          ) : scholarships.length === 0 ? (
            <div className="card-trust mx-auto max-w-lg p-8 text-center">
              <p className="font-medium text-navy">No active scholarships right now</p>
              <p className="mt-2 text-sm text-muted-foreground">
                New scholarship opportunities are announced regularly. Check back soon to apply.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {scholarships.map((s, idx) => {
                const open = isOpen(s);
                const eligibilityBits = [
                  s.educationLevels && s.educationLevels.length > 0 ? s.educationLevels.join(", ") : null,
                  s.minimumMarks != null ? `Min ${s.minimumMarks}` : null,
                  s.minimumCGPA != null ? `CGPA ${s.minimumCGPA}` : null,
                  s.maximumFamilyIncome != null
                    ? `Income ≤ ₹${Number(s.maximumFamilyIncome).toLocaleString("en-IN")}`
                    : null,
                ].filter(Boolean);

                return (
                  <Reveal key={s.id} delay={(idx % 2) * 90}>
                    <article className="card-trust group flex h-full flex-col p-7 transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_45px_-20px_rgba(22,41,74,0.35)]">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy text-gold">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-6 w-6">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                            </svg>
                          </span>
                          <h3 className="font-serif text-xl font-bold text-navy">{s.name}</h3>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            open ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {open ? "Open" : "Closed"}
                        </span>
                      </div>

                      {s.description && (
                        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
                      )}

                      {/* Attribute chips: Application Fee • Eligibility • Deadline */}
                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-border bg-muted p-4">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-4 w-4 text-gold-600">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Application Fee
                          </div>
                          <p className="mt-2 text-xl font-bold text-navy">
                            ₹{Number(s.applicationFee).toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="rounded-xl border border-border bg-muted p-4">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-4 w-4 text-gold-600">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                            </svg>
                            Application Deadline
                          </div>
                          <p className="mt-2 text-xl font-bold text-navy">
                            {s.applicationDeadline ? formatDeadline(s.applicationDeadline) : "Open"}
                          </p>
                        </div>
                      </div>

                      {eligibilityBits.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-full bg-gold-soft px-3 py-1 text-xs font-semibold text-navy-800">
                            Eligibility
                          </span>
                          {eligibilityBits.slice(0, 2).map((bit) => (
                            <span key={bit} className="inline-flex rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                              {bit}
                            </span>
                          ))}
                        </div>
                      )}
                    </article>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
