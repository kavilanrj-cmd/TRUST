// Scholarship application deadline configuration helper.
// The deadline is stored as a single WebsiteSetting row (app.applicationDeadline)
// in a proper date/time format (ISO-8601 UTC), editable by the founder/admin.
// Display strings are derived with Asia/Kolkata timezone so Indian users always
// see the same date regardless of their browser timezone. The backend is the
// final authority on whether applications are open/closed.

import prisma from "./db";

export const DEADLINE_KEY = "app.applicationDeadline";

export interface ApplicationDeadlineConfig {
  // ISO-8601 UTC string of the configured deadline (null when not set).
  deadline: string | null;
  // Human-friendly date rendered in Asia/Kolkata, e.g. "30 September 2026".
  formatted: string | null;
  // Whether the deadline has passed (applications closed).
  closed: boolean;
}

// Render a UTC date in the India timezone as a long-form date.
export function formatISTDate(d: Date): string {
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export async function getApplicationDeadlineConfig(): Promise<ApplicationDeadlineConfig> {
  const row = await prisma.websiteSetting.findUnique({
    where: { key: DEADLINE_KEY },
  });
  const raw = row && !row.isSecret ? row.value || "" : "";
  let deadline: Date | null = null;
  if (raw) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) deadline = d;
  }
  const formatted = deadline ? formatISTDate(deadline) : null;
  const closed = deadline ? deadline.getTime() < Date.now() : false;
  return {
    deadline: deadline ? deadline.toISOString() : null,
    formatted,
    closed,
  };
}

// Standardised "closed" message shown whenever a new application is rejected.
export function deadlineClosedMessage(deadline: Date): string {
  const formatted = formatISTDate(deadline);
  return `Applications for this scholarship are now closed. The last date to apply was ${formatted}.`;
}

// Enforce the deadline for creating a NEW application.
// Returns an error message string when closed, or null when still open/no deadline.
export async function isApplicationDeadlinePassed(): Promise<boolean> {
  const cfg = await getApplicationDeadlineConfig();
  return cfg.deadline ? new Date(cfg.deadline).getTime() < Date.now() : false;
}
