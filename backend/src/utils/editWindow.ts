// Candidate edit window.
//
// An applicant may edit their own application while it is still eligible for
// candidate editing:
//
//   DRAFT                 always editable
//   CORRECTION_REQUESTED  always editable (the admin explicitly asked for a fix)
//   SUBMITTED             editable for 7 days after `submittedAt`
//   UNDER_REVIEW          editable for 7 days after `submittedAt`
//   DOCUMENT_VERIFICATION editable for 7 days after `submittedAt`
//   WAITLISTED            editable for 7 days after `submittedAt`
//   ACCEPTED / APPROVED   locked permanently, immediately, forever
//   REJECTED              locked (the rejection workflow owns it)
//   WITHDRAWN             locked
//
// Two rules matter more than the rest:
//
//  1. The window is measured from the stored `submittedAt`, never from anything
//     the client sends, so changing the browser clock or replaying an old URL
//     cannot reopen it.
//  2. APPROVED/ACCEPTED is a permanent, immediate lock that overrides whatever is
//     left of the 7 days. "Locked" here means only that the *candidate* can no
//     longer change it; admins keep their existing review workflow.
//
// `now` is passed in rather than read from `Date.now()` inside each rule so every
// decision in a single request is made against one timestamp, and so the rules
// stay testable.

export const CANDIDATE_EDIT_WINDOW_DAYS = 7;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Statuses whose lock is a decision, not a timeout.
const PERMANENTLY_LOCKED_APPROVED = ["ACCEPTED", "APPROVED"] as const;

// Statuses that are never candidate-editable, whatever the clock says. These were
// already rejected by the previous `status === "DRAFT" || "CORRECTION_REQUESTED"`
// check, so nothing that used to work stops working.
const LOCKED_WITHOUT_DECISION = ["REJECTED", "WITHDRAWN"] as const;

// Always editable: a draft has no submission yet, and CORRECTION_REQUESTED is the
// admin's explicit "fix and resubmit" signal. The 7-day clock does not apply to
// either, because the applicant is not editing a submission in progress.
const ALWAYS_EDITABLE = ["DRAFT", "CORRECTION_REQUESTED"] as const;

// The only statuses the 7-day window is measured for.
const TIMED_EDITABLE = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "DOCUMENT_VERIFICATION",
  "WAITLISTED",
] as const;

export type EditLockReason =
  | "editable"
  | "approved"
  | "expired"
  | "decided"
  | "unsupported-status";

export interface EditWindowInput {
  status: string;
  submittedAt: Date | string | null;
}

export interface Editability {
  editable: boolean;
  reason: EditLockReason;
  /** Safe to show the applicant. Null when the application is editable. */
  message: string | null;
  /** ISO timestamp when the window closes. Null when there is no window. */
  editDeadline: string | null;
  /** Whole days left in the window, as counted by the server. */
  daysRemaining: number | null;
  windowDays: number;
}

export const EDIT_MESSAGES = {
  approved:
    "Your application has been approved and can no longer be edited.",
  expired: "Application editing period has expired.",
  decided:
    "Application editing is no longer available.",
} as const;

// The only field this module needs. Callers pass the whole Prisma row, and the
// deliberate narrow shape here keeps a status from being spelled differently at
// two call sites.
function toDate(value: Date | string | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function locked(
  reason: Exclude<EditLockReason, "editable">,
  message: string
): Editability {
  return {
    editable: false,
    reason,
    message,
    editDeadline: null,
    daysRemaining: null,
    windowDays: CANDIDATE_EDIT_WINDOW_DAYS,
  };
}

/**
 * Decide whether the candidate who owns this application may change it.
 * `now` must be the server's clock.
 */
export function evaluateEditability(
  application: EditWindowInput,
  now: Date = new Date()
): Editability {
  const status = application.status;

  if ((PERMANENTLY_LOCKED_APPROVED as readonly string[]).includes(status)) {
    return locked("approved", EDIT_MESSAGES.approved);
  }

  if ((LOCKED_WITHOUT_DECISION as readonly string[]).includes(status)) {
    return locked("decided", EDIT_MESSAGES.decided);
  }

  if ((ALWAYS_EDITABLE as readonly string[]).includes(status)) {
    return {
      editable: true,
      reason: "editable",
      message: null,
      editDeadline: null,
      daysRemaining: null,
      windowDays: CANDIDATE_EDIT_WINDOW_DAYS,
    };
  }

  if (!(TIMED_EDITABLE as readonly string[]).includes(status)) {
    // An unknown status must not become editable by accident.
    return locked("unsupported-status", EDIT_MESSAGES.decided);
  }

  const submittedAt = toDate(application.submittedAt);
  if (!submittedAt) {
    // Submitted with no timestamp: the window cannot be proven open, so it is
    // closed. Only the admin-side backfill writes `submittedAt` when missing.
    return locked("expired", EDIT_MESSAGES.expired);
  }

  const deadline = new Date(submittedAt.getTime() + CANDIDATE_EDIT_WINDOW_DAYS * MS_PER_DAY);

  // The window is half-open: the instant the deadline is reached it is over, so
  // an application submitted at 10:00 on 2 Oct stops being editable at 10:00 on
  // 9 Oct.
  if (now.getTime() >= deadline.getTime()) {
    return locked("expired", EDIT_MESSAGES.expired);
  }

  const msLeft = deadline.getTime() - now.getTime();
  return {
    editable: true,
    reason: "editable",
    message: null,
    editDeadline: deadline.toISOString(),
    // Whole days left, rounded up, so "1 day" is never shown for something that
    // expires in twenty minutes.
    daysRemaining: Math.max(1, Math.ceil(msLeft / MS_PER_DAY)),
    windowDays: CANDIDATE_EDIT_WINDOW_DAYS,
  };
}

/** True when the candidate may change the application. */
export function isCandidateEditable(
  application: EditWindowInput,
  now: Date = new Date()
): boolean {
  return evaluateEditability(application, now).editable;
}

/** Safe, non-leaky rejection body for every student mutating endpoint. */
export function editRejectedResponse(editability: Editability) {
  return {
    status: 403,
    body: {
      error: editability.message ?? EDIT_MESSAGES.decided,
      reason: editability.reason,
      editable: false,
      editDeadline: editability.editDeadline,
    },
  };
}