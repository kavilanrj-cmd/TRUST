// Which of the nine application steps the applicant has actually finished.
//
// This is the single source of truth for "how far along is this application", used
// by the student dashboard indicator and by the dashboard's "Continue Application"
// link. It is deliberately derived from stored application data only: no step is
// ever marked complete because the applicant looked at it, and nothing is faked.
//
// The rules mirror the wizard's own per-step validation (see `validateStep` in
// components/student/ApplicationForm.tsx) and the backend submission gate, so the
// dashboard never promises progress the server would refuse.
//
// A step is judged on its own evidence rather than on the position of the previous
// one, because the stored rows are what the backend actually validates. The single
// "current" step is then the earliest incomplete step, which is exactly where
// "Continue Application" should land.

export const APPLICATION_STEP_LABELS = [
  "Personal",
  "Contact",
  "Academic",
  "Family",
  "Bank Details",
  "Recommended By",
  "Documents",
  "Review",
  "Payment",
] as const;

export type ApplicationStepLabel = (typeof APPLICATION_STEP_LABELS)[number];

export type ApplicationStepState = "complete" | "current" | "upcoming";

export interface ApplicationStepProgress {
  /** Zero-based wizard step index, matching the wizard's own STEPS order. */
  index: number;
  label: ApplicationStepLabel;
  state: ApplicationStepState;
  /** Short explanation of what this step is waiting on. */
  hint: string;
}

export interface ApplicationProgress {
  steps: ApplicationStepProgress[];
  /** First incomplete step (zero-based), or null when nothing is outstanding. */
  nextIncompleteStep: number | null;
  /** True once the applicant has a stored draft. */
  started: boolean;
  /** True once the application has been submitted to the Trust. */
  submitted: boolean;
  /** Short status sentence shown above the indicator. */
  summary: string;
}

// Only the fields this module reads. Both the dashboard (/api/applications/me)
// and the wizard (/api/applications/me) receive this shape.
export interface ProgressApplication {
  status?: string | null;
  submittedAt?: string | null;
  personalDetails?: Record<string, unknown> | null;
  address?: Record<string, unknown> | null;
  parentGuardian?: Record<string, unknown> | null;
  academicDetails?: Record<string, unknown> | null;
  financialDetails?: Record<string, unknown> | null;
  bankDetails?: Record<string, unknown> | null;
  recommenderDetails?: Record<string, unknown> | null;
  documents?: Array<{ key: string; label?: string; uploaded?: boolean }> | null;
  payment?: { status?: string | null } | null;
  paymentStatus?: string | null;
}

const PHONE_RX = /^[6-9]\d{9}$/;
const PIN_RX = /^[0-9]{6}$/;
const IFSC_RX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function filled(value: unknown): boolean {
  return text(value).length > 0;
}

function positiveNumber(value: unknown): boolean {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

// Stored rows can predate a renamed API field, so the recommender designation is
// read from the current key and falls back to the original one.
function recommenderDesignation(row: Record<string, unknown> | null | undefined, index: 1 | 2) {
  if (!row) return "";
  return text(row[`recommender${index}Designation`]) || text(row[`recommender${index}Roll`]);
}

export type AcademicType = "" | "school" | "college";

/**
 * Which branch of the Academic step a stored application belongs to.
 *
 * Applications created before `academicType` was reliably stored only carry the
 * legacy `schoolCollege` value, so the branch is inferred from the surrounding
 * academic data rather than treating the step as unfinished forever. Shared with
 * the wizard, which uses the same rule to preselect the radio buttons.
 */
export function resolveAcademicType(academic: {
  academicType?: unknown;
  schoolName?: unknown;
  collegeName?: unknown;
  className?: unknown;
  course?: unknown;
  semester?: unknown;
  schoolCollege?: unknown;
}): AcademicType {
  const explicit = text(academic?.academicType).toLowerCase();
  if (explicit === "school" || explicit === "college") return explicit;
  if (filled(academic?.className)) return "school";
  if (filled(academic?.course) || filled(academic?.semester)) return "college";
  if (filled(academic?.schoolName)) return "school";
  if (filled(academic?.collegeName)) return "college";
  if (filled(academic?.schoolCollege)) return "school";
  return "";
}

// "No Parents" applicants do not declare an income, matching the wizard and the
// backend submission gate.
function isNoParents(row: Record<string, unknown> | null | undefined): boolean {
  return !!row && !!text(row.parent2Name) && !row.isSingleParent;
}

const SUBMITTED_STATES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "DOCUMENT_VERIFICATION",
  "APPROVED",
  "ACCEPTED",
  "REJECTED",
  "WAITLISTED",
  "CORRECTION_REQUESTED",
];

