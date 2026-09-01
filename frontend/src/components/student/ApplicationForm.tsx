"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { DocumentUpload } from "./DocumentUpload";

type StepStatus = "complete" | "current" | "todo";

const STEPS = [
  { id: 0, label: "Personal" },
  { id: 1, label: "Contact" },
  { id: 2, label: "Education" },
  { id: 3, label: "Family" },
  { id: 4, label: "Documents" },
  { id: 5, label: "Review" },
] as const;

type Scholarship = { id: string; name: string };

type FormData = {
  scholarshipId: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  street: string;
  city: string;
  district: string;
  state: string;
  pinCode: string;
  guardianName: string;
  relationship: string;
  occupation: string;
  contactNumber: string;
  schoolCollege: string;
  course: string;
  educationLevel: string;
  academicYear: string;
  yearOfStudy: string;
  familyIncome: string;
  incomeSource: string;
};

const EMPTY_FORM: FormData = {
  scholarshipId: "",
  fullName: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
  street: "",
  city: "",
  district: "",
  state: "",
  pinCode: "",
  guardianName: "",
  relationship: "",
  occupation: "",
  contactNumber: "",
  schoolCollege: "",
  course: "",
  educationLevel: "",
  academicYear: "",
  yearOfStudy: "",
  familyIncome: "",
  incomeSource: "",
};

type Errors = Partial<Record<keyof FormData, string>>;

type LoadedApplication = {
  id: string;
  status: string;
  applicationId: string;
  scholarshipProgramId: string;
  personalDetails?: {
    fullName?: string | null;
    dateOfBirth?: string | Date | null;
    gender?: string | null;
    phone?: string | null;
  } | null;
  address?: {
    street?: string | null;
    city?: string | null;
    district?: string | null;
    state?: string | null;
    pinCode?: string | null;
  } | null;
  parentGuardian?: {
    guardianName?: string | null;
    relationship?: string | null;
    occupation?: string | null;
    contactNumber?: string | null;
  } | null;
  academicDetails?: {
    schoolCollege?: string | null;
    course?: string | null;
    educationLevel?: string | null;
    academicYear?: string | null;
    yearOfStudy?: number | null;
  } | null;
  financialDetails?: {
    familyIncome?: number | null;
    incomeSource?: string | null;
  } | null;
};

const PIN_RX = /^[0-9]{6}$/;
const PHONE_RX = /^[6-9][0-9]{9}$/;

function classifyStep(stepIndex: number, currentStep: number): StepStatus {
  if (stepIndex < currentStep) return "complete";
  if (stepIndex === currentStep) return "current";
  return "todo";
}

