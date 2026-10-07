"use client";





import Image from "next/image";


import Link from "next/link";


import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useMemo, useRef } from "react";
import { AlertCircle, Check, ChevronDown, Search } from "lucide-react";


import { API_BASE_URL } from "@/lib/api";


// Single definition of the Indian mobile format, shared with the login screens so
// the number an applicant registers and the number they sign in with are checked
// by the same rule.
import { MOBILE_RX as PHONE_RX } from "@/lib/login-identity";


// Candidate edit window. The values come from the backend; the browser never
// works out the deadline for itself.
import {
  type Editability,
  canEditApplication,
  editWindowNotice,
  isApprovedLock,
  isExpiredLock,
  readEditability,
} from "@/lib/application-editability";


// Real per-step completeness of the stored draft, shared with the dashboard so the
// "Continue Application" link and the dashboard indicator can never disagree.
import { evaluateApplicationProgress, resolveAcademicType as resolveAcademicBranch } from "@/lib/application-progress";


import { DocumentUpload } from "./DocumentUpload";





type StepStatus = "complete" | "current" | "todo";





const STEPS = [


  { id: 0, label: "Personal" },


  { id: 1, label: "Contact" },


  { id: 2, label: "Academic" },


  { id: 3, label: "Family" },


  { id: 4, label: "Bank Details" },


  { id: 5, label: "Recommended By" },


  { id: 6, label: "Documents" },


  { id: 7, label: "Review" },


  { id: 8, label: "Payment" },


] as const;


// Step 6 (Documents) has no per-field form state of its own — documents upload straight to the

// application record — but the backend refuses a submission without at least one

// document, so the applicant is stopped on the step itself instead of at submit.
const DOCUMENTS_REQUIRED_NOTICE =
  "Please upload at least one supporting document before continuing to Review.";


// Zero-based step requested by the dashboard link /student/application?step=N.
// Read from window.location rather than useSearchParams so this client-only page
// keeps its current static rendering and needs no Suspense boundary. Anything
// missing, non-numeric or out of range falls back to the first step.
function readRequestedStep(): number {
  if (typeof window === "undefined") return 0;
  const raw = new URLSearchParams(window.location.search).get("step");
  if (raw == null) return 0;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) return 0;
  return Math.min(Math.max(parsed, 0), STEPS.length - 1);
}


const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];





interface StateSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}

/**
 * Searchable State combobox. Keeps the native <select> look and feel via
 * `field-input`, but adds an embedded search box, full keyboard support
 * (arrows / Enter / Escape / type-ahead) and a visible check on the current
 * selection. The stored value is still the plain state name, so previously
 * saved applications continue to load unchanged.
 */
