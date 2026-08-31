"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

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

export function Scholarships() {
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
          <span className="eyebrow">Apply Today</span>
          <h2 className="h2-section mt-4">Scholarship Opportunities</h2>
          <p className="mt-4 text-muted-foreground">
            Helping deserving students take the next step toward their
            educational goals.
          </p>
        </div>

        <div className="mt-12">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="card-trust h-56 animate-pulse bg-muted" />
              ))}
            </div>
          ) : error ? (
            <div className="card-trust mx-auto max-w-lg p-8 text-center">
              <p className="font-medium text-navy">Scholarship details</p>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Please check back soon or contact the Trust for current
                opportunities.
              </p>
            </div>
          ) : scholarships.length === 0 ? (
            <div className="card-trust mx-auto max-w-lg p-8 text-center">
              <p className="font-medium text-navy">No active scholarships right now</p>
              <p className="mt-2 text-sm text-muted-foreground">
                New scholarship opportunities are announced regularly. Check back
                soon to apply.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {scholarships.map((s) => {
                const open = isOpen(s);
                return (
                  <article key={s.id} className="card-trust group flex flex-col p-7 transition hover:-translate-y-1 hover:shadow-lg">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-serif text-xl font-bold text-navy">{s.name}</h3>
                      <span
                        className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          open ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {open ? "Open" : "Closed"}
                      </span>
                    </div>

                    {s.description && (
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {s.description}
                      </p>
                    )}

                    <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5 text-sm">
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Application Fee
                        </dt>
                        <dd className="mt-1 font-semibold text-navy">
                          ₹{Number(s.applicationFee).toLocaleString("en-IN")}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Deadline
                        </dt>
                        <dd className="mt-1 font-semibold text-navy">
                          {s.applicationDeadline ? formatDeadline(s.applicationDeadline) : "Open"}
                        </dd>
                      </div>
                      {s.maximumFamilyIncome != null && (
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Max Family Income
                          </dt>
                          <dd className="mt-1 font-semibold text-navy">
                            ₹{Number(s.maximumFamilyIncome).toLocaleString("en-IN")}
                          </dd>
                        </div>
                      )}
                      {s.educationLevels && s.educationLevels.length > 0 && (
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Education Level
                          </dt>
                          <dd className="mt-1 font-semibold text-navy">
                            {s.educationLevels.join(", ")}
                          </dd>
                        </div>
                      )}
                    </dl>

                    <div className="mt-6 flex items-center gap-3 pt-1">
                      <a
                        href="#eligibility"
                        className="btn-outline flex-1 px-4 py-2.5 text-sm"
                      >
                        Check Eligibility
                      </a>
                      <a
                        href="#apply"
                        className={`flex-1 px-4 py-2.5 text-sm ${
                          open ? "btn-gold" : "btn-outline cursor-not-allowed opacity-60"
                        }`}
                        aria-disabled={!open}
                      >
                        Apply Now
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
