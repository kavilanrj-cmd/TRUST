"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { useHomeContent } from "@/lib/home-content";
import { Reveal } from "./Reveal";

interface ScholarOption {
  id: string;
  name: string;
  educationLevels: string[];
  minimumMarks: number | null;
  minimumCGPA: number | null;
  maximumFamilyIncome: number | null;
}

interface CheckResult {
  eligible: boolean;
  scholarshipId: string;
  scholarshipName: string;
  reason: string | null;
}

type FormErrors = {
  scholarship?: string;
  educationLevel?: string;
  marks?: string;
  familyIncome?: string;
};

const inputClass = "field-input";
const errClass = "mt-1 text-sm text-destructive";

export function EligibilityChecker() {
  const { t } = useHomeContent();
  const [scholarships, setScholarships] = useState<ScholarOption[]>([]);
  const [scholarshipId, setScholarshipId] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [marks, setMarks] = useState("");
  const [familyIncome, setFamilyIncome] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/scholarships`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load scholarships");
        const data = (await res.json()) as ScholarOption[];
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setScholarships(data);
          setScholarshipId(data[0].id);
        }
      } catch {
        if (!cancelled) setApiError("Unable to load scholarship options.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function validate(): boolean {
    const next: FormErrors = {};
    if (!scholarshipId) next.scholarship = "Select a scholarship.";
    if (!educationLevel) next.educationLevel = "Select your education level.";
    const m = Number(marks);
    if (marks === "" || Number.isNaN(m) || m < 0) next.marks = "Enter a valid marks / CGPA value.";
    const inc = Number(familyIncome);
    if (familyIncome === "" || Number.isNaN(inc) || inc < 0)
      next.familyIncome = "Enter a valid family income.";
    setErrors(next);
    setResult(null);
    setApiError(null);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setChecking(true);

    const selected = scholarships.find((s) => s.id === scholarshipId);

    // Client-side quick check against the selected program's published criteria
    const marksNum = Number(marks);
    const incomeNum = Number(familyIncome);

    let quick: CheckResult | null = null;
    if (selected) {
      const levelOk =
        !selected.educationLevels ||
        selected.educationLevels.length === 0 ||
        selected.educationLevels.includes(educationLevel);
      const marksOk =
        (selected.minimumMarks == null || marksNum >= selected.minimumMarks) &&
        (selected.minimumCGPA == null || marksNum >= selected.minimumCGPA);
      const incomeOk =
        selected.maximumFamilyIncome == null || incomeNum <= selected.maximumFamilyIncome;

      if (!levelOk) {
        quick = {
          eligible: false,
          scholarshipId: selected.id,
          scholarshipName: selected.name,
          reason: `Education level "${educationLevel}" is not eligible for this scholarship.`,
        };
      } else if (!marksOk) {
        quick = {
          eligible: false,
          scholarshipId: selected.id,
          scholarshipName: selected.name,
          reason: "Your marks / CGPA do not meet the minimum requirement for this scholarship.",
        };
      } else if (!incomeOk) {
        quick = {
          eligible: false,
          scholarshipId: selected.id,
          scholarshipName: selected.name,
          reason: "Family income exceeds the permitted limit for this scholarship.",
        };
      }
    }

    // Confirm with the backend for authoritative evaluation
    try {
      const res = await fetch(`${API_BASE_URL}/api/scholarships/eligibility-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scholarshipId,
          educationLevel,
          marks: marksNum,
          familyIncome: incomeNum,
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error || "Failed to check eligibility");
      }
      const data = (await res.json()) as CheckResult;
      setResult(data);
    } catch (err) {
      // If the backend is unreachable, fall back to the client-side quick check.
      if (quick) {
        setResult(quick);
      } else {
        setResult({
          eligible: true,
          scholarshipId,
          scholarshipName: selected?.name ?? "",
          reason: null,
        });
        setApiError(
          err instanceof Error && err.message
            ? `Note: could not reach the live check (${err.message}). Showing an indicative result based on published criteria.`
            : "Note: could not reach the live check. Showing an indicative result based on published criteria."
        );
      }
    } finally {
      setChecking(false);
    }
  }

  return (
    <section id="eligibility" className="bg-white">
      <div className="container-trust section-pad">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">{t("home.eligibility.eyebrow", "Eligibility Checker")}</span>
          <h2 className="h2-section mt-4">{t("home.eligibility.title", "Check Your Eligibility")}</h2>
          <p className="mt-4 text-muted-foreground">
            {t(
              "home.eligibility.description",
              "Answer a few questions to see if you qualify for our scholarship program."
            )}
          </p>
        </div>

        <Reveal className="mx-auto mt-12 max-w-2xl">
          <div className="card-trust p-7 sm:p-10">
            <form onSubmit={handleSubmit} noValidate>
              <div className="grid gap-5">
                {scholarships.length > 1 && (
                  <div>
                    <label htmlFor="el-scholarship" className="field-label">
                      Scholarship Program
                    </label>
                    <select
                      id="el-scholarship"
                      className={inputClass}
                      value={scholarshipId}
                      onChange={(e) => {
                        setScholarshipId(e.target.value);
                        setErrors((p) => ({ ...p, scholarship: undefined }));
                      }}
                    >
                      {scholarships.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    {errors.scholarship && <p className={errClass}>{errors.scholarship}</p>}
                  </div>
                )}

                <div>
                  <label htmlFor="el-level" className="field-label">
                    Education Level
                  </label>
                  <select
                    id="el-level"
                    className={inputClass}
                    value={educationLevel}
                    onChange={(e) => {
                      setEducationLevel(e.target.value);
                      setErrors((p) => ({ ...p, educationLevel: undefined }));
                    }}
                  >
                    <option value="">Select education level</option>
                    <option value="HIGH_SCHOOL">High School</option>
                    <option value="DIPLOMA">Diploma</option>
                    <option value="UNDERGRADUATE">Undergraduate</option>
                    <option value="POSTGRADUATE">Postgraduate</option>
                  </select>
                  {errors.educationLevel && <p className={errClass}>{errors.educationLevel}</p>}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="el-marks" className="field-label">
                      Marks / CGPA
                    </label>
                    <input
                      id="el-marks"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      placeholder="e.g. 75 or 8.5"
                      className={inputClass}
                      value={marks}
                      onChange={(e) => {
                        setMarks(e.target.value);
                        setErrors((p) => ({ ...p, marks: undefined }));
                      }}
                    />
                    {errors.marks && <p className={errClass}>{errors.marks}</p>}
                  </div>
                  <div>
                    <label htmlFor="el-income" className="field-label">
                      Family Income (₹ / year)
                    </label>
                    <input
                      id="el-income"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      placeholder="e.g. 250000"
                      className={inputClass}
                      value={familyIncome}
                      onChange={(e) => {
                        setFamilyIncome(e.target.value);
                        setErrors((p) => ({ ...p, familyIncome: undefined }));
                      }}
                    />
                    {errors.familyIncome && <p className={errClass}>{errors.familyIncome}</p>}
                  </div>
                </div>
              </div>

              <button type="submit" disabled={checking} className="btn-primary mt-7 w-full">
                {checking ? "Checking…" : t("home.eligibility.submitLabel", "Check Eligibility")}
              </button>

              <p className="mt-4 text-center text-sm text-muted-foreground">
                {t(
                  "home.eligibility.helpText",
                  "This quick check gives you an indicative result. Final eligibility is determined during the formal review."
                )}
              </p>
            </form>

            {apiError && (
              <p className="mt-5 rounded-lg bg-gold-soft px-4 py-3 text-sm text-navy-800">{apiError}</p>
            )}

            {result && (
              <div
                className={`mt-7 overflow-hidden rounded-2xl border ${
                  result.eligible
                    ? "border-success/30 bg-success/5"
                    : "border-destructive/30 bg-destructive/5"
                }`}
                role="status"
              >
                <div className="flex items-center gap-3 border-b border-black/5 px-6 py-4">
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${
                      result.eligible ? "bg-success text-white" : "bg-destructive text-white"
                    }`}
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-5 w-5">
                      {result.eligible ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      )}
                    </svg>
                  </span>
                  <div>
                    <p className="text-lg font-bold text-navy">
                      {result.eligible ? "You are eligible!" : "Not eligible at this time"}
                    </p>
                    {result.scholarshipName && (
                      <p className="text-sm text-muted-foreground">{result.scholarshipName}</p>
                    )}
                  </div>
                </div>

                <div className="px-6 py-5">
                  {result.reason && (
                    <p className="text-sm leading-relaxed text-muted-foreground">{result.reason}</p>
                  )}

                  {result.eligible ? (
                    <div>
                      <p className="text-sm font-medium text-navy">Next steps:</p>
                      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                        <li>Create an account on the trust portal.</li>
                        <li>Complete the online application form.</li>
                        <li>Upload the required documents.</li>
                        <li>Pay the application fee and submit.</li>
                      </ol>
                      <a href="#apply" className="btn-gold mt-5">
                        Apply Now
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      You may still be eligible under other criteria or future programs. Contact the Trust for
                      guidance, or review the requirements again.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