function StateSelect({ id, value, onChange, invalid }: StateSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [firstLetter, setFirstLetter] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const typeaheadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Matches anywhere in the name, but names *starting* with the query rank
  // first so "Ta" surfaces Tamil Nadu rather than Karnataka.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return INDIAN_STATES;
    const starts: string[] = [];
    const contains: string[] = [];
    for (const s of INDIAN_STATES) {
      const i = s.toLowerCase().indexOf(q);
      if (i === 0) starts.push(s);
      else if (i > 0) contains.push(s);
    }
    return [...starts, ...contains];
  }, [query]);

  const close = () => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  };

  const commit = (state: string) => {
    onChange(state);
    close();
  };

  // Close when clicking or tabbing outside the combobox.
  useEffect(() => {
    if (!open) return;
    const onDocPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDocPointerDown);
    return () => document.removeEventListener("mousedown", onDocPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  // Clamp the highlight when the filtered list shrinks under the cursor.
  // Derived during render rather than in an effect, to avoid an extra pass.
  const safeIndex = results.length === 0 ? 0 : Math.min(activeIndex, results.length - 1);

  // Keep the highlighted option in view during keyboard navigation.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[safeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [open, safeIndex]);

  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex(value ? Math.max(0, INDIAN_STATES.indexOf(value)) : 0);
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (e.key.length === 1 && /\S/.test(e.key)) {
      // Type-ahead on the collapsed control: "t" jumps to the first match.
      const letter = e.key.toLowerCase();
      setFirstLetter(letter);
      setQuery(letter);
      setOpen(true);
      setActiveIndex(0);
      if (typeaheadTimer.current) clearTimeout(typeaheadTimer.current);
      typeaheadTimer.current = setTimeout(() => setFirstLetter(null), 700);
    }
  };

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[safeIndex]) commit(results[safeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(Math.max(0, results.length - 1));
    } else if (e.key === "Tab") {
      close();
    }
  };

  const activeId = results[safeIndex] ? `${id}-opt-${safeIndex}` : undefined;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => (open ? close() : setOpen(true))}
        onKeyDown={onTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        data-invalid={invalid || undefined}
        className={`field-input flex items-center justify-between gap-2 text-left ${
          open ? "border-navy ring-2 ring-navy/15 dark:border-gold dark:ring-gold/30" : ""
        }`}
      >
        <span className={value ? "" : "text-muted-foreground"}>
          {value || "Select state"}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute z-40 mt-1.5 w-full overflow-hidden rounded-lg border border-border bg-white shadow-[0_12px_32px_-12px_rgba(22,41,74,0.35)] dark:border-slate-700 dark:bg-[#131a2e]">
          <div className="relative border-b border-border p-2 dark:border-slate-700">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              ref={searchRef}
              type="text"
              value={firstLetter ?? query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onSearchKeyDown}
              placeholder="Search state..."
              aria-label="Search state"
              aria-controls={`${id}-listbox`}
              aria-autocomplete="list"
              aria-activedescendant={activeId}
              role="combobox"
              aria-expanded
              className="w-full rounded-md border border-input bg-white py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15 dark:border-white/15 dark:bg-[#0f1a30] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-gold dark:focus:ring-gold/30"
            />
          </div>

          <ul
            ref={listRef}
            id={`${id}-listbox`}
            role="listbox"
            aria-label="Indian states and union territories"
            className="max-h-60 overflow-y-auto overscroll-contain py-1"
          >
            {results.length === 0 && (
              <li className="px-4 py-3 text-sm text-muted-foreground">No states found</li>
            )}
            {results.map((s, i) => {
              const selected = s === value;
              return (
                <li key={s}>
                  <button
                    type="button"
                    id={`${id}-opt-${i}`}
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => commit(s)}
                    className={`flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm transition-colors ${
                      i === safeIndex
                        ? "bg-navy-50 text-navy dark:bg-[#1d2740] dark:text-white"
                        : "text-foreground"
                    }`}
                  >
                    <span>{s}</span>
                    {selected && (
                      <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-gold-600" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}


type AcademicType = "" | "school" | "college";



type FamilyStatus = "PARENTS" | "SINGLE_PARENT" | "NO_PARENTS";





// Convert DD/MM/YYYY to YYYY-MM-DD for API


function toApiDate(ddMmYyyy: string): string {


  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(ddMmYyyy.trim());


  if (!m) return "";


  const day = Number(m[1]);


  const month = Number(m[2]);


  const year = Number(m[3]);


  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > new Date().getFullYear()) return "";


  const d = new Date(year, month - 1, day);


  if (d.getDate() !== day || d.getMonth() !== month - 1 || d.getFullYear() !== year) return "";


  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


}





// Convert YYYY-MM-DD (API) to DD/MM/YYYY for display


function toDisplayDate(yyyyMmDd: string): string {


  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(yyyyMmDd || "");


  if (!m) return "";


  return `${m[3]}/${m[2]}/${m[1]}`;


}





// Validate DD/MM/YYYY format and return error message or null


function validateDob(ddMmYyyy: string): string | null {


  if (!ddMmYyyy.trim()) return "Please enter your date of birth.";


  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(ddMmYyyy.trim())) return "Enter date in DD/MM/YYYY format.";


  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(ddMmYyyy.trim());


  if (!m) return "Enter date in DD/MM/YYYY format.";


  const day = Number(m[1]);


  const month = Number(m[2]);


  const year = Number(m[3]);


  const today = new Date();


  const currentYear = today.getFullYear();


  if (year < 1900 || year > currentYear) return "Enter a valid year between 1900 and " + currentYear + ".";


  const d = new Date(year, month - 1, day);


  if (d.getDate() !== day || d.getMonth() !== month - 1 || d.getFullYear() !== year) return "Invalid date (e.g., 31/02/2000).";


  if (d > today) return "Date of birth cannot be in the future.";


  return null;


}





type FormData = {


  certificateName: string;


  bankRecordName: string;


  dateOfBirth: string;


  gender: string;


  phone: string;


  doorNumber: string;


  street: string;


  city: string;


  district: string;


  state: string;


  pinCode: string;


  guardianName: string;


  relationship: string;


  occupation: string;


  contactNumber: string;


  familyStatus: FamilyStatus;


  parent2Name: string;


  parent2Relationship: string;


  // Mother's name. Only collected for the "Parents" status, which is why it is
  // persisted separately from parent2Name (the "No Parents" second-person slot).
  motherName: string;


  isSingleParent: boolean;


  academicType: AcademicType;


  schoolName: string;


  schoolAddress: string;


  className: string;


  section: string;


  collegeName: string;


  collegeAddress: string;


  course: string;


  semester: string;


  ugPg: string;


  academicYear: string;


  familyIncome: string;


  incomeSource: string;


  scholarshipAmount: string;


  accountHolderName: string;


  accountNumber: string;


  bankName: string;


  branchName: string;


  ifscCode: string;


  // Recommended By. Recommender 1 is required; recommender 2 is optional, so all
  // three of its values may be left empty.
  recommender1Name: string;


  recommender1Designation: string;


  recommender1Mobile: string;


  recommender2Name: string;


  recommender2Designation: string;


  recommender2Mobile: string;

};





const EMPTY_FORM: FormData = {


  certificateName: "",


  bankRecordName: "",


  dateOfBirth: "",


  gender: "",


  phone: "",


  doorNumber: "",


  street: "",


  city: "",


  district: "",


  state: "",


  pinCode: "",


  guardianName: "",


  relationship: "",


  occupation: "",


  contactNumber: "",


  familyStatus: "PARENTS",


  parent2Name: "",


  parent2Relationship: "",


  motherName: "",


  isSingleParent: false,


  academicType: "",


  schoolName: "",


  schoolAddress: "",


  className: "",


  section: "",


  collegeName: "",


  collegeAddress: "",


  course: "",


  semester: "",


  ugPg: "",


  academicYear: "",


  familyIncome: "",


  incomeSource: "",


  scholarshipAmount: "",


  accountHolderName: "",


  accountNumber: "",


  bankName: "",


  branchName: "",


  ifscCode: "",


  recommender1Name: "",


  recommender1Designation: "",


  recommender1Mobile: "",


  recommender2Name: "",


  recommender2Designation: "",


  recommender2Mobile: "",

};





type Errors = Partial<Record<keyof FormData, string>>;





type LoadedApplication = {


  id: string;


  status: string;


  // Decided by the backend from its own clock and the stored submittedAt. The
  // form never recomputes it.
  editability?: Editability | null;


  applicationId: string;


  declarationAccepted?: boolean | null;


  personalDetails?: {


    fullName?: string | null;


    bankRecordName?: string | null;


    dateOfBirth?: string | Date | null;


    gender?: string | null;


    phone?: string | null;


    idProofNumber?: string | null;


  } | null;


  address?: {


    street?: string | null;


    doorNumber?: string | null;


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


    isSingleParent?: boolean | null;


    income?: number | null;


    parent2Name?: string | null;


    parent2Relationship?: string | null;

    motherName?: string | null;


  } | null;


  academicDetails?: {


    schoolCollege?: string | null;


    schoolName?: string | null;


    schoolAddress?: string | null;


    collegeName?: string | null;


    collegeAddress?: string | null;


    academicType?: string | null;


    course?: string | null;


    educationLevel?: string | null;


    academicYear?: string | null;


    yearOfStudy?: string | null;


    className?: string | null;


    section?: string | null;


    semester?: string | null;


    ugPg?: string | null;


    marksPercentageCGPA?: string | null;


  } | null;


  financialDetails?: {


    familyIncome?: number | null;


    incomeSource?: string | null;


    scholarshipAmount?: number | null;


  } | null;


  bankDetails?: {

    accountHolderName?: string | null;

    accountNumber?: string | null;

    bankName?: string | null;

    branchName?: string | null;

    ifscCode?: string | null;

  } | null;


  // Absent on applications created before the Recommended By step existed.
  // The legacy `*Roll` keys are only read so a value stored under the old name by
  // an already deployed backend still loads; the API now returns `*Designation`.
  recommenderDetails?: {

    recommender1Name?: string | null;

    recommender1Designation?: string | null;

    recommender1Mobile?: string | null;

    recommender2Name?: string | null;

    recommender2Designation?: string | null;

    recommender2Mobile?: string | null;

    recommender1Roll?: string | null;

    recommender2Roll?: string | null;

  } | null;

};





const PIN_RX = /^[0-9]{6}$/;


// IFSC: 4 letters (bank code) + "0" + 6 alphanumeric characters, e.g. SBIN0001234.
const IFSC_RX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

// Bank account numbers are 9-18 digits in India.
const ACCOUNT_RX = /^[0-9]{9,18}$/;

// Masks a bank account number for display, keeping the last four digits so
// the applicant (or an admin reviewing the application) can still tell two
// accounts apart without the full number being on screen.
const maskAccountNumber = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 4) return digits;
  return `\u2022\u2022\u2022\u2022 ${digits.slice(-4)}`;
};

// Scholarship amounts are rupee values; allow up to 2 decimal places (paise).
const AMOUNT_RX = /^[0-9]+(\.[0-9]{1,2})?$/;

// Upper bound guard so a typo cannot request an absurd amount (₹ 1 crore).
const MAX_SCHOLARSHIP_AMOUNT = 10000000;





// Determine which branch of the Academic step an existing application belongs
// to. Applications created before `academicType` was reliably stored only have
// the legacy `schoolCollege` value, so infer the branch from the surrounding
// data instead of leaving the applicant on an unselected choice. The rule lives
// in `application-progress.ts` so the dashboard indicator and this step can never
// disagree about which branch a stored application is on.
function resolveAcademicType(ac: {
  academicType?: string | null;
  schoolName?: string | null;
  collegeName?: string | null;
  className?: string | null;
  course?: string | null;
  semester?: string | null;
  schoolCollege?: string | null;
}): AcademicType {
  return resolveAcademicBranch(ac);
}


// Every step in the indicator is a button, so a step that has not been reached yet

// still reads as an interactive target rather than as disabled text.

// `reachedStep` is the furthest step the applicant has legitimately got to; it only

// ever grows, which keeps the completed markers stable while they move backwards.
function classifyStep(stepIndex: number, currentStep: number, reachedStep: number): StepStatus {


  if (stepIndex === currentStep) return "current";


  if (stepIndex < reachedStep) return "complete";


  return "todo";


}





export function ApplicationForm() {


  const [form, setForm] = useState<FormData>(EMPTY_FORM);


  const [errors, setErrors] = useState<Errors>({});


  const [currentStep, setCurrentStep] = useState(0);


  // Furthest step reached so far. It never decreases, so stepping back to edit an

  // earlier step does not wipe the completed markers off the later ones.
  const [reachedStep, setReachedStep] = useState(0);





  // API wiring state


  const [applicationId, setApplicationId] = useState<string | null>(null);


  const [appEditingId, setAppEditingId] = useState<string | null>(null);


  const [saving, setSaving] = useState(false);


  const [submitting, setSubmitting] = useState(false);


  const [formNotice, setFormNotice] = useState<{ type: "error" | "info" | "success"; text: string } | null>(null);


  // Applicant Declaration acceptance. It is mirrored on the application record


  // (declarationAccepted) so the agreement survives a reload and can be enforced


  // by the backend when the application is submitted.


  const [declarationAccepted, setDeclarationAccepted] = useState(false);


  // True once the server has confirmed the acceptance; false while the PATCH is


  // in flight or has failed, so Submit never races the save.


  const [declarationPersisted, setDeclarationPersisted] = useState(false);


  const [savingDeclaration, setSavingDeclaration] = useState(false);


  const [declarationError, setDeclarationError] = useState<string | null>(null);


  // Candidate edit window, as decided by the backend. null until /me responds,
  // which is treated as "not editable" so the form is never briefly editable for a
  // locked application.

  const [editability, setEditability] = useState<Editability | null>(null);


  const applicationEditable = editability?.editable === true;


  const editNotice = editability ? editWindowNotice(editability) : null;





  // Success state


  const [submittedRef, setSubmittedRef] = useState<string | null>(null);


  const [initialLoading, setInitialLoading] = useState(true);





  // Uploaded document count (from DocumentUpload)


  const [docCount, setDocCount] = useState(0);





  // Payment state


  const [fee, setFee] = useState<{


    amount: number;


    enabled: boolean;


    currency: string;


    paymentMethod?: "manual_upi" | "razorpay";


    upi?: { qrUrl: string; vpa: string; instructions: string; qrConfigured?: boolean };


  } | null>(null);


  const [paymentStatus, setPaymentStatus] = useState<"NO_PAYMENT" | "NOT_SUBMITTED" | "PENDING" | "PENDING_VERIFICATION" | "VERIFIED" | "SUCCESS" | "REJECTED" | "FAILED">("NO_PAYMENT");


  const [paymentNotice, setPaymentNotice] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);


  const [paymentRef, setPaymentRef] = useState<{ paymentId?: string | null; amount?: number | null; txnId?: string | null; verifiedNote?: string | null; verifiedAt?: string | null } | null>(null);


  const [upiTxnId, setUpiTxnId] = useState("");


  const [txnError, setTxnError] = useState<string | null>(null);


  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);


  const [submittedPayment, setSubmittedPayment] = useState<{ status: string; txnId?: string; amount?: number | null } | null>(null);


  const [paymentScreenshot, setPaymentScreenshot] = useState<{ name: string; mime: string; uploadedAt?: string | null } | null>(null);


  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);


  const [screenshotUploading, setScreenshotUploading] = useState(false);


  const [screenshotError, setScreenshotError] = useState<string | null>(null);





  // Try to resume an existing draft


  useEffect(() => {


    fetch(`${API_BASE_URL}/api/applications/me`, { credentials: "include" })


      .then((r) => r.json())


      .then((data: { application?: LoadedApplication | null; editability?: Editability | null }) => {


        const app = data.application;


        if (!app) {

          // No application row yet. /me still carries the server's verdict for the
          // draft the first save creates, so a brand-new applicant starts editable
          // instead of looking locked. Only a verdict the server actually sent is
          // applied; a failed request still leaves it unknown, and unknown stays
          // read-only so a locked application is never briefly editable.
          if (data.editability) setEditability(data.editability);

          return;
        }


        // The backend owns this decision. A submitted application inside its
        // 7-day window has to hydrate here too, so the applicant can view and
        // edit what they submitted instead of landing on a blank wizard.

        const appEditability = readEditability(app);


        setEditability(appEditability);


        // Loaded for every status, locked ones included: an approved or expired
        // application still has to be readable. Whether the fields accept changes
        // is decided by `editability`, not by whether they were populated.


          setApplicationId(app.applicationId);


          setAppEditingId(app.id);


        // Restore a previously saved acceptance so reloading the page does not


        // silently clear what the applicant already agreed to.


        setDeclarationAccepted(app.declarationAccepted === true);


        setDeclarationPersisted(app.declarationAccepted === true);


          const pd = app.personalDetails || {};


          const ad = app.address || {};


          const pg = app.parentGuardian || {};


          const ac = app.academicDetails || {};


          const fin = app.financialDetails || {};


          const bank = app.bankDetails || {};

          // Older applications have no recommender row at all; an empty object
          // keeps the mapping below uniform and the step simply starts blank.
          const rec = app.recommenderDetails || {};


          // Backward compatibility: applications created before the separate
          // school/college fields only have the legacy `schoolCollege` value.
          // Fall back to it so old drafts still load their institution name
          // instead of appearing empty. Never overwrite stored data here.
          const legacySchoolCollege = ac.schoolCollege || "";


          setForm((f) => ({


            ...f,


            certificateName: pd.fullName || "",


            bankRecordName: pd.bankRecordName || "",


            dateOfBirth: pd.dateOfBirth ? toDisplayDate(String(pd.dateOfBirth)) : "",


            gender: pd.gender || "",


            phone: pd.phone || "",


            doorNumber: ad.doorNumber || "",


            street: ad.street || "",


            city: ad.city || "",


            district: ad.district || "",


            state: ad.state || "",


            pinCode: ad.pinCode || "",


            guardianName: pg.guardianName || "",


            relationship: pg.relationship || "",


            occupation: pg.occupation || "",


            contactNumber: pg.contactNumber || "",


            familyStatus: pg.isSingleParent ? "SINGLE_PARENT" : (pg as any).parent2Name ? "NO_PARENTS" : "PARENTS",


            isSingleParent: pg.isSingleParent || false,


            parent2Name: (pg as any).parent2Name || "",


            parent2Relationship: (pg as any).parent2Relationship || "",


            motherName: pg.motherName || "",


            collegeName: ac.collegeName || legacySchoolCollege,


            collegeAddress: ac.collegeAddress || "",


            schoolName: ac.schoolName || legacySchoolCollege,


            schoolAddress: ac.schoolAddress || "",


            academicType: resolveAcademicType(ac),


            className: ac.className || "",


            section: ac.section || "",


            course: ac.course || "",


            semester: ac.semester || "",


            ugPg: ac.ugPg || "",


            academicYear: ac.academicYear || "",


            familyIncome: fin.familyIncome != null ? String(fin.familyIncome) : "",


            incomeSource: fin.incomeSource || "",


            scholarshipAmount: fin.scholarshipAmount != null ? String(fin.scholarshipAmount) : "",


            accountHolderName: bank.accountHolderName || "",


            accountNumber: bank.accountNumber || "",


            bankName: bank.bankName || "",


            branchName: bank.branchName || "",


            ifscCode: bank.ifscCode || "",


            recommender1Name: rec.recommender1Name || "",


            recommender1Designation: rec.recommender1Designation || rec.recommender1Roll || "",


            recommender1Mobile: rec.recommender1Mobile || "",


            recommender2Name: rec.recommender2Name || "",


            recommender2Designation: rec.recommender2Designation || rec.recommender2Roll || "",


            recommender2Mobile: rec.recommender2Mobile || "",

          }));


          // Dashboard deep link: /student/application?step=N opens the wizard on the
          // next step that still needs attention rather than always restarting at
          // step 1. The request is clamped to the first incomplete step in the stored
          // record, so a hand-written link can never skip a step, and the wizard
          // still opens on step 1 when everything is already complete.
          const requestedStep = readRequestedStep();
          const nextIncompleteStep = evaluateApplicationProgress(app).nextIncompleteStep;
          const targetStep =
            nextIncompleteStep == null ? requestedStep : Math.min(requestedStep, nextIncompleteStep);

          if (targetStep > 0) {
            setReachedStep((r) => Math.max(r, targetStep));
            setCurrentStep(targetStep);
          }


      })


      .catch(() => {


        /* not authenticated or no application */


      })


      .finally(() => setInitialLoading(false));


  }, []);





  // Load current application fee config and existing payment status.


  useEffect(() => {


    if (!applicationId || !appEditingId) return;


    let alive = true;


    fetch(`${API_BASE_URL}/api/application-fee`, { cache: "no-store" })


      .then((r) => (r.ok ? r.json() : null))


      .then((d) => {


        if (alive && d) setFee(d);


      })


      .catch(() => {});


    fetch(`${API_BASE_URL}/api/payments/application/${encodeURIComponent(applicationId)}`, {


      credentials: "include",


    })


      .then((r) => (r.ok ? r.json() : null))


      .then((d) => {


        if (alive && d && d.status !== "NO_PAYMENT") {


          setPaymentStatus(d.status);


          setPaymentRef({


            paymentId: d.paymentId,


            amount: d.amount != null ? Number(d.amount) : null,


            txnId: d.razorpayPaymentId,


            verifiedNote: d.verificationNote,


            verifiedAt: d.verifiedAt,


          });


          if (d.razorpayPaymentId) setUpiTxnId(String(d.razorpayPaymentId));


          setPaymentScreenshot(d.screenshot || null);


          if (d.status === "VERIFIED" || d.status === "SUCCESS") setShowPaymentConfirm(true);


        }


      })


      .catch(() => {});


    return () => {


      alive = false;


    };


  }, [applicationId, appEditingId]);





  const set = useCallback(


    (key: keyof FormData, value: string | boolean) => {


      setForm((f) => ({ ...f, [key]: value }));


      if (errors[key]) {


        setErrors((e) => ({ ...e, [key]: undefined }));


      }


    },


    [errors]


  );








  const chooseFamilyStatus = useCallback((status: FamilyStatus) => {


    setForm((f) => ({


      ...f,


      familyStatus: status,


      isSingleParent: status === "SINGLE_PARENT",


      familyIncome: status === "NO_PARENTS" ? "" : f.familyIncome,


      incomeSource: status === "NO_PARENTS" ? "" : f.incomeSource,


    }));


    setErrors({});


  }, []);





  const validateStep = useCallback((step: number, data: FormData): Errors => {


    const e: Errors = {};


    if (step === 0) {


      if (!data.certificateName.trim()) e.certificateName = "Please enter your name (as per the certificate).";


      const dobErr = validateDob(data.dateOfBirth);


      if (dobErr) e.dateOfBirth = dobErr;


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


      if (data.academicType === "school") {


        if (!data.schoolName.trim()) e.schoolName = "Please enter your school name.";


        if (!data.schoolAddress.trim()) e.schoolAddress = "Please enter your school address.";


        if (!data.academicYear.trim()) e.academicYear = "Please enter your academic year.";


      } else if (data.academicType === "college") {


        if (!data.collegeName.trim()) e.collegeName = "Please enter your college name.";


        if (!data.collegeAddress.trim()) e.collegeAddress = "Please enter your college address.";


        if (!data.course.trim()) e.course = "Please enter your course.";


        if (!data.academicYear.trim()) e.academicYear = "Please enter your academic year.";


      } else {


        e.academicType = "Please select whether you are a School or College student.";


      }


    }


    if (step === 3) {


      // Each family status validates only the fields it renders, so a field that
      // is hidden for the current selection can never block the applicant.


      const validateIncome = () => {


        if (!data.familyIncome.trim()) e.familyIncome = "Please enter the family annual income.";


        else if (Number(data.familyIncome) < 0) e.familyIncome = "Family annual income cannot be negative.";


        if (!data.incomeSource) e.incomeSource = "Please select the income source.";


      };


      if (data.familyStatus === "PARENTS") {


        if (!data.guardianName.trim()) e.guardianName = "Please enter the father's name.";


        if (!data.motherName.trim()) e.motherName = "Please enter the mother's name.";


        validateIncome();


      } else if (data.familyStatus === "SINGLE_PARENT") {


        if (!data.guardianName.trim()) e.guardianName = "Please enter the parent's name.";


        if (!data.relationship) e.relationship = "Please select the relationship.";


        validateIncome();


      } else {


        if (!data.guardianName.trim()) e.guardianName = "Please enter the father's name.";


        if (!data.parent2Name.trim()) e.parent2Name = "Please enter the guardian's name.";


        if (!data.contactNumber.trim()) e.contactNumber = "Please enter the mobile number.";


      }


    }


    if (step === 4) {


      const holder = data.accountHolderName.trim();


      const account = data.accountNumber.trim();


      const ifsc = data.ifscCode.trim().toUpperCase();


      if (!holder) e.accountHolderName = "Please enter the account holder name.";


      if (!account) e.accountNumber = "Please enter the bank account number.";


      else if (!ACCOUNT_RX.test(account)) e.accountNumber = "Enter a valid account number (9-18 digits).";


      if (!data.bankName.trim()) e.bankName = "Please enter the bank name.";


      if (!data.branchName.trim()) e.branchName = "Please enter the branch name.";


      if (!ifsc) e.ifscCode = "Please enter the IFSC code.";


      else if (!IFSC_RX.test(ifsc)) e.ifscCode = "Enter a valid IFSC code (e.g. SBIN0001234).";


    }


    if (step === 5) {


      // The trust verifies the applicant's reference, so recommender 1 needs a
      // name, a designation/relationship ("Occupation ") and a mobile number
      // before the applicant can continue.
      //
      // Recommender 2 is optional and may be left completely empty, so it is not
      // validated at all in that case. Once any one of its three values is
      // entered the rest become required, so a half-filled recommender can never
      // be saved.

      const recommenders = [
        { label: "Recommender 1", name: data.recommender1Name, designation: data.recommender1Designation, mobile: data.recommender1Mobile, keys: { name: "recommender1Name" as const, designation: "recommender1Designation" as const, mobile: "recommender1Mobile" as const } },
        { label: "Recommender 2", name: data.recommender2Name, designation: data.recommender2Designation, mobile: data.recommender2Mobile, keys: { name: "recommender2Name" as const, designation: "recommender2Designation" as const, mobile: "recommender2Mobile" as const } },
      ];


      const validateRecommender = (recommender: (typeof recommenders)[number]) => {
        const name = recommender.name.trim();
        const designation = recommender.designation.trim();
        const mobile = recommender.mobile.trim();

        if (!name) e[recommender.keys.name] = `Please enter ${recommender.label.toLowerCase()}'s name.`;

        if (!designation) {
          e[recommender.keys.designation] = `Please enter what ${recommender.label.toLowerCase()} is, for example a professor or employer.`;
        }

        if (!mobile) e[recommender.keys.mobile] = `Please enter ${recommender.label.toLowerCase()}'s mobile number.`;
        else if (!PHONE_RX.test(mobile)) e[recommender.keys.mobile] = "Enter a valid 10-digit mobile number.";
      };


      validateRecommender(recommenders[0]);


      // Optional, but all three values are required once any one of them is used.
      const optional = recommenders[1];
      const optionalName = optional.name.trim();
      const optionalDesignation = optional.designation.trim();
      const optionalMobile = optional.mobile.trim();

      if (optionalName || optionalDesignation || optionalMobile) {
        validateRecommender(optional);
      }


    }


    if (step === 7) {


      // The Review step is where the applicant confirms the requested
      // scholarship amount, so it is validated before advancing to Payment.


      const amount = data.scholarshipAmount.trim();


      if (!amount) e.scholarshipAmount = "Scholarship amount is required.";


      else if (!AMOUNT_RX.test(amount)) e.scholarshipAmount = "Enter a valid amount in rupees (numbers only).";


      else if (Number(amount) <= 0) e.scholarshipAmount = "The scholarship amount must be greater than zero.";


      else if (Number(amount) > MAX_SCHOLARSHIP_AMOUNT) e.scholarshipAmount = "The requested amount cannot exceed ₹1,00,00,000.";


    }


    return e;


  }, []);





  const goBack = useCallback(() => {


    setFormNotice(null);


    setErrors({});


    setCurrentStep((s) => Math.max(s - 1, 0));


    window.scrollTo({ top: 0, behavior: "smooth" });


  }, []);


  // Move forwards to `next`, remembering how far the applicant has got so the

  // completed markers in the indicator survive them stepping back again.
  const advanceTo = useCallback((next: number) => {
    setReachedStep((r) => Math.max(r, next));
    setCurrentStep(next);
  }, []);





  const buildAcademicPayload = useCallback((data: FormData) => {


    const isSchool = data.academicType === "school";


    const schoolCollege = isSchool ? data.schoolName : data.collegeName;


    return {


      academicType: data.academicType,


      // Keep the legacy `schoolCollege` column in sync for backwards
      // compatibility with any consumer that still reads it, while the new
      // separate fields carry the authoritative values.
      schoolCollege: isSchool ? data.schoolName : data.collegeName,


      schoolName: isSchool ? data.schoolName : "",


      schoolAddress: isSchool ? data.schoolAddress : "",


      collegeName: isSchool ? "" : data.collegeName,


      collegeAddress: isSchool ? "" : data.collegeAddress,


      course: isSchool ? "" : data.course,


      educationLevel: isSchool ? "HIGH_SCHOOL" : "UNDERGRADUATE",


      academicYear: data.academicYear,


      className: isSchool ? data.className : "",


      section: isSchool ? data.section : "",


      semester: isSchool ? "" : data.semester,


      ugPg: isSchool ? "" : data.ugPg,


      yearOfStudy: isSchool ? data.className : data.semester,


      marksPercentageCGPA: "",


    };


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


        personalDetails: {


          fullName: form.certificateName,


          bankRecordName: form.bankRecordName,


          dateOfBirth: toApiDate(form.dateOfBirth),


          gender: form.gender,


          phone: form.phone,


        },


        address: {


          doorNumber: form.doorNumber,


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


          isSingleParent: form.familyStatus === "SINGLE_PARENT",


          parent2Name: form.familyStatus === "NO_PARENTS" ? form.parent2Name : "",


          parent2Relationship: "",


          // Only "Parents" declares a mother, so the column stays NULL for the
          // other statuses and the existing "No Parents" detection
          // (parent2Name set, not a single parent) is unaffected.
          motherName: form.familyStatus === "PARENTS" ? form.motherName : "",


        },


        academicDetails: buildAcademicPayload(form),


        // The requested scholarship amount is always saved, including for
        // "No Parents" applicants, because it is independent of income.
        // An empty field is sent as null so the backend leaves the column
        // untouched instead of writing a misleading 0.
        financialDetails: {
          familyIncome:
            form.familyStatus === "NO_PARENTS"
              ? 0
              : form.familyIncome
                ? Number(form.familyIncome)
                : undefined,
          incomeSource: form.familyStatus === "NO_PARENTS" ? "" : form.incomeSource,
          scholarshipAmount: form.scholarshipAmount.trim()
            ? Number(form.scholarshipAmount.trim())
            : null,
        },


        bankDetails: {
          accountHolderName: form.accountHolderName.trim(),
          accountNumber: form.accountNumber.trim(),
          bankName: form.bankName.trim(),
          branchName: form.branchName.trim(),
          ifscCode: form.ifscCode.trim().toUpperCase(),
        },


        // Sent on every save (like bank details) so the recommender row is
        // created/updated in step with the rest of the draft and survives a
        // refresh or a fresh login.
        recommenderDetails: {
          recommender1Name: form.recommender1Name.trim(),
          recommender1Designation: form.recommender1Designation.trim(),
          recommender1Mobile: form.recommender1Mobile.trim(),
          recommender2Name: form.recommender2Name.trim(),
          recommender2Designation: form.recommender2Designation.trim(),
          recommender2Mobile: form.recommender2Mobile.trim(),
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


      // Clamp to the last step (Payment) instead of the old 6-step layout.
      advanceTo(Math.min(currentStep + 1, STEPS.length - 1));


      window.scrollTo({ top: 0, behavior: "smooth" });


    } catch (err) {


      setFormNotice({ type: "error", text: err instanceof Error ? err.message : "Could not save your application." });


    } finally {


      setSaving(false);


    }


  }, [currentStep, form, validateStep, applicationId, appEditingId, buildAcademicPayload, advanceTo]);





  // Footer "Save & Continue" / "Continue to Review". Steps 0-5 persist the draft

  // before advancing; Documents uploads as the applicant picks files, so it only

  // has to clear its own requirement. This mirrors exactly what the step

  // indicator's forward jumps check, so both routes behave the same.
  const continueFromCurrentStep = useCallback(() => {
    if (currentStep !== 6) {
      void saveAndContinue();
      return;
    }

    if (docCount === 0) {
      setErrors({});
      setFormNotice({ type: "error", text: DOCUMENTS_REQUIRED_NOTICE });
      return;
    }

    setErrors({});
    setFormNotice(null);
    advanceTo(7);
  }, [advanceTo, currentStep, docCount, saveAndContinue]);


  // Step indicator navigation.
  //
  // Backwards — and re-clicking the step you are already on — is always allowed so

  // the applicant can revisit and edit anything they have already filled in.
  // Forwards, the applicant may only skip steps that already hold valid data, and

  // each skipped step is checked with the very same validator its own "Save &

  // Continue" button uses. The first step that fails takes the applicant there with

  // the existing validation message, so a later step can never be reached by

  // bypassing required fields.
  //
  // This only moves the view. It issues no request, so clicking a step can never

  // create a new application, reload the page or discard what is already entered.

  // The form state lives in this component and the draft is already saved, so

  // returning to a previous step shows the same values.
  const goToStep = useCallback(
    (step: number) => {
      if (step === currentStep) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (step > currentStep) {
        for (let skipped = currentStep; skipped < step; skipped++) {
          const fieldErrors = validateStep(skipped, form);
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            setFormNotice({ type: "error", text: "Please correct the highlighted fields before continuing." });
            advanceTo(skipped);
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
          }

          // Steps without field-level rules still have to clear their own

          // requirement. Documents is the only one: the backend requires at least

          // one upload before an application can be submitted.
          if (skipped === 6 && docCount === 0) {
            setErrors({});
            setFormNotice({ type: "error", text: DOCUMENTS_REQUIRED_NOTICE });
            advanceTo(skipped);
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
          }
        }
      }

      setErrors({});
      setFormNotice(null);
      setReachedStep((r) => Math.max(r, step));
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [advanceTo, currentStep, docCount, form, validateStep]
  );




// Payment flow. The fee, UPI QR code and scan-and-pay instructions are shown
  // directly on the payment step from the admin-configured application fee. The
  // applicant enters their UPI transaction reference (UTR) and confirms before


  // submitting; the backend then stores the reference with status
  // PENDING_VERIFICATION for admin review.


  // When Razorpay is added (paymentMethod === "razorpay"), the same step switches
  // to the checkout flow while the fee stays admin-controlled.


  const paymentVerified = paymentStatus === "VERIFIED" || paymentStatus === "SUCCESS";


  const effectivePaymentStatus = submittedPayment?.status || paymentStatus;


  // Automatically send applicants to the dashboard shortly after submitting with
  // a payment that is awaiting verification.
  useEffect(() => {
    if (submittedRef && effectivePaymentStatus === "PENDING_VERIFICATION") {
      const timer = window.setTimeout(() => {
        window.location.href = "/student/dashboard";
      }, 3000);
      return () => window.clearTimeout(timer);
    }
  }, [submittedRef, effectivePaymentStatus]);


  const paymentLabel = (status: string): string => {


    switch (status) {


      case "PENDING_VERIFICATION":
        return "Awaiting Verification";


      case "VERIFIED":


      case "SUCCESS":
        return "Payment Verified";


      case "REJECTED":
        return "Payment Verification Rejected";


      case "FAILED":
        return "Payment Failed";


      default:
        return "Payment Not Yet Submitted";


    }


  };





  const handleScreenshotSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setScreenshotFile(file);
    setScreenshotError(null);
    if (!file) return;
    const allowed =
      file.type === "application/pdf" ||
      file.type === "image/jpeg" ||
      file.type === "image/png";
    if (!allowed) {
      setScreenshotError("Unsupported file type. Allowed: JPEG, PNG, PDF");
      setScreenshotFile(null);
    }
  };


  const handleScreenshotUpload = async () => {
    if (!screenshotFile) {
      setScreenshotError("Please choose a payment screenshot first.");
      return;
    }
    if (!applicationId) {
      setScreenshotError("Application reference is missing. Please refresh and try again.");
      return;
    }
    setScreenshotUploading(true);
    setScreenshotError(null);
    setPaymentNotice(null);
    try {
      const fd = new FormData();
      fd.append("file", screenshotFile);
      const res = await fetch(
        `${API_BASE_URL}/api/payments/application/${encodeURIComponent(applicationId)}/screenshot`,
        { method: "POST", body: fd, credentials: "include" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not upload the payment screenshot. Please try again.");
      }
      setPaymentScreenshot({
        name: data.payment?.screenshotName || screenshotFile.name,
        mime: data.payment?.screenshotMime || screenshotFile.type,
        uploadedAt: data.payment?.uploadedAt || undefined,
      });
      setPaymentStatus((s) => (s === "NO_PAYMENT" ? "NOT_SUBMITTED" : s));
      setShowPaymentConfirm(false);
      setPaymentNotice({ type: "success", text: "Payment screenshot uploaded successfully." });
    } catch (err) {
      setPaymentNotice({ type: "error", text: err instanceof Error ? err.message : "Could not upload the payment screenshot." });
      setScreenshotError(err instanceof Error ? err.message : "Could not upload the payment screenshot.");
    } finally {
      setScreenshotUploading(false);
      setScreenshotFile(null);
    }
  };


  // Move focus to the agreement checkbox so keyboard and screen-reader users land


  // on the control that is blocking submission.


  const focusDeclaration = useCallback(() => {


    const el = document.getElementById("applicant-declaration-checkbox");


    if (!el) return;


    el.scrollIntoView({ behavior: "smooth", block: "center" });


    el.focus({ preventScroll: true });


  }, []);


  // Persist the acceptance on the application record. Returns false when it could


  // not be confirmed, so the caller can refuse to submit.


  const persistDeclaration = useCallback(


    async (accepted: boolean): Promise<boolean> => {


      if (!appEditingId) return false;


      setSavingDeclaration(true);


      try {


        const res = await fetch(`${API_BASE_URL}/api/applications/${appEditingId}`, {


          method: "PATCH",


          headers: { "Content-Type": "application/json" },


          credentials: "include",


          body: JSON.stringify({ declarationAccepted: accepted }),


        });


        if (!res.ok) return false;


        setDeclarationPersisted(accepted);


        return true;


      } catch {


        return false;


      } finally {


        setSavingDeclaration(false);


      }


    },


    [appEditingId]


  );


  const submitApplication = useCallback(async () => {


    if (!declarationAccepted) {


      setDeclarationError("Please read the Applicant Declaration and tick the agreement checkbox before submitting your application.");


      focusDeclaration();


      return;


    }


    // The box may have been ticked while its save was still in flight, so make


    // sure the acceptance reached the server before asking to submit.


    if (!declarationPersisted) {


      const saved = await persistDeclaration(true);


      if (!saved) {


        setDeclarationError("We could not save your agreement. Please try again.");


        focusDeclaration();


        return;


      }


    }


    setDeclarationError(null);


    if (!appEditingId) {


      setFormNotice({ type: "error", text: "Please save your application before submitting." });


      return;


    }


    const txn = upiTxnId.trim();


    const isPreVerified = paymentStatus === "VERIFIED" || paymentStatus === "SUCCESS";

if (fee?.enabled && Number(fee.amount || 0) > 0 && fee.paymentMethod !== "razorpay" && !isPreVerified) {



      if (!paymentScreenshot) {



        setPaymentNotice({ type: "error", text: "Please upload your payment screenshot." });



        setScreenshotError("Please upload your payment screenshot.");

        document.getElementById("upi-screenshot-input-block")?.scrollIntoView({ behavior: "smooth", block: "center" });



        return;

      }



      if (!txn) {


        setPaymentNotice({ type: "error", text: "Please enter the UPI transaction reference (UTR) shown in your payment app before submitting your application." });


        setTxnError("Transaction ID / UTR is required. Enter the ID shown in your UPI payment receipt.");

        document.getElementById("upi-txn-input")?.scrollIntoView({ behavior: "smooth", block: "center" });


        return;


      }


      if (txn.length < 6 || txn.length > 64) {


        setPaymentNotice({ type: "error", text: "The UPI transaction reference (UTR) you entered does not look valid. Please check and try again." });


        setTxnError("This transaction ID does not look valid. Please check and try again.");

        document.getElementById("upi-txn-input")?.scrollIntoView({ behavior: "smooth", block: "center" });


        return;


      }


      if (!showPaymentConfirm) {


        setPaymentNotice({ type: "error", text: "Please confirm that you have made the payment before submitting your application." });


        document.getElementById("upi-txn-input")?.scrollIntoView({ behavior: "smooth", block: "center" });


        return;


      }


    }


    setPaymentNotice(null);


    setTxnError(null);


    setSubmitting(true);


    setFormNotice(null);


    try {


      const res = await fetch(`${API_BASE_URL}/api/applications/${appEditingId}/submit`, {


        method: "POST",


        headers: { "Content-Type": "application/json" },


        credentials: "include",


        body: JSON.stringify({ transactionId: txn || undefined, paymentConfirmed: !!showPaymentConfirm }),


      });
const data = await res.json().catch(() => ({}));



      if (!res.ok) {



        const code = (data as any).code as string | undefined;

        if (code === "UPI_QR_NOT_CONFIGURED") {

          setPaymentNotice({ type: "error", text: (data as any).error || "The payment QR code has not been configured yet. Please contact the trust office." });

        } else if (code === "PAYMENT_SCREENSHOT_REQUIRED") {

          setPaymentNotice({ type: "error", text: (data as any).error || "Please upload your payment screenshot." });

          setScreenshotError("Please upload your payment screenshot.");

          document.getElementById("upi-screenshot-input-block")?.scrollIntoView({ behavior: "smooth", block: "center" });

        } else if (code === "UTR_REQUIRED") {

          setPaymentNotice({ type: "error", text: (data as any).error || "Please enter your transaction ID / UTR first." });

          setTxnError("Transaction ID / UTR is required. Enter the ID shown in your UPI payment receipt.");

          document.getElementById("upi-txn-input")?.scrollIntoView({ behavior: "smooth", block: "center" });

        } else if (code === "UTR_INVALID") {

          setPaymentNotice({ type: "error", text: (data as any).error || "The UPI transaction reference (UTR) you entered is invalid. Please check and try again." });

          setTxnError((data as any).error || "Invalid transaction ID.");

          document.getElementById("upi-txn-input")?.scrollIntoView({ behavior: "smooth", block: "center" });

        } else if (code === "PAYMENT_CONFIRMATION_REQUIRED") {

          setPaymentNotice({ type: "error", text: (data as any).error || "Please confirm that you have completed the payment." });

        } else if (code === "RECOMMENDER_DETAILS_REQUIRED") {

          // The backend is the final gate on the Recommended By step. Send the
          // applicant back there with the same per-field messages the step uses,
          // instead of leaving the error on the payment panel.

          const message = (data as any).error || "Please complete both recommender details before submitting.";

          setPaymentNotice({ type: "error", text: message });

          setErrors(validateStep(5, form));

          setFormNotice({ type: "error", text: message });

          advanceTo(5);

          window.scrollTo({ top: 0, behavior: "smooth" });

        } else {

          setPaymentNotice({ type: "error", text: (data as any).error || "Could not submit your application. Please try again." });

        }

        setSubmitting(false);

        return;



      }

      setSubmittedRef(data.applicationId || applicationId || null);


      if (isPreVerified) {


        setSubmittedPayment({ status: paymentStatus, txnId: txn || paymentRef?.txnId || undefined, amount: fee?.amount });


      } else if (fee?.enabled && Number(fee.amount || 0) > 0) {


        setSubmittedPayment({ status: "PENDING_VERIFICATION", txnId: txn || undefined, amount: fee?.amount });


      }


    } catch (err) {


      setFormNotice({ type: "error", text: err instanceof Error ? err.message : "Could not submit your application." });


      setSubmitting(false);


    }


  }, [declarationAccepted, declarationPersisted, focusDeclaration, persistDeclaration, appEditingId, applicationId, upiTxnId, showPaymentConfirm, paymentStatus, fee, paymentRef, paymentScreenshot, validateStep, form, advanceTo]);





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


          alt="NEELAKANNU EDUCATIONAL TRUST logo"


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


          Thank you for applying for educational support from NEELAKANNU EDUCATIONAL TRUST.


        </p>


        {submittedRef && (


          <div className="mt-8 rounded-xl border border-gold/40 bg-gold-soft p-6">


            <p className="text-sm font-medium text-navy-800 dark:text-gold">Application / Reference Number</p>


            <p className="mt-1 text-2xl font-bold tracking-wide text-navy dark:text-white">{submittedRef}</p>


            <p className="mt-2 text-xs text-muted-foreground">Please keep this reference number for future communication.</p>


          </div>


        )}


        {(effectivePaymentStatus === "SUCCESS" ||


          effectivePaymentStatus === "VERIFIED" ||


          effectivePaymentStatus === "PENDING_VERIFICATION") && (


          <div className="mx-auto mt-6 max-w-md space-y-3 rounded-xl border border-border bg-white dark:bg-[#131a2e] p-5 text-left">


            <div className="flex items-center justify-between gap-4">


              <span className="text-sm text-muted-foreground">Payment status</span>


              {effectivePaymentStatus === "PENDING_VERIFICATION" ? (


                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-dark dark:text-gold">


                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden="true">


                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5" />


                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 1 0 9 9" />


                  </svg>


                  Payment Verification Pending


                </span>


              ) : (


                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-success">


                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden="true">


                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />


                  </svg>


                  Payment Verified


                </span>


              )}


            </div>


            {(submittedPayment?.txnId || paymentRef?.txnId) && (


              <div className="flex items-center justify-between gap-4 border-t border-border pt-3">


                <span className="text-sm text-muted-foreground">Transaction ID / UTR</span>


                <span className="font-mono text-sm font-medium text-navy dark:text-white">{submittedPayment?.txnId || paymentRef?.txnId}</span>


              </div>


            )}


            {(submittedPayment?.amount != null || paymentRef?.amount != null) && (


              <div className="flex items-center justify-between gap-4 border-t border-border pt-3">


                <span className="text-sm text-muted-foreground">Amount</span>


                <span className="text-sm font-semibold text-navy dark:text-white">₹{Number(submittedPayment?.amount ?? paymentRef?.amount).toLocaleString("en-IN")}</span>


              </div>


            )}


            {effectivePaymentStatus === "PENDING_VERIFICATION" && (


              <p className="border-t border-border pt-3 text-sm text-muted-foreground">


                Your transaction ID has been submitted and is awaiting verification by the Trust.


              </p>


            )}


          </div>


        )}


        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">


          <Link href="/student/dashboard" className="btn-outline">View My Applications</Link>


          <Link href="/" className="btn-gold">Back to Home</Link>

</div>



        {effectivePaymentStatus === "PENDING_VERIFICATION" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="pending-verification-title">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl dark:bg-[#0e1424]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/20">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7 animate-spin text-amber-600 dark:text-amber-300" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </div>
              <h3 id="pending-verification-title" className="mt-5 text-xl font-bold text-navy dark:text-white">
                Payment verification pending, please wait.
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                The Trust will verify your payment before your scholarship application is reviewed. We are taking you to your dashboard.
              </p>
              <Link href="/student/dashboard" className="btn-gold mt-6 w-full sm:w-auto">
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}


      </div>



    );



  }



  const isSchool = form.academicType === "school";


  const isCollege = form.academicType === "college";


  // A second recommender is optional, so the Review step only shows it when the
  // applicant has actually supplied something for it.
  const hasRecommender2 = !!(
    form.recommender2Name.trim() ||
    form.recommender2Designation.trim() ||
    form.recommender2Mobile.trim()
  );





  return (


    <div className="space-y-6">


      {/* Progress indicator.

          Every entry is a real button, so all steps are clickable: backwards
          freely, forwards only across steps that already hold valid data. Nothing
          here fetches or saves — it just moves the view, so the entered data and
          the existing draft are left untouched. */}

      <nav className="card-trust px-5 py-4 sm:px-6" aria-label="Application progress">
        <ol className="flex items-center gap-0 overflow-x-auto pb-1 sm:gap-1 sm:pb-0">
          {STEPS.map((step, i) => {
            const status = classifyStep(i, currentStep, reachedStep);
            const isCurrent = status === "current";

            return (
              <li key={step.id} className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => goToStep(i)}
                  title={isCurrent ? step.label : `Go to ${step.label}`}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`Step ${i + 1} of ${STEPS.length}: ${step.label}`}
                  className="group flex w-11 shrink-0 cursor-pointer flex-col items-center gap-1 whitespace-nowrap rounded-lg px-0.5 py-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-card active:scale-[0.97] dark:focus-visible:ring-gold sm:w-auto"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition group-hover:scale-105 ${
                      status === "complete"
                        ? "bg-success text-success-foreground group-hover:bg-success/85"
                        : status === "current"
                          ? "bg-gold text-navy shadow-sm group-hover:bg-gold-600"
                          : "border border-border bg-muted text-muted-foreground group-hover:border-navy/40 group-hover:bg-navy-50 group-hover:text-navy dark:group-hover:border-white/40 dark:group-hover:bg-white/10 dark:group-hover:text-white"
                    }`}
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
                    className={`hidden text-[11px] font-medium leading-tight transition group-hover:font-semibold sm:block ${
                      isCurrent
                        ? "text-navy dark:text-white"
                        : status === "complete"
                          ? "text-success"
                          : "text-muted-foreground group-hover:text-navy dark:group-hover:text-white"
                    }`}
                  >
                    {step.label}
                  </span>
                </button>

                {i < STEPS.length - 1 && (
                  <span
                    className={`mx-0.5 h-px w-2.5 shrink-0 rounded sm:mx-1 sm:min-w-2 sm:flex-1 ${i < reachedStep ? "bg-success" : "bg-border"}`}
                    aria-hidden="true"
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>





      {editability && editNotice && (




        <div

          role="status"

          aria-live="polite"

          className={`rounded-lg border px-4 py-3 text-sm ${

            isApprovedLock(editability)
              ? "border-success/30 bg-success/5 text-success"
              : isExpiredLock(editability)
                ? "border-border bg-muted text-muted-foreground"
                : "border-gold/40 bg-gold-soft text-navy-800"

          }`}

        >

          {editNotice}

        </div>

      )}




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


        <div className="border-b border-border bg-gradient-to-br from-navy-50 to-white dark:from-[#131a2e] dark:to-[#0b1020] px-6 py-5 sm:px-8">


          <p className="eyebrow mb-2">Step {currentStep + 1} of {STEPS.length}</p>


          <h2 className="font-serif text-2xl font-bold text-navy dark:text-white">


            {currentStep === 0 && "Personal Information"}


            {currentStep === 1 && "Contact Information"}


            {currentStep === 2 && "Academic Details"}


            {currentStep === 3 && "Family & Financial Information"}


            {currentStep === 4 && "Bank Details"}


            {currentStep === 5 && "Recommended By"}


            {currentStep === 6 && "Document Uploads"}


            {currentStep === 7 && "Review Your Application"}


            {currentStep === 8 && "Pay Application Fee"}


          </h2>


          <p className="mt-1 text-sm text-muted-foreground">


            {currentStep === 4


              ? "Enter the bank account where the scholarship amount should be deposited."


              : currentStep === 5


              ? "Give the name, what he/she is, and the mobile number of someone who can recommend you. A second recommender is optional."


              : currentStep === 6


              ? "Upload clear and readable copies of the required documents."


              : currentStep === 7


              ? "Please verify all information below before submitting."


              : currentStep === 8


              ? "Payment is required to complete and submit your application."


                  : `Fields marked with * are required.`}


          </p>


        </div>





        {/* Every field lives inside one disabled <fieldset> when the window is closed.
            That single attribute makes the whole wizard read-only — inputs,
            selects, the document uploader and the declaration checkbox — without
            touching any individual control or changing the layout. */}
        <fieldset disabled={!applicationEditable} className="m-0 min-w-0 border-0 p-0">

        <div className="px-5 py-6 sm:px-8 sm:py-8">


          {currentStep === 0 && (


            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">


              <div>


                <label htmlFor="certificateName" className="field-label">Name (as per the Certificate) *</label>


                <input


                  id="certificateName"


                  type="text"


                  className="field-input"


                  placeholder="Enter your name as per the certificate"


                  value={form.certificateName}


                  onChange={(e) => set("certificateName", e.target.value)}


                  autoComplete="name"


                />


                {errors.certificateName && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.certificateName}</p>}


              </div>


              <div>


                <label htmlFor="bankRecordName" className="field-label">Name (as per the Bank Record)</label>


                <input


                  id="bankRecordName"


                  type="text"


                  className="field-input"


                  placeholder="Enter your name as per the bank record"


                  value={form.bankRecordName}


                  onChange={(e) => set("bankRecordName", e.target.value)}


                />


              </div>


              <div>


                <label htmlFor="dateOfBirth" className="field-label">Date of Birth *</label>


                <input


                  id="dateOfBirth"


                  type="text"


                  placeholder="DD/MM/YYYY"


                  className="field-input"


                  value={form.dateOfBirth}


                  onChange={(e) => set("dateOfBirth", e.target.value)}


                  maxLength={10}


                  inputMode="numeric"


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


              <div>


                <label htmlFor="doorNumber" className="field-label">Door Number</label>


                <input


                  id="doorNumber"


                  type="text"


                  className="field-input"


                  placeholder="Enter door number"


                  value={form.doorNumber}


                  onChange={(e) => set("doorNumber", e.target.value)}


                />


              </div>


              <div>


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


                <StateSelect
                  id="state"
                  value={form.state}
                  onChange={(v) => set("state", v)}
                  invalid={!!errors.state}
                />


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


                <span className="field-label">Academic Type *</span>


                <div className="flex flex-wrap gap-4" role="radiogroup" aria-label="Academic Type">


                  <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${isSchool ? "border-navy bg-navy-50 text-navy dark:border-gold dark:bg-[#1d2740] dark:text-gold" : "border-border bg-white text-muted-foreground dark:border-white/15 dark:bg-[#131a2e] dark:text-slate-300"}`}>


                    <input


                      type="radio"


                      name="academicType"


                      className="h-4 w-4 accent-navy"


                      checked={isSchool}


                      onChange={() => set("academicType", "school")}


                    />


                    School


                  </label>


                  <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${isCollege ? "border-navy bg-navy-50 text-navy dark:border-gold dark:bg-[#1d2740] dark:text-gold" : "border-border bg-white text-muted-foreground dark:border-white/15 dark:bg-[#131a2e] dark:text-slate-300"}`}>


                    <input


                      type="radio"


                      name="academicType"


                      className="h-4 w-4 accent-navy"


                      checked={isCollege}


                      onChange={() => set("academicType", "college")}


                    />


                    College


                  </label>


                </div>


                {errors.academicType && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.academicType}</p>}


              </div>





              {isSchool && (


                <>


                  <div className="md:col-span-2">


                    <label htmlFor="schoolName" className="field-label">School Name *</label>


                    <input


                      id="schoolName"


                      type="text"


                      className="field-input"


                      placeholder="Enter your school name"


                      value={form.schoolName}


                      onChange={(e) => set("schoolName", e.target.value)}


                    />


                    {errors.schoolName && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.schoolName}</p>}


                  </div>


                  <div className="md:col-span-2">


                    <label htmlFor="schoolAddress" className="field-label">School Address *</label>


                    <input


                      id="schoolAddress"


                      type="text"


                      className="field-input"


                      placeholder="Enter your school address"


                      value={form.schoolAddress}


                      onChange={(e) => set("schoolAddress", e.target.value)}


                    />


                    {errors.schoolAddress && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.schoolAddress}</p>}


                  </div>


                  <div>


                    <label htmlFor="className" className="field-label">Class</label>


                    <input


                      id="className"


                      type="text"


                      className="field-input"


                      placeholder="e.g. Class X"


                      value={form.className}


                      onChange={(e) => set("className", e.target.value)}


                    />


                  </div>


                  <div>


                    <label htmlFor="section" className="field-label">Section</label>


                    <input


                      id="section"


                      type="text"


                      className="field-input"


                      placeholder="e.g. A"


                      value={form.section}


                      onChange={(e) => set("section", e.target.value)}


                    />


                  </div>


                  <div className="md:col-span-2">


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


                </>


              )}





              {isCollege && (


                <>


                  <div className="md:col-span-2">


                    <label htmlFor="collegeName" className="field-label">College Name *</label>


                    <input


                      id="collegeName"


                      type="text"


                      className="field-input"


                      placeholder="Enter your college name"


                      value={form.collegeName}


                      onChange={(e) => set("collegeName", e.target.value)}


                    />


                    {errors.collegeName && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.collegeName}</p>}


                  </div>


                  <div className="md:col-span-2">


                    <label htmlFor="collegeAddress" className="field-label">College Address *</label>


                    <input


                      id="collegeAddress"


                      type="text"


                      className="field-input"


                      placeholder="Enter your college address"


                      value={form.collegeAddress}


                      onChange={(e) => set("collegeAddress", e.target.value)}


                    />


                    {errors.collegeAddress && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.collegeAddress}</p>}


                  </div>


                  <div>


                    <label htmlFor="course" className="field-label">Course *</label>


                    <input


                      id="course"


                      type="text"


                      className="field-input"


                      placeholder="Enter your course"


                      value={form.course}


                      onChange={(e) => set("course", e.target.value)}


                    />


                    {errors.course && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.course}</p>}


                  </div>


                  <div>


                    <label htmlFor="semester" className="field-label">Semester</label>


                    <input


                      id="semester"


                      type="text"


                      className="field-input"


                      placeholder="e.g. Semester 3"


                      value={form.semester}


                      onChange={(e) => set("semester", e.target.value)}


                    />


                  </div>


                  <div>


                    <label htmlFor="ugPg" className="field-label">UG / PG</label>


                    <select id="ugPg" className="field-input" value={form.ugPg} onChange={(e) => set("ugPg", e.target.value)}>


                      <option value="">Select UG / PG</option>


                      <option>UG</option>


                      <option>PG</option>


                    </select>


                  </div>


                  <div>


                    <label htmlFor="collegeAcadYear" className="field-label">Academic Year *</label>


                    <input


                      id="collegeAcadYear"


                      type="text"


                      className="field-input"


                      placeholder="e.g. 2026-2027"


                      value={form.academicYear}


                      onChange={(e) => set("academicYear", e.target.value)}


                    />


                    {errors.academicYear && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.academicYear}</p>}


                  </div>


                </>


              )}


            </div>


          )}





          {currentStep === 3 && (


            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">


              <div className="md:col-span-2">


                <span className="field-label">Family Status</span>


                <div className="flex flex-wrap gap-4" role="radiogroup" aria-label="Family Status">


                  <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${form.familyStatus === "PARENTS" ? "border-navy bg-navy-50 text-navy dark:border-gold dark:bg-[#1d2740] dark:text-gold" : "border-border bg-white text-muted-foreground dark:border-white/15 dark:bg-[#131a2e] dark:text-slate-300"}`}>


                    <input


                      type="radio"


                      name="familyStatus"


                      className="h-4 w-4 accent-navy"


                      checked={form.familyStatus === "PARENTS"}


                      onChange={() => chooseFamilyStatus("PARENTS")}


                    />


                    Parents


                  </label>


                  <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${form.familyStatus === "SINGLE_PARENT" ? "border-navy bg-navy-50 text-navy dark:border-gold dark:bg-[#1d2740] dark:text-gold" : "border-border bg-white text-muted-foreground dark:border-white/15 dark:bg-[#131a2e] dark:text-slate-300"}`}>


                    <input


                      type="radio"


                      name="familyStatus"


                      className="h-4 w-4 accent-navy"


                      checked={form.familyStatus === "SINGLE_PARENT"}


                      onChange={() => chooseFamilyStatus("SINGLE_PARENT")}


                    />


                    Single Parent


                  </label>








                  <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${form.familyStatus === "NO_PARENTS" ? "border-navy bg-navy-50 text-navy dark:border-gold dark:bg-[#1d2740] dark:text-gold" : "border-border bg-white text-muted-foreground dark:border-white/15 dark:bg-[#131a2e] dark:text-slate-300"}`}>


                    <input


                      type="radio"


                      name="familyStatus"


                      className="h-4 w-4 accent-navy"


                      checked={form.familyStatus === "NO_PARENTS"}


                      onChange={() => chooseFamilyStatus("NO_PARENTS")}


                    />


                    No Parents


                  </label>


                </div>


              </div>



              <div>


                <label htmlFor="guardianName" className="field-label">{form.familyStatus === "SINGLE_PARENT" ? "Parent Name *" : "Father Name *"}</label>


                <input


                  id="guardianName"


                  type="text"


                  className="field-input"


                  placeholder={form.familyStatus === "SINGLE_PARENT" ? "Enter parent name" : "Enter father's name"}


                  value={form.guardianName}


                  onChange={(e) => set("guardianName", e.target.value)}


                />


                {errors.guardianName && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.guardianName}</p>}


              </div>


