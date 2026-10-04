// Client-side view of the candidate edit window.
//
// Nothing here computes the window. Every value comes from the backend in
// `application.editability` (see `backend/src/utils/editWindow.ts`), which decides
// using its own clock and the stored `submittedAt`. The browser is never asked to
// work out whether an application is still editable, so changing the system clock,
// replaying an old page or editing the payload cannot reopen anything — and a
// stale local decision can at worst show a slightly old message, never unlock a
// field the server would reject.

export type EditLockReason =
  | "editable"
  | "approved"
  | "expired"
  | "decided"
  | "unsupported-status";

export interface Editability {
  editable: boolean;
  reason: EditLockReason;
  message: string | null;
  /** ISO timestamp when the window closes. */
  editDeadline: string | null;
  /** Whole days left, counted by the server. */
  daysRemaining: number | null;
  windowDays: number;
}

// Used only when a response predates this field, so an old backend cannot make an
// application look editable when it is not: fall back to the only statuses that
// were ever editable before the window existed.
function fallbackEditability(status: string | null | undefined): Editability {
  const editable = status === "DRAFT" || status === "CORRECTION_REQUESTED";
  return {
    editable,
    reason: editable ? "editable" : "decided",
    message: editable
      ? null
      : "Application editing is no longer available.",
    editDeadline: null,
    daysRemaining: null,
    windowDays: 7,
  };
}

export function readEditability(
  application: { editability?: Editability | null; status?: string | null } | null | undefined
): Editability {
  return application?.editability ?? fallbackEditability(application?.status);
}

/** True when the candidate may still change the application. */
export function canEditApplication(
  application: { editability?: Editability | null; status?: string | null } | null | undefined
): boolean {
  return readEditability(application).editable;
}

// "Application editing available for 5 days." — wording is server-supplied so it
// cannot drift from the rule that produced it.
export function editWindowNotice(editability: Editability): string | null {
  if (!editability.editable) return editability.message;
  if (editability.daysRemaining === null) return null;
  const days = editability.daysRemaining;
  return days <= 1
    ? "Application editing available for 1 day."
    : `Application editing available for ${days} days.`;
}

// Approved is a decision, not a timeout, so it gets its own wording in the UI.
export function isApprovedLock(editability: Editability): boolean {
  return editability.reason === "approved";
}

export function isExpiredLock(editability: Editability): boolean {
  return editability.reason === "expired";
}