export function ApplicationForm() {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loadingScholarships, setLoadingScholarships] = useState(true);

  // API wiring state
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [appEditingId, setAppEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formNotice, setFormNotice] = useState<{ type: "error" | "info" | "success"; text: string } | null>(null);
  const [showDeclaration, setShowDeclaration] = useState(false);
  const [declarationError, setDeclarationError] = useState<string | null>(null);

  // Success state
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Uploaded document count (from DocumentUpload)
  const [docCount, setDocCount] = useState(0);

  // Load scholarships
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/scholarships`)
      .then((r) => r.json())
      .then((data: Scholarship[]) => {
        setScholarships(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length === 1) {
          setForm((f) => ({ ...f, scholarshipId: data[0].id }));
        }
      })
      .catch(() => setScholarships([]))
      .finally(() => setLoadingScholarships(false));

    // Try to resume an existing draft
    fetch(`${API_BASE_URL}/api/applications/me`, { credentials: "include" })
      .then((r) => r.json())
      .then((data: { application?: LoadedApplication | null }) => {
        const app = data.application;
        if (!app) return;
        if (app.status === "DRAFT") {
          setApplicationId(app.applicationId);
          setAppEditingId(app.id);
          const pd = app.personalDetails || {};
          const ad = app.address || {};
          const pg = app.parentGuardian || {};
          const ac = app.academicDetails || {};
          const fin = app.financialDetails || {};
          setForm((f) => ({
            ...f,
            scholarshipId: app.scholarshipProgramId || f.scholarshipId,
            fullName: pd.fullName || "",
            dateOfBirth: pd.dateOfBirth ? String(pd.dateOfBirth).slice(0, 10) : "",
            gender: pd.gender || "",
            phone: pd.phone || "",
            street: ad.street || "",
            city: ad.city || "",
            district: ad.district || "",
            state: ad.state || "",
            pinCode: ad.pinCode || "",
            guardianName: pg.guardianName || "",
            relationship: pg.relationship || "",
            occupation: pg.occupation || "",
            contactNumber: pg.contactNumber || "",
            schoolCollege: ac.schoolCollege || "",
            course: ac.course || "",
            educationLevel: ac.educationLevel || "",
            academicYear: ac.academicYear || "",
            yearOfStudy: ac.yearOfStudy != null ? String(ac.yearOfStudy) : "",
            familyIncome: fin.familyIncome != null ? String(fin.familyIncome) : "",
            incomeSource: fin.incomeSource || "",
          }));
        }
      })
      .catch(() => {
        /* not authenticated or no application */
      })
      .finally(() => setInitialLoading(false));
  }, []);

  const set = useCallback(
    (key: keyof FormData, value: string) => {
      setForm((f) => ({ ...f, [key]: value }));
      if (errors[key]) {
        setErrors((e) => ({ ...e, [key]: undefined }));
      }
    },
    [errors]
  );

  const validateStep = useCallback((step: number, data: FormData): Errors => {
    const e: Errors = {};
    if (step === 0) {
      if (!data.scholarshipId) e.scholarshipId = "Please select a scholarship program.";
      if (!data.fullName.trim()) e.fullName = "Please enter your full name.";
      if (!data.dateOfBirth) e.dateOfBirth = "Please enter your date of birth.";
      if (!data.gender) e.gender = "Please select your gender.";
      if (!data.phone.trim()) e.phone = "Please enter your phone number.";
      else if (!PHONE_RX.test(data.phone.trim())) e.phone = "Please enter a valid 10-digit mobile number.";
    }
    if (step === 1) {
      if (!data.street.trim()) e.street = "Please enter your street address.";
      if (!data.city.trim()) e.city = "Please enter your city.";
      if (!data.district.trim()) e.district = "Please enter your district.";
      if (!data.state) e.state = "Please select your state.";
      if (!data.pinCode.trim()) e.pinCode = "Please enter your PIN code.";
      else if (!PIN_RX.test(data.pinCode.trim())) e.pinCode = "Please enter a valid 6-digit PIN code.";
    }
    if (step === 2) {
      if (!data.schoolCollege.trim()) e.schoolCollege = "Please enter your school/college name.";
      if (!data.educationLevel) e.educationLevel = "Please select your education level.";
      if (!data.academicYear.trim()) e.academicYear = "Please enter your academic year.";
      if (!data.yearOfStudy.trim()) e.yearOfStudy = "Please enter your year of study.";
      else {
        const y = Number(data.yearOfStudy);
        if (Number.isNaN(y) || y < 1 || y > 6) e.yearOfStudy = "Year of study must be between 1 and 6.";
      }
    }
    if (step === 3) {
      if (!data.guardianName.trim()) e.guardianName = "Please enter your parent/guardian name.";
      if (!data.relationship) e.relationship = "Please select the relationship.";
      if (!data.occupation.trim()) e.occupation = "Please enter the occupation.";
      if (!data.contactNumber.trim()) e.contactNumber = "Please enter the contact number.";
      else if (!PHONE_RX.test(data.contactNumber.trim())) e.contactNumber = "Please enter a valid mobile number.";
      if (!data.familyIncome.trim()) e.familyIncome = "Please enter the family income.";
      else if (Number(data.familyIncome) < 0) e.familyIncome = "Family income cannot be negative.";
      if (!data.incomeSource) e.incomeSource = "Please select the income source.";
    }
    return e;
  }, []);

  const goBack = useCallback(() => {
    setFormNotice(null);
    setErrors({});
    setCurrentStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Save draft (create or update) then move next
  const saveAndContinue = useCallback(async () => {
    const e = validateStep(currentStep, form);
    if (Object.keys(e).length > 0) {
      setErrors(e);
      setFormNotice({ type: "error", text: "Please correct the highlighted fields before continuing." });
      return;
    }
    setErrors({});
    setFormNotice(null);
    setSaving(true);
    try {
      const payload = {
        scholarshipProgramId: form.scholarshipId,
        personalDetails: {
          fullName: form.fullName,
          dateOfBirth: form.dateOfBirth,
          gender: form.gender,
          phone: form.phone,
        },
        address: {
          street: form.street,
          city: form.city,
          district: form.district,
          state: form.state,
          pinCode: form.pinCode,
        },
        parentGuardian: {
          guardianName: form.guardianName,
          relationship: form.relationship,
          occupation: form.occupation,
          contactNumber: form.contactNumber,
        },
        academicDetails: {
          schoolCollege: form.schoolCollege,
          course: form.course,
          educationLevel: form.educationLevel,
          academicYear: form.academicYear,
          yearOfStudy: form.yearOfStudy ? Number(form.yearOfStudy) : undefined,
        },
        financialDetails: {
          familyIncome: form.familyIncome ? Number(form.familyIncome) : undefined,
          incomeSource: form.incomeSource,
        },
      };

      let nextApplicationId = applicationId;
      let nextAppId = appEditingId;

      if (appEditingId && applicationId) {
        // PATCH existing draft
        const res = await fetch(`${API_BASE_URL}/api/applications/${appEditingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Could not save your application.");
        }
      } else {
        // Create new draft
        const res = await fetch(`${API_BASE_URL}/api/applications/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("Please log in to save your application.");
          }
          if (res.status === 409 && data.applicationId) {
            // Already have an application; switch to edit mode
            nextApplicationId = data.applicationId;
            setFormNotice({ type: "info", text: "You already have an application. We have resumed it for you — please review and submit." });
            // fetch the app id
            const meRes = await fetch(`${API_BASE_URL}/api/applications/me`, { credentials: "include" });
            const meData = await meRes.json();
            nextAppId = meData.application?.id || null;
          } else {
            throw new Error(data.error || "Could not save your application.");
          }
        } else {
          nextApplicationId = data.application?.applicationId || null;
          nextAppId = data.application?.id || null;
        }
      }

      setApplicationId(nextApplicationId);
      setAppEditingId(nextAppId);
      setCurrentStep((s) => Math.min(s + 1, 5));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setFormNotice({ type: "error", text: err instanceof Error ? err.message : "Could not save your application." });
    } finally {
      setSaving(false);
    }
  }, [currentStep, form, validateStep, applicationId, appEditingId]);

  const goToStep = useCallback((step: number) => {
    setFormNotice(null);
    setErrors({});
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const submitApplication = useCallback(async () => {
    if (!showDeclaration) {
      setDeclarationError("Please confirm that the information provided is true and complete.");
      return;
    }
    setDeclarationError(null);
    if (!appEditingId) {
      setFormNotice({ type: "error", text: "Please save your application before submitting." });
      return;
    }
    setSubmitting(true);
    setFormNotice(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/applications/${appEditingId}/submit`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not submit your application. Please try again.");
      }
      setSubmittedRef(data.applicationId || applicationId || null);
    } catch (err) {
      setFormNotice({ type: "error", text: err instanceof Error ? err.message : "Could not submit your application." });
      setSubmitting(false);
    }
  }, [showDeclaration, appEditingId, applicationId]);

  const fileTypeLabel = useMemo(() => {
    if (form.scholarshipId && scholarships.length) {
      const s = scholarships.find((x) => x.id === form.scholarshipId);
      return s?.name || "";
    }
    return "";
  }, [form.scholarshipId, scholarships]);

  if (initialLoading) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Loading your application…</p>
      </div>
    );
  }

  if (submittedRef) {
    return (
      <div className="card-trust mx-auto max-w-2xl p-8 sm:p-12 text-center">
        <Image
          src="/assets/neelakannu-trust-logo.png"
          alt="Neelakannu Educational Trust logo"
          width={72}
          height={72}
          className="mx-auto h-18 w-18 sm:h-20 sm:w-20"
          priority
        />
        <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-9 w-9 text-success" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="h2-section">Application Submitted Successfully</h2>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          Thank you for applying for educational support from Neelakannu Educational Trust.
        </p>
        {submittedRef && (
          <div className="mt-8 rounded-xl border border-gold/40 bg-gold-soft p-6">
            <p className="text-sm font-medium text-navy-800">Application / Reference Number</p>
            <p className="mt-1 text-2xl font-bold tracking-wide text-navy">{submittedRef}</p>
            <p className="mt-2 text-xs text-muted-foreground">Please keep this reference number for future communication.</p>
          </div>
        )}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/student/dashboard" className="btn-outline">View My Applications</Link>
          <Link href="/" className="btn-gold">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <nav className="card-trust px-5 py-4 sm:px-6" aria-label="Application progress">
        <ol className="flex items-center gap-1 sm:gap-2">
          {STEPS.map((step, i) => {
            const status = classifyStep(i, currentStep);
            const clickable = status === "complete";
            const content = (
              <span className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition
                    ${
                      status === "complete"
                        ? "bg-success text-success-foreground"
                        : status === "current"
                          ? "bg-gold text-navy shadow-sm"
                          : "border border-border bg-muted text-muted-foreground"
                    }`}
                  aria-current={status === "current" ? "step" : undefined}
                >
                  {status === "complete" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-4 w-4" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className={`hidden text-[11px] font-medium sm:block ${
                    status === "current" ? "text-navy" : status === "complete" ? "text-success" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </span>
            );
            return (
              <li key={step.id} className="flex min-w-0 flex-1 items-center">
                {clickable ? (
                  <button type="button" onClick={() => goToStep(i)} className="flex w-full flex-col items-center gap-1" title={`Go to ${step.label}`}>
                    {content}
                  </button>
                ) : (
                  <span className="flex w-full flex-col items-center gap-1">{content}</span>
                )}
                {i < STEPS.length - 1 && (
                  <span
                    className={`mx-1 h-px flex-1 rounded sm:mx-2 ${i < currentStep ? "bg-success" : "bg-border"}`}
                    aria-hidden="true"
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {formNotice && (
        <div
          role="alert"
          className={`rounded-lg border px-4 py-3 text-sm ${
            formNotice.type === "error"
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : formNotice.type === "success"
                ? "border-success/30 bg-success/5 text-success"
                : "border-gold/40 bg-gold-soft text-navy-800"
          }`}
        >
          {formNotice.text}
        </div>
      )}

      <div className="card-trust overflow-hidden">
        <div className="border-b border-border bg-gradient-to-br from-navy-50 to-white px-6 py-5 sm:px-8">
          <p className="eyebrow mb-2">Step {currentStep + 1} of {STEPS.length}</p>
          <h2 className="font-serif text-2xl font-bold text-navy">
            {currentStep === 0 && "Personal Information"}
            {currentStep === 1 && "Contact Information"}
            {currentStep === 2 && "Educational Information"}
            {currentStep === 3 && "Family & Financial Information"}
            {currentStep === 4 && "Document Uploads"}
            {currentStep === 5 && "Review Your Application"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {currentStep === 4
              ? "Upload clear and readable copies of the required documents."
              : currentStep === 5
                ? "Please verify all information below before submitting."
                : `Fields marked with * are required.`}
          </p>
        </div>

        <div className="px-5 py-6 sm:px-8 sm:py-8">
          {currentStep === 0 && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="scholarshipId" className="field-label">Scholarship Program *</label>
                <select
                  id="scholarshipId"
                  className="field-input"
                  value={form.scholarshipId}
                  onChange={(e) => set("scholarshipId", e.target.value)}
                  disabled={loadingScholarships}
                >
                  <option value="">{loadingScholarships ? "Loading scholarships…" : "Select a scholarship program"}</option>
                  {scholarships.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {errors.scholarshipId && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.scholarshipId}</p>}
              </div>
              <div>
                <label htmlFor="fullName" className="field-label">Full Name *</label>
                <input
                  id="fullName"
                  type="text"
                  className="field-input"
                  placeholder="Enter your full name"
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  autoComplete="name"
                />
                {errors.fullName && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.fullName}</p>}
              </div>
              <div>
                <label htmlFor="dateOfBirth" className="field-label">Date of Birth *</label>
                <input
                  id="dateOfBirth"
                  type="date"
                  className="field-input"
                  value={form.dateOfBirth}
                  onChange={(e) => set("dateOfBirth", e.target.value)}
                />
                {errors.dateOfBirth && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.dateOfBirth}</p>}
              </div>
              <div>
                <label htmlFor="gender" className="field-label">Gender *</label>
                <select id="gender" className="field-input" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
                {errors.gender && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.gender}</p>}
              </div>
              <div>
                <label htmlFor="phone" className="field-label">Phone *</label>
                <input
                  id="phone"
                  type="tel"
                  className="field-input"
                  placeholder="Enter your phone number"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="tel"
                />
                {errors.phone && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.phone}</p>}
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="street" className="field-label">Street Address *</label>
                <input
                  id="street"
                  type="text"
                  className="field-input"
                  placeholder="Enter your street address"
                  value={form.street}
                  onChange={(e) => set("street", e.target.value)}
                  autoComplete="street-address"
                />
                {errors.street && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.street}</p>}
              </div>
              <div>
                <label htmlFor="city" className="field-label">City *</label>
                <input
                  id="city"
                  type="text"
                  className="field-input"
                  placeholder="Enter your city"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  autoComplete="address-level2"
                />
                {errors.city && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.city}</p>}
              </div>
              <div>
                <label htmlFor="district" className="field-label">District *</label>
                <input
                  id="district"
                  type="text"
                  className="field-input"
                  placeholder="Enter your district"
                  value={form.district}
                  onChange={(e) => set("district", e.target.value)}
                />
                {errors.district && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.district}</p>}
              </div>
              <div>
                <label htmlFor="state" className="field-label">State *</label>
                <select id="state" className="field-input" value={form.state} onChange={(e) => set("state", e.target.value)}>
                  <option value="">Select state</option>
                  <option>Tamil Nadu</option>
                </select>
                {errors.state && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.state}</p>}
              </div>
              <div>
                <label htmlFor="pinCode" className="field-label">PIN Code *</label>
                <input
                  id="pinCode"
                  type="text"
                  className="field-input"
                  placeholder="Enter PIN code (6 digits)"
                  value={form.pinCode}
                  onChange={(e) => set("pinCode", e.target.value.replace(/[^0-9]/g, ""))}
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  autoComplete="postal-code"
                />
                {errors.pinCode && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.pinCode}</p>}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="schoolCollege" className="field-label">School/College Name *</label>
                <input
                  id="schoolCollege"
                  type="text"
                  className="field-input"
                  placeholder="Enter your school/college name"
                  value={form.schoolCollege}
                  onChange={(e) => set("schoolCollege", e.target.value)}
                />
                {errors.schoolCollege && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.schoolCollege}</p>}
              </div>
              <div>
                <label htmlFor="course" className="field-label">Course</label>
                <input
                  id="course"
                  type="text"
                  className="field-input"
                  placeholder="Enter your course"
                  value={form.course}
                  onChange={(e) => set("course", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="educationLevel" className="field-label">Education Level *</label>
                <select
                  id="educationLevel"
                  className="field-input"
                  value={form.educationLevel}
                  onChange={(e) => set("educationLevel", e.target.value)}
                >
                  <option value="">Select education level</option>
                  <option>High School</option>
                  <option>Undergraduate</option>
                  <option>Postgraduate</option>
                </select>
                {errors.educationLevel && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.educationLevel}</p>}
              </div>
              <div>
                <label htmlFor="academicYear" className="field-label">Academic Year *</label>
                <input
                  id="academicYear"
                  type="text"
                  className="field-input"
                  placeholder="e.g. 2026-2027"
                  value={form.academicYear}
                  onChange={(e) => set("academicYear", e.target.value)}
                />
                {errors.academicYear && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.academicYear}</p>}
              </div>
              <div>
                <label htmlFor="yearOfStudy" className="field-label">Year of Study *</label>
                <input
                  id="yearOfStudy"
                  type="number"
                  className="field-input"
                  placeholder="Enter year of study"
                  value={form.yearOfStudy}
                  onChange={(e) => set("yearOfStudy", e.target.value)}
                  min={1}
                  max={6}
                  inputMode="numeric"
                />
                {errors.yearOfStudy && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.yearOfStudy}</p>}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2 border-b border-border pb-1 text-sm font-semibold uppercase tracking-wide text-navy-700">
                Family / Guardian
              </div>
              <div>
                <label htmlFor="guardianName" className="field-label">Parent/Guardian Name *</label>
                <input
                  id="guardianName"
                  type="text"
                  className="field-input"
                  placeholder="Enter parent/guardian name"
                  value={form.guardianName}
                  onChange={(e) => set("guardianName", e.target.value)}
                />
                {errors.guardianName && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.guardianName}</p>}
              </div>
              <div>
                <label htmlFor="relationship" className="field-label">Relationship *</label>
                <select id="relationship" className="field-input" value={form.relationship} onChange={(e) => set("relationship", e.target.value)}>
                  <option value="">Select relationship</option>
                  <option>Father</option>
                  <option>Mother</option>
                  <option>Guardian</option>
                </select>
                {errors.relationship && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.relationship}</p>}
              </div>
              <div>
                <label htmlFor="occupation" className="field-label">Occupation *</label>
                <input
                  id="occupation"
                  type="text"
                  className="field-input"
                  placeholder="Enter occupation"
                  value={form.occupation}
                  onChange={(e) => set("occupation", e.target.value)}
                />
                {errors.occupation && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.occupation}</p>}
              </div>
              <div>
                <label htmlFor="contactNumber" className="field-label">Contact Number *</label>
                <input
                  id="contactNumber"
                  type="tel"
                  className="field-input"
                  placeholder="Enter contact number"
                  value={form.contactNumber}
                  onChange={(e) => set("contactNumber", e.target.value.replace(/[^0-9]/g, ""))}
                  inputMode="numeric"
                  maxLength={10}
                />
                {errors.contactNumber && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.contactNumber}</p>}
              </div>

              <div className="md:col-span-2 border-b border-border pb-1 text-sm font-semibold uppercase tracking-wide text-navy-700">
                Financial Details
              </div>
              <div>
                <label htmlFor="familyIncome" className="field-label">Family Income (₹) *</label>
                <input
                  id="familyIncome"
                  type="number"
                  className="field-input"
                  placeholder="Enter family income"
                  value={form.familyIncome}
                  onChange={(e) => set("familyIncome", e.target.value)}
                  min={0}
                  inputMode="numeric"
                />
                {errors.familyIncome && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.familyIncome}</p>}
              </div>
              <div>
                <label htmlFor="incomeSource" className="field-label">Income Source *</label>
                <select id="incomeSource" className="field-input" value={form.incomeSource} onChange={(e) => set("incomeSource", e.target.value)}>
                  <option value="">Select income source</option>
                  <option>Agriculture</option>
                  <option>Private Job</option>
                  <option>Government Job</option>
                  <option>Business</option>
                  <option>Other</option>
                </select>
                {errors.incomeSource && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.incomeSource}</p>}
              </div>
            </div>
          )}

          <div className={currentStep === 4 ? "" : "hidden"}>
            <DocumentUpload onCountChange={setDocCount} />
          </div>

          {currentStep === 5 && (
            <div className="space-y-6">
              {applicationId && (
                <div className="rounded-xl border border-gold/40 bg-gold-soft px-4 py-3 text-sm text-navy-800">
                  <strong>Application ID:</strong> {applicationId}
                </div>
              )}
              <div className="space-y-5">
                <ReviewBlock title="Personal Information">
                  <ReviewRow label="Full Name" value={form.fullName} />
                  <ReviewRow label="Date of Birth" value={form.dateOfBirth} />
                  <ReviewRow label="Gender" value={form.gender} />
                  <ReviewRow label="Phone" value={form.phone} />
                </ReviewBlock>
                <ReviewBlock title="Contact Information">
                  <ReviewRow label="Street Address" value={form.street} />
                  <ReviewRow label="City" value={form.city} />
                  <ReviewRow label="District" value={form.district} />
                  <ReviewRow label="State" value={form.state} />
                  <ReviewRow label="PIN Code" value={form.pinCode} />
                </ReviewBlock>
                <ReviewBlock title="Educational Information">
                  <ReviewRow label="School/College" value={form.schoolCollege} />
                  <ReviewRow label="Course" value={form.course} />
                  <ReviewRow label="Education Level" value={form.educationLevel} />
                  <ReviewRow label="Academic Year" value={form.academicYear} />
                  <ReviewRow label="Year of Study" value={form.yearOfStudy} />
                </ReviewBlock>
                <ReviewBlock title="Family & Financial Information">
                  <ReviewRow label="Parent/Guardian" value={form.guardianName} />
                  <ReviewRow label="Relationship" value={form.relationship} />
                  <ReviewRow label="Occupation" value={form.occupation} />
                  <ReviewRow label="Contact Number" value={form.contactNumber} />
                  <ReviewRow label="Family Income" value={form.familyIncome ? `₹${Number(form.familyIncome).toLocaleString("en-IN")}` : ""} />
                  <ReviewRow label="Income Source" value={form.incomeSource} />
                </ReviewBlock>
                <ReviewBlock title="Documents">
                  <ReviewRow label="Uploaded documents" value={docCount > 0 ? `${docCount} document(s) selected` : "No documents selected"} />
                </ReviewBlock>
              </div>

              <div className="rounded-xl border border-border bg-surface-muted p-5">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-5 w-5 rounded border-border text-navy focus:ring-2 focus:ring-navy/30"
                    checked={showDeclaration}
                    onChange={(e) => {
                      setShowDeclaration(e.target.checked);
                      if (e.target.checked) setDeclarationError(null);
                    }}
                  />
                  <span className="text-sm text-foreground">
                    I confirm that the information provided is true and complete.
                  </span>
                </label>
                {declarationError && <p className="mt-2 text-sm text-destructive" role="alert">{declarationError}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex flex-col-reverse items-stretch gap-3 border-t border-border bg-navy-50/50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <button
            type="button"
            onClick={goBack}
            disabled={currentStep === 0}
            className="btn-outline disabled:cursor-not-allowed disabled:opacity-50"
          >
            ← Previous
          </button>

          {currentStep < 5 && (
            <button
              type="button"
              onClick={currentStep === 4 ? () => setCurrentStep(5) : saveAndContinue}
              disabled={saving}
              className="btn-gold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving…" : currentStep === 4 ? "Continue to Review →" : "Save & Continue →"}
            </button>
          )}

          {currentStep === 5 && (
            <button
              type="button"
              onClick={submitApplication}
              disabled={submitting}
              className="btn-gold disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Submitting…" : "Submit Application"}
            </button>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {fileTypeLabel ? `Applying for: ${fileTypeLabel}` : ""}
      </p>
    </div>
  );
}

function ReviewBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy-700">{title}</h3>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}