{/* Relationship is only meaningful for a single parent: "Parents" names the
                  father and mother instead, and "No Parents" names the guardian. */}


              {form.familyStatus === "SINGLE_PARENT" && (


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


              )}





              {form.familyStatus === "PARENTS" && (


                <div>


                  <label htmlFor="motherName" className="field-label">Mother Name *</label>


                  <input


                    id="motherName"


                    type="text"


                    className="field-input"


                    placeholder="Enter mother's name"


                    value={form.motherName}


                    onChange={(e) => set("motherName", e.target.value)}


                  />


                  {errors.motherName && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.motherName}</p>}


                </div>


              )}


              {form.familyStatus === "NO_PARENTS" && (


                <>


                  <div>


                    <label htmlFor="parent2Name" className="field-label">Guardian Name *</label>


                    <input


                      id="parent2Name"


                      type="text"


                      className="field-input"


                      placeholder="Enter guardian's name"


                      value={form.parent2Name}


                      onChange={(e) => set("parent2Name", e.target.value)}


                    />


                    {errors.parent2Name && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.parent2Name}</p>}


                  </div>








                  <div>


                    <label htmlFor="contactNumber" className="field-label">Mobile Number *</label>


                    <input


                      id="contactNumber"


                      type="tel"


                      className="field-input"


                      placeholder="Enter mobile number"


                      inputMode="numeric"


                      value={form.contactNumber}


                      onChange={(e) => set("contactNumber", e.target.value)}


                    />


                    {errors.contactNumber && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.contactNumber}</p>}


                  </div>


                </>


              )}








              {form.familyStatus !== "NO_PARENTS" && (


                <>


                  <div className="md:col-span-2 border-b border-border pb-1 text-sm font-semibold uppercase tracking-wide text-navy-700 dark:text-slate-300">


                    Financial Details


                  </div>


              <div>


                <label htmlFor="familyIncome" className="field-label">Family Annual Income (₹) *</label>


                <input


                  id="familyIncome"


                  type="number"


                  className="field-input"


                  placeholder="Enter family annual income"


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


              </>


            )}


            </div>


          )}





          {currentStep === 4 && (


            <div className="rounded-xl border border-gold/40 bg-gold-soft p-6">


              <p className="mb-5 text-sm text-muted-foreground">


                These details are used only to credit the scholarship amount if your application is approved.


              </p>


              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">


                <div>


                  <label htmlFor="accountHolderName" className="field-label">Account Holder Name *</label>


                  <input


                    id="accountHolderName"


                    type="text"


                    className="field-input"


                    placeholder="Enter account holder name"


                    value={form.accountHolderName}


                    onChange={(e) => set("accountHolderName", e.target.value)}


                  />


                  {errors.accountHolderName && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.accountHolderName}</p>}


                </div>


                <div>


                  <label htmlFor="accountNumber" className="field-label">Account Number *</label>


                  <input


                    id="accountNumber"


                    type="text"


                    inputMode="numeric"


                    className="field-input"


                    placeholder="Enter bank account number"


                    value={form.accountNumber}


                    onChange={(e) => set("accountNumber", e.target.value.replace(/[^0-9]/g, "").slice(0, 18))}


                  />


                  {errors.accountNumber && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.accountNumber}</p>}


                </div>


                <div>


                  <label htmlFor="bankName" className="field-label">Bank Name *</label>


                  <input


                    id="bankName"


                    type="text"


                    className="field-input"


                    placeholder="e.g. State Bank of India"


                    value={form.bankName}


                    onChange={(e) => set("bankName", e.target.value)}


                  />


                  {errors.bankName && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.bankName}</p>}


                </div>


                <div>


                  <label htmlFor="branchName" className="field-label">Branch Name *</label>


                  <input


                    id="branchName"


                    type="text"


                    className="field-input"


                    placeholder="Enter branch name"


                    value={form.branchName}


                    onChange={(e) => set("branchName", e.target.value)}


                  />


                  {errors.branchName && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.branchName}</p>}


                </div>


                <div className="md:col-span-2">


                  <label htmlFor="ifscCode" className="field-label">IFSC Code *</label>


                  <input


                    id="ifscCode"


                    type="text"


                    className="field-input uppercase"


                    placeholder="e.g. SBIN0001234"


                    value={form.ifscCode}


                    onChange={(e) => set("ifscCode", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11))}


                  />


                  {errors.ifscCode && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.ifscCode}</p>}


                </div>


              </div>


            </div>


          )}


          {currentStep === 5 && (


            <div className="space-y-6">


              <p className="text-sm text-muted-foreground">


                Recommender 1 is required. Recommender 2 is optional and can be left blank, but if you add a second recommender then all three of their details are needed. We may contact either person to verify your application.


              </p>


              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">


                <div className="rounded-xl border border-gold/40 bg-gold-soft p-5">


                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-navy-700 dark:text-slate-300">


                    Recommender 1


                  </h3>


                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">


                    <div className="sm:col-span-2">


                      <label htmlFor="recommender1Name" className="field-label">Name *</label>


                      <input


                        id="recommender1Name"


                        type="text"


                        className="field-input"


                        placeholder="Enter recommender's full name"


                        value={form.recommender1Name}


                        onChange={(e) => set("recommender1Name", e.target.value)}


                      />


                      {errors.recommender1Name && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.recommender1Name}</p>}


                    </div>


                    <div>


                      <label htmlFor="recommender1Designation" className="field-label">Occupation  *</label>


                      <input


                        id="recommender1Designation"


                        type="text"


                        className="field-input"


                        placeholder="e.g. Professor, Teacher, Lecturer"


                        value={form.recommender1Designation}


                        onChange={(e) => set("recommender1Designation", e.target.value)}


                      />


                      {errors.recommender1Designation && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.recommender1Designation}</p>}


                    </div>


                    <div>


                      <label htmlFor="recommender1Mobile" className="field-label">Mobile Number *</label>


                      <input


                        id="recommender1Mobile"


                        type="tel"


                        inputMode="numeric"


                        maxLength={10}


                        className="field-input"


                        placeholder="10-digit mobile number"


                        value={form.recommender1Mobile}


                        onChange={(e) => set("recommender1Mobile", e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}


                      />


                      {errors.recommender1Mobile && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.recommender1Mobile}</p>}


                    </div>


                  </div>


                </div>


                <div className="rounded-xl border border-gold/40 bg-gold-soft p-5">


                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-navy-700 dark:text-slate-300">