export function evaluateApplicationProgress(
  application: ProgressApplication | null | undefined
): ApplicationProgress {
  const app = application ?? null;
  const started = !!app;
  const status = (app?.status || "DRAFT").toString();
  const submitted = SUBMITTED_STATES.includes(status);

  const personal = app?.personalDetails ?? null;
  const address = app?.address ?? null;
  const guardian = app?.parentGuardian ?? null;
  const academic = app?.academicDetails ?? null;
  const financial = app?.financialDetails ?? null;
  const bank = app?.bankDetails ?? null;
  const recommender = app?.recommenderDetails ?? null;

  // Family covers the parent/guardian block and, for everyone except "No Parents"
  // applicants, the declared income. Mirrors validateStep(3) exactly.
  const guardianBaseComplete =
    !!guardian && filled(guardian.guardianName) && filled(guardian.relationship);
  const incomeComplete =
    !!financial && positiveNumber(financial.familyIncome) && filled(financial.incomeSource);
  const familyComplete = guardianBaseComplete &&
    // "No Parents" declares no income and instead names both parents.
    (isNoParents(guardian)
      ? filled(guardian?.parent2Relationship)
      : incomeComplete);

  // Mirrors validateStep(0): the step has no opinion on age ranges beyond parsing
  // the date, so only a stored, parseable date of birth is required here.
  const personalComplete =
    !!personal &&
    filled(personal.fullName) &&
    !isNaN(Date.parse(text(personal.dateOfBirth))) &&
    filled(personal.gender) &&
    PHONE_RX.test(text(personal.phone));

  const contactComplete =
    !!address &&
    filled(address.street) &&
    filled(address.city) &&
    filled(address.district) &&
    filled(address.state) &&
    PIN_RX.test(text(address.pinCode));

  // Mirrors validateStep(2). The institution name, address and academic year are
  // what the step requires; course additionally applies to college applicants. The
  // branch is resolved the same way the wizard resolves it, so a draft saved before
  // `academicType` existed is not treated as unfinished.
  const academicType = resolveAcademicType(academic ?? {});
  const academicComplete =
    !!academic &&
    filled(academic.academicYear) &&
    (academicType === "school"
      ? filled(academic.schoolName) && filled(academic.schoolAddress)
      : academicType === "college"
        ? filled(academic.collegeName) &&
          filled(academic.collegeAddress) &&
          filled(academic.course)
        : false);

  const bankComplete =
    !!bank &&
    filled(bank.accountHolderName) &&
    filled(bank.accountNumber) &&
    filled(bank.bankName) &&
    filled(bank.branchName) &&
    IFSC_RX.test(text(bank.ifscCode).toUpperCase());

  // Recommender 1 is required. Recommender 2 is optional, so an absent second
  // recommender is complete and a half-entered one is not.
  const recommender1Complete =
    !!recommender &&
    filled(recommender.recommender1Name) &&
    filled(recommenderDesignation(recommender, 1)) &&
    filled(recommender.recommender1Mobile);

  const recommender2Any =
    filled(recommender?.recommender2Name) ||
    filled(recommenderDesignation(recommender, 2)) ||
    filled(recommender?.recommender2Mobile);
  const recommenderComplete =
    recommender1Complete &&
    (!recommender2Any ||
      (filled(recommender?.recommender2Name) &&
        filled(recommenderDesignation(recommender, 2)) &&
        filled(recommender?.recommender2Mobile)));

  // The backend requires at least one uploaded document before submission, which is
  // the same rule the wizard's Documents step enforces.
  const uploadedCount = (app?.documents || []).filter((d) => d.uploaded).length;
  const documentsComplete = uploadedCount > 0;

  // The Review step's only applicant input is the requested scholarship amount.
  const reviewComplete = positiveNumber(financial?.scholarshipAmount);

  // Payment is reported by the Trust itself. Only VERIFIED is a completed payment;
  // PENDING/PENDING_VERIFICATION mean the money is in but not yet confirmed.
  const paymentStatus = (app?.payment?.status || app?.paymentStatus || "").toString();
  const paymentComplete = paymentStatus === "VERIFIED";
  const paymentAwaitingVerification = paymentStatus === "PENDING_VERIFICATION";

  const completed: boolean[] = [
    personalComplete,
    contactComplete,
    academicComplete,
    familyComplete,
    bankComplete,
    recommenderComplete,
    documentsComplete,
    reviewComplete,
    paymentComplete,
  ];

  const hints: string[] = [
    personalComplete ? "Completed" : "Name, date of birth, gender and phone",
    contactComplete ? "Completed" : "Address and contact details",
    academicComplete ? "Completed" : "Institution, course and academic year",
    familyComplete ? "Completed" : "Parent or guardian and family income",
    bankComplete ? "Completed" : "Account holder, bank, branch and IFSC",
    recommenderComplete
      ? "Completed"
      : recommender1Complete
        ? "Finish the optional second recommender or clear it"
        : "First recommender required, second optional",
    documentsComplete ? "Completed" : `${uploadedCount} uploaded`,
    reviewComplete ? "Completed" : "Confirm details and scholarship amount",
    paymentComplete
      ? "Verified by the Trust"
      : paymentAwaitingVerification
        ? "Awaiting verification by the Trust"
        : "Application fee not verified yet",
  ];

  // Exactly one step is "current": the earliest one that is not complete yet. A
  // finished application has no outstanding step, so every step reads complete.
  let nextIncompleteStep: number | null = null;
  for (let index = 0; index < completed.length; index++) {
    if (!completed[index]) {
      nextIncompleteStep = index;
      break;
    }
  }

  // Once the application has been submitted the process is over: the applicant is
  // waiting on the Trust, not on a step, so no step is highlighted as "current".
  // A step with no stored data simply never shows as done, and its hint says why.
  const stepInProgress = submitted ? null : nextIncompleteStep;

  const steps: ApplicationStepProgress[] = APPLICATION_STEP_LABELS.map((label, index) => ({
    index,
    label,
    state: completed[index]
      ? "complete"
      : stepInProgress === index
        ? "current"
        : "upcoming",
    hint: hints[index],
  }));

  let summary: string;
  if (!started) {
    summary = "Not started";
  } else if (submitted) {
    summary = "Application submitted";
  } else if (nextIncompleteStep === null) {
    summary = "Ready to submit";
  } else {
    summary = "In progress";
  }

  return { steps, nextIncompleteStep, started, submitted, summary };
}

/**
 * Where "Continue Application" should send the applicant. Returns null when there
 * is nothing left to fill in, so a caller can hide the action entirely instead of
 * linking to a form with nothing to do.
 */
export function continueApplicationStep(
  application: ProgressApplication | null | undefined
): number | null {
  return evaluateApplicationProgress(application).nextIncompleteStep;
}