Recommender 2 <span className="font-normal normal-case tracking-normal text-muted-foreground">(optional)</span>


                  </h3>


                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">


                    <div className="sm:col-span-2">


                      <label htmlFor="recommender2Name" className="field-label">Name</label>


                      <input


                        id="recommender2Name"


                        type="text"


                        className="field-input"


                        placeholder="Enter recommender's full name"


                        value={form.recommender2Name}


                        onChange={(e) => set("recommender2Name", e.target.value)}


                      />


                      {errors.recommender2Name && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.recommender2Name}</p>}


                    </div>


                    <div>


                      <label htmlFor="recommender2Designation" className="field-label">Occupation </label>


                      <input


                        id="recommender2Designation"


                        type="text"


                        className="field-input"


                        placeholder="e.g. Professor, Teacher, Lecturer"


                        value={form.recommender2Designation}


                        onChange={(e) => set("recommender2Designation", e.target.value)}


                      />


                      {errors.recommender2Designation && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.recommender2Designation}</p>}


                    </div>


                    <div>


                      <label htmlFor="recommender2Mobile" className="field-label">Mobile Number</label>


                      <input


                        id="recommender2Mobile"


                        type="tel"


                        inputMode="numeric"


                        maxLength={10}


                        className="field-input"


                        placeholder="10-digit mobile number"


                        value={form.recommender2Mobile}


                        onChange={(e) => set("recommender2Mobile", e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}


                      />


                      {errors.recommender2Mobile && <p className="mt-1.5 text-sm text-destructive" role="alert">{errors.recommender2Mobile}</p>}


                    </div>


                  </div>


                </div>


              </div>


            </div>


          )}


          <div className={currentStep === 6 ? "" : "hidden"}>


            <DocumentUpload applicationId={applicationId} onCountChange={setDocCount} isSingleParent={form.isSingleParent} noParents={form.familyStatus === "NO_PARENTS"} />


          </div>





          {currentStep === 8 && (



            <div className="space-y-6">



              {applicationId && (



                <div className="rounded-xl border border-gold/40 bg-gold-soft px-4 py-3 text-sm text-navy-800">



                  <strong>Application ID:</strong> {applicationId}



                </div>



              )}





              <div className="rounded-xl border border-border bg-white dark:bg-[#131a2e] p-6">



                <div className="flex items-center gap-3">



                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-gold">



                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-6 w-6">



                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />



                    </svg>



                  </span>



                  <div>



                    <h3 className="text-base font-semibold text-navy dark:text-white">Application Fee</h3>



                    <p className="text-sm text-muted-foreground">



                      {fee && fee.enabled

                        ? `Please pay the application fee of ₹${Number(fee.amount).toLocaleString("en-IN")} to complete your application.`

                        : "Checking application fee..."}



                    </p>



                  </div>



                </div>





                {fee && fee.enabled && fee.amount > 0 && (



                  <div className="mt-5 flex flex-wrap items-end justify-between gap-4 rounded-xl border border-border bg-surface-muted p-5">



                    <div>



                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Payable</p>



                      <p className="font-serif text-3xl font-bold text-navy dark:text-white">



                        ₹{Number(fee.amount).toLocaleString("en-IN")}



                      </p>



                    </div>



{paymentStatus === "PENDING_VERIFICATION" || paymentStatus === "PENDING" ? (



                    <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">



                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden="true">
<path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />




                      </svg>




                      Awaiting Verification




                    </span>



                  ) : paymentStatus === "REJECTED" ? (



                    <span className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive">



                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden="true">



                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />



                      </svg>



                      Payment Verification Rejected



                    </span>



                  ) : paymentVerified ? (



                    <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-4 py-2 text-sm font-semibold text-success">



                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden="true">



                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />



                      </svg>



                      Payment Verified



                    </span>



                  ) : (



                    <span className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground">



                      Payment Not Yet Submitted



                    </span>



                  )}



                  </div>



                )}

{/* UPI QR + UTR entry */}



                {fee && fee.enabled && fee.amount > 0 && fee.paymentMethod !== "razorpay" && !paymentVerified && (



                  <div className="mt-6 rounded-xl border border-gold/30 bg-white p-6 dark:border-gold/20 dark:bg-[#131a2e]">



                    {paymentStatus === "REJECTED" && (



                      <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4">



                        <p className="text-sm font-semibold text-destructive">Payment verification was rejected</p>



                        <p className="mt-1 text-sm text-muted-foreground">



                          {paymentRef?.verifiedNote ? `Reason: ${paymentRef.verifiedNote} ` : ""}Please enter the correct transaction reference below and submit your application again.



                        </p>



                      </div>



                    )}



                    <div className="text-center mb-4">



                      <p className="text-sm font-semibold text-navy dark:text-white">Scan the QR code to pay</p>



                      <p className="mt-1 text-sm text-muted-foreground">



                        Application fee: <strong className="text-navy dark:text-gold">₹{Number(fee.amount).toLocaleString("en-IN")}</strong>



                      </p>



                    </div>



                    <div className="flex flex-col items-center gap-4">



                      <div className="rounded-xl border border-border bg-white p-4 shadow-sm">



                        {fee.upi?.qrConfigured && fee.upi.qrUrl ? (



                          <img



                            src={`${API_BASE_URL}${fee.upi.qrUrl}`}



                            alt="UPI payment QR code"



                            className="h-64 w-64 max-w-full object-contain"



                            referrerPolicy="no-referrer"



                          />



                        ) : (



                          <div className="flex h-64 w-64 max-w-full flex-col items-center justify-center gap-2 rounded-lg bg-muted text-center">



                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-10 w-10 text-muted-foreground" aria-hidden="true">



                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />



                            </svg>



                            <p className="px-4 text-sm text-muted-foreground">QR code not available yet. Please contact the trust office for payment instructions.</p>



                          </div>



                        )}



                      </div>



                      <div className="text-center space-y-2 w-full max-w-md">



                        {fee.upi?.vpa && (



                          <p className="text-sm font-mono text-navy dark:text-gold bg-gold-soft px-3 py-2 rounded-lg">



                            UPI ID: {fee.upi.vpa}



                          </p>



                        )}



                        <p className="text-sm text-muted-foreground">



                          After completing the payment, enter the transaction reference below and submit your application.



                        </p>



                      </div>



                    </div>



                    <div className="mt-6 pt-6 border-t border-border">



                      <div className="space-y-3 text-sm text-navy-800 dark:text-muted-foreground">



                        {fee.upi?.instructions ? (



                          <p className="whitespace-pre-line text-muted-foreground">{fee.upi.instructions}</p>



                        ) : (



                          <ol className="list-decimal space-y-1.5 pl-5">



                            <li>Open any UPI app (GPay, PhonePe, Paytm, etc.)</li>



                            <li>Choose "Scan & Pay" and scan the QR code above</li>



                            <li>Enter the application fee amount and complete the payment</li>



                            <li>Copy the UPI transaction reference (UTR) and enter it below</li>



                          </ol>



                        )}



                        <label className="block">



                          <span className="field-label">
                            Transaction ID / UTR <span className="text-destructive">*</span>
                          </span>



                          <input



                            id="upi-txn-input"



                            type="text"



                            className="field-input"



                            placeholder="Enter your UPI Transaction ID / UTR"



                            value={upiTxnId}



                            onChange={(e) => {
                              setUpiTxnId(e.target.value);
                              setTxnError(null);
                            }}



                          />



                          {txnError && (
                            <p className="mt-1 text-sm font-medium text-destructive" id="upi-txn-error">{txnError}</p>
                          )}



                          <p className="mt-1 text-xs text-muted-foreground">
                            Enter the Transaction ID / UTR shown in your UPI payment receipt.
                          </p>



                        </label>



                        <label className="flex items-start gap-3 rounded-lg border border-border bg-surface-muted p-3 cursor-pointer">



                          <input



                            type="checkbox"



                            checked={showPaymentConfirm}



                            onChange={(e) => setShowPaymentConfirm(e.target.checked)}



                            className="mt-1 h-4 w-4 accent-[#d4af37]"



                          />



                          <span className="text-sm text-navy-800 dark:text-muted-foreground">



                            I confirm that I have completed the payment.



                          </span>



                        </label>



                        <div id="upi-screenshot-input-block" className="mt-5 rounded-xl border border-border bg-surface-muted p-4">



                          <span className="field-label">
                            Payment Screenshot <span className="text-destructive">*</span>
                          </span>



                          <p className="mt-1 text-sm text-muted-foreground">
                            Upload a screenshot of your successful UPI payment.
                          </p>



                          {paymentScreenshot || screenshotFile ? (
                            <div className="mt-3 space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-success/30 bg-success/5 px-4 py-3">
                                <div className="flex min-w-0 items-center gap-3">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5 shrink-0 text-success" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                  </svg>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-success">
                                      {screenshotFile ? screenshotFile.name : paymentScreenshot?.name || "Payment screenshot"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {screenshotUploading
                                        ? "Uploading…"
                                        : paymentScreenshot
                                          ? "Screenshot uploaded. You can replace it if needed."
                                          : "Click Upload to attach your screenshot."}
                                    </p>
                                  </div>
                                </div>
                                {!screenshotUploading && (
                                  <div className="flex items-center gap-2">
                                    {paymentScreenshot && !screenshotFile && applicationId ? (
                                      <a
                                        href={`${API_BASE_URL}/api/payments/application/${encodeURIComponent(applicationId)}/screenshot`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        referrerPolicy="no-referrer"
                                        className="btn-outline px-3 py-1.5 text-xs"
                                      >
                                        View
                                      </a>
                                    ) : null}
                                    <label className="btn-outline cursor-pointer px-3 py-1.5 text-xs">
                                      {screenshotFile ? "Change" : "Replace"}
                                      <input type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" className="hidden" onChange={handleScreenshotSelect} />
                                    </label>
                                  </div>
                                )}
                              </div>
                              {screenshotFile && !screenshotUploading && (
                                <button type="button" onClick={handleScreenshotUpload} className="btn-gold w-full sm:w-auto">
                                  {paymentScreenshot ? "Replace screenshot" : "Upload screenshot"}
                                </button>
                              )}
                            </div>
                          ) : (
                            <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/40 px-4 py-8 text-center transition hover:border-gold/60 hover:bg-gold-soft/40">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8 text-muted-foreground" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                              </svg>
                              <span className="text-sm font-medium text-navy dark:text-white">
                                Click to upload your payment screenshot
                              </span>
                              <span className="text-xs text-muted-foreground">JPEG, PNG or PDF — show the successful payment receipt</span>
                              <input type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" className="hidden" onChange={handleScreenshotSelect} />
                            </label>
                          )}



                          {paymentScreenshot?.uploadedAt && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Uploaded on {new Date(paymentScreenshot.uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          )}



                          {screenshotError && (
                            <p className="mt-2 text-sm font-medium text-destructive" role="alert">{screenshotError}</p>
                          )}



                        </div>



                        <p className="text-xs text-muted-foreground">



                          After you submit, our team will verify your transaction. Your application will be marked as paid once it is confirmed.



                        </p>



                      </div>



                    </div>



                  </div>



                )}



                {fee && fee.enabled && fee.amount > 0 && fee.paymentMethod === "razorpay" && !paymentVerified && (



                  <div className="mt-6 rounded-xl border border-gold/30 bg-white p-6 dark:border-gold/20 dark:bg-[#131a2e]">



                    <p className="text-sm text-muted-foreground">Online payment gateway is being configured. Please check back shortly.</p>



                  </div>



                )}



                {paymentVerified && (



                  <div className="mt-5 grid gap-3 rounded-xl border border-border bg-white dark:bg-[#131a2e] p-5 sm:grid-cols-2">



                    <div>



                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Payment Status</p>



                      <p className="mt-1 text-sm font-semibold text-success">Payment Verified</p>



                    </div>



                    <div>



                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Amount Paid</p>



                      <p className="mt-1 text-sm font-semibold text-navy dark:text-white">₹{Number(paymentRef?.amount ?? fee?.amount ?? 0).toLocaleString("en-IN")}</p>



                    </div>



                    {paymentRef?.txnId && (



                      <div>



                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Transaction ID / UTR</p>



                        <p className="mt-1 font-mono text-sm text-navy dark:text-white">{paymentRef.txnId}</p>



                      </div>



                    )}



                    {paymentRef?.verifiedAt && (



                      <div>



                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Verified On</p>



                        <p className="mt-1 text-sm text-navy dark:text-white">



                          {new Date(paymentRef.verifiedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}



                        </p>



                      </div>



                    )}



                  </div>



                )}



                {!fee?.enabled && (



                  <p className="mt-4 text-sm text-muted-foreground">



                    Application fee collection is currently disabled. You may proceed to submit.



                  </p>



                )}





                {paymentNotice && (



                  <div



                    role="alert"



                    className={`mt-4 rounded-lg border px-4 py-3 text-sm ${



                      paymentNotice.type === "error"



                        ? "border-destructive/30 bg-destructive/5 text-destructive"



                        : paymentNotice.type === "success"



                          ? "border-success/30 bg-success/5 text-success"



                          : "border-gold/40 bg-gold-soft text-navy-800"



                    }`}



                  >



                    {paymentNotice.text}



                  </div>



                )}




</div>



            </div>



          )}





          {currentStep === 7 && (


            <div className="space-y-6">


              {applicationId && (


                <div className="rounded-xl border border-gold/40 bg-gold-soft px-4 py-3 text-sm text-navy-800">


                  <strong>Application ID:</strong> {applicationId}


                </div>


              )}


              <div className="space-y-5">


                <ReviewBlock title="Personal Information">


                  <ReviewRow label="Name (as per Certificate)" value={form.certificateName} />


                  <ReviewRow label="Name (as per Bank Record)" value={form.bankRecordName} />


                  <ReviewRow label="Date of Birth" value={form.dateOfBirth} />


                  <ReviewRow label="Gender" value={form.gender} />


                  <ReviewRow label="Phone" value={form.phone} />


                </ReviewBlock>


                <ReviewBlock title="Contact Information">


                  <ReviewRow label="Door Number" value={form.doorNumber} />


                  <ReviewRow label="Street Address" value={form.street} />


                  <ReviewRow label="City" value={form.city} />


                  <ReviewRow label="District" value={form.district} />


                  <ReviewRow label="State" value={form.state} />


                  <ReviewRow label="PIN Code" value={form.pinCode} />


                </ReviewBlock>


                <ReviewBlock title="Academic Details">


                  <ReviewRow label="Academic Type" value={isSchool ? "School" : isCollege ? "College" : ""} />


                  {isSchool ? (


                    <>


                      <ReviewRow label="School Name" value={form.schoolName} />


                      <ReviewRow label="School Address" value={form.schoolAddress} />


                      <ReviewRow label="Class" value={form.className} />


                      <ReviewRow label="Section" value={form.section} />


                    </>


                  ) : isCollege ? (


                    <>


                      <ReviewRow label="College Name" value={form.collegeName} />


                      <ReviewRow label="College Address" value={form.collegeAddress} />


                      <ReviewRow label="Course" value={form.course} />


                      <ReviewRow label="Semester" value={form.semester} />


                      <ReviewRow label="UG / PG" value={form.ugPg} />


                    </>


                  ) : (


                    <ReviewRow label="Education" value="Not provided" />


                  )}


                  <ReviewRow label="Academic Year" value={form.academicYear} />


                </ReviewBlock>


                {form.familyStatus === "PARENTS" ? (


                  <ReviewBlock title="Family & Financial Information">


                    <ReviewRow label="Family Status" value="Parents" />


                    <ReviewRow label="Father Name" value={form.guardianName} />


                    <ReviewRow label="Mother Name" value={form.motherName} />


                    <ReviewRow label="Family Annual Income" value={form.familyIncome ? `₹${Number(form.familyIncome).toLocaleString("en-IN")}` : ""} />


                    <ReviewRow label="Income Source" value={form.incomeSource} />


                  </ReviewBlock>


                ) : form.familyStatus === "SINGLE_PARENT" ? (


                  <ReviewBlock title="Family & Financial Information">


                    <ReviewRow label="Family Status" value="Single Parent" />


                    <ReviewRow label="Parent/Guardian" value={form.guardianName} />


                    <ReviewRow label="Relationship" value={form.relationship} />


                    <ReviewRow label="Family Annual Income" value={form.familyIncome ? `₹${Number(form.familyIncome).toLocaleString("en-IN")}` : ""} />

<ReviewRow label="Income Source" value={form.incomeSource} />


                  </ReviewBlock>


                ) : (


                  <ReviewBlock title="Family & Parent Information">


                    <ReviewRow label="Family Status" value="No Parents" />


                    <ReviewRow label="Father Name" value={form.guardianName} />


                    <ReviewRow label="Guardian Name" value={form.parent2Name} />


                    <ReviewRow label="Mobile Number" value={form.contactNumber} />


                  </ReviewBlock>


                )}


                <ReviewBlock title="Bank Details">


                  <ReviewRow label="Account Holder Name" value={form.accountHolderName} />


                  <ReviewRow
                    label="Account Number"
                    value={maskAccountNumber(form.accountNumber)}
                  />


                  <ReviewRow label="Bank Name" value={form.bankName} />


                  <ReviewRow label="Branch Name" value={form.branchName} />


                  <ReviewRow label="IFSC Code" value={form.ifscCode} />


                </ReviewBlock>


                  <ReviewBlock title="Recommended By">


                  <ReviewRow label="Recommender 1 Name" value={form.recommender1Name} />


                  <ReviewRow label="Recommender 1 Occupation " value={form.recommender1Designation} />


                  <ReviewRow label="Recommender 1 Mobile Number" value={form.recommender1Mobile} />


                  {hasRecommender2 && (
                    <>


                      <div className="sm:col-span-2">


                        <dt className="text-xs font-semibold uppercase tracking-wide text-navy-700 dark:text-slate-300">
                          Recommender 2 (optional)
                        </dt>


                      </div>


                      <ReviewRow label="Recommender 2 Name" value={form.recommender2Name} />


                      <ReviewRow label="Recommender 2 Occupation " value={form.recommender2Designation} />


                      <ReviewRow label="Recommender 2 Mobile Number" value={form.recommender2Mobile} />


                    </>
                  )}


                </ReviewBlock>


                <ReviewBlock title="Scholarship">


                  <div className="sm:col-span-2">


                    <dt className="text-xs text-muted-foreground">Scholarship Amount (₹) *</dt>


                    <dd className="mt-1.5">


                      <input


                        id="scholarshipAmount"


                        type="number"


                        className="field-input"


                        placeholder="Enter the scholarship amount you are requesting"


                        value={form.scholarshipAmount}


                        onChange={(e) => set("scholarshipAmount", e.target.value)}


                        min={1}


                        inputMode="numeric"


                      />


                      <p className="mt-1.5 text-xs text-muted-foreground">


                        Enter the amount of scholarship assistance you are requesting.


                      </p>


                      {errors.scholarshipAmount && (
                        <p className="mt-1.5 text-sm text-destructive" role="alert">
                          {errors.scholarshipAmount}
                        </p>
                      )}


                      {form.scholarshipAmount && (
                        <p className="mt-1.5 text-sm text-foreground">


                          Requested Scholarship Amount:{" "}


                          <span className="font-semibold">


                            ₹{Number(form.scholarshipAmount).toLocaleString("en-IN")}


                          </span>


                        </p>
                      )}


                    </dd>


                  </div>


                </ReviewBlock>


                <ReviewBlock title="Documents">


                  <ReviewRow label="Uploaded documents" value={docCount > 0 ? `${docCount} document(s) selected` : "No documents selected"} />


                </ReviewBlock>


              </div>








            </div>


          )}


        </div>





        {/* Applicant Declaration. Rendered after every application step and


            immediately before the final Submit Application action, because that


            is where the applicant actually commits to the statement. */}


        {currentStep === 8 && (


          <section


            aria-labelledby="applicant-declaration-heading"


            className="rounded-xl border-2 border-navy/25 bg-white p-5 shadow-sm dark:border-gold/30 dark:bg-[#131a2e] sm:p-6"


          >


            <h3


              id="applicant-declaration-heading"


              className="text-base font-semibold text-navy dark:text-gold"


            >


              Applicant Declaration


            </h3>


            <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground dark:text-slate-300">


              <p>


                I hereby declare that all the information provided by me in this scholarship application is true, correct, and complete to the best of my knowledge. I further declare that all documents and information submitted by me are genuine and authentic.


              </p>


              <p>


                I understand that providing any false, misleading, or forged information or documents may result in the rejection or cancellation of my scholarship application and may subject me to appropriate action as per the applicable rules.


              </p>


              <p>I have read and understood the above declaration and agree to abide by its terms.</p>


            </div>


            <label


              htmlFor="applicant-declaration-checkbox"


              className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg bg-surface-muted p-3 dark:bg-[#0d1220]"


            >


              <input


                id="applicant-declaration-checkbox"


                name="declarationAccepted"


                type="checkbox"


                checked={declarationAccepted}


                aria-required="true"


                aria-invalid={declarationError ? true : undefined}


                aria-describedby={declarationError ? "applicant-declaration-error" : "applicant-declaration-hint"}


                disabled={savingDeclaration}


                onChange={async (e) => {


                  const accepted = e.target.checked;


                  setDeclarationAccepted(accepted);


                  if (!accepted) {


                    setDeclarationPersisted(false);


                    setDeclarationError("Please tick the agreement checkbox to submit your application.");


                    await persistDeclaration(false);


                    return;


                  }


                  setDeclarationError(null);


                  const saved = await persistDeclaration(true);


                  if (!saved) {


                    setDeclarationError("We could not save your agreement. Please try again.");


                  }


                }}


                className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-border text-navy accent-[#d4af37] focus:ring-2 focus:ring-navy/30 disabled:cursor-wait"


              />


              <span className="text-sm font-medium text-foreground">


                I agree to the above Applicant Declaration.


              </span>


            </label>


            {declarationError ? (


              <p


                id="applicant-declaration-error"


                role="alert"


                className="mt-3 flex items-start gap-2 text-sm font-medium text-destructive"


              >


                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />


                {declarationError}


              </p>


            ) : (


              <p id="applicant-declaration-hint" className="mt-3 text-sm text-muted-foreground">


                {declarationPersisted


                  ? "Your agreement has been saved with this application."


                  : "You must agree to this declaration before you can submit your application."}


              </p>


            )}


          </section>


        )}


        </fieldset>


        {/* Footer nav */}


        <div className="flex flex-col-reverse items-stretch gap-3 border-t border-border bg-navy-50/50 dark:bg-white/5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">


          <button


            type="button"


            onClick={goBack}


            disabled={currentStep === 0}


            className="btn-outline disabled:cursor-not-allowed disabled:opacity-50"


          >


            ← Previous


          </button>





          {/* Save, Continue-to-Payment and Submit all write to the application, so they
            are offered only while the backend says it is still editable. The
            backend rejects them regardless; this keeps the UI honest. */}
          {applicationEditable && currentStep < 7 && (


            <button


              type="button"


              onClick={continueFromCurrentStep}


              disabled={saving}


              className="btn-gold disabled:cursor-not-allowed disabled:opacity-60"


            >


              {saving ? "Saving…" : currentStep === 6 ? "Continue to Review →" : "Save & Continue →"}


            </button>


          )}





{applicationEditable && currentStep === 7 && (


            <button


              type="button"


              onClick={() => {


                // The Review step collects the requested scholarship amount, so


                // validate it before allowing the applicant on to Payment.


                const e = validateStep(7, form);


                if (Object.keys(e).length > 0) {


                  setErrors(e);


                  setFormNotice({ type: "error", text: "Please correct the highlighted fields before continuing." });


                  window.scrollTo({ top: 0, behavior: "smooth" });


                  return;


                }


                setErrors({});


                setFormNotice(null);


                advanceTo(8);


              }}


              className="btn-gold"


            >


              Continue to Payment →


            </button>


          )}{applicationEditable && currentStep === 8 && (


            <button


              type="button"


              onClick={submitApplication}


              aria-disabled={!declarationAccepted || submitting}


              disabled={submitting || (fee?.paymentMethod === "razorpay" && fee?.enabled !== false && paymentStatus !== "SUCCESS")}


              className="btn-gold disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60"


            >


              {submitting ? "Submitting…" : "Submit Application"}


            </button>


          )}


        </div>


      </div>


    </div>


  );


}





function ReviewBlock({ title, children }: { title: string; children: React.ReactNode }) {


  return (


    <section className="rounded-xl border border-border bg-white dark:bg-[#131a2e] p-5">


      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy-700 dark:text-slate-300">{title}</h3>


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


