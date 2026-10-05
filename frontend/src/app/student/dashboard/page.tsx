"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  BadgeCheck,
  CircleCheck,
  CircleDashed,
  Clock,
  FilePenLine,
  FileText,
  FileUp,
  MailCheck,
  Receipt,
  SearchCheck,
  Send,
  UserRound,
  Wallet,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { useAuth, AuthUser } from "@/lib/auth";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ApplicationProgressIndicator } from "@/components/student/ApplicationProgressIndicator";
import {
  evaluateApplicationProgress,
  type ProgressApplication,
} from "@/lib/application-progress";
import {
  type Editability,
  editWindowNotice,
  readEditability,
} from "@/lib/application-editability";

function StudentDashboardInner() {
  const { user } = useAuth();
  const [application, setApplication] = useState<(ProgressApplication & {
    applicationId: string;
    status: string;
    paymentStatus?: string;
    payment?: {
      id: string | null;
      status: string;
      method?: string | null;
      amount?: number | null;
      txnId?: string | null;
      paymentDate?: string | null;
      verifiedAt?: string | null;
      verificationNote?: string | null;
      screenshot?: { name?: string | null; mime?: string | null; uploadedAt?: string | null } | null;
    } | null;
    documents?: Array<{ key: string; label: string; uploaded: boolean }>;
    decision?: {
      decisionMessage?: string | null;
      reviewedAt?: string | null;
      reviewedByName?: string | null;
      missingDocuments?: string[] | null;
      rejectionReasons?: string[] | null;
      correctionNote?: string | null;
    } | null;
    personalDetails?: Record<string, unknown> | null;
    address?: Record<string, unknown> | null;
    parentGuardian?: Record<string, unknown> | null;
    academicDetails?: Record<string, unknown> | null;
    financialDetails?: Record<string, unknown> | null;
    scholarshipProgram?: { name: string } | null;
    createdAt: string;
    submittedAt: string | null;
    editability?: Editability | null;
  }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/applications/me`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setApplication(data.application || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !user) {
    return (
      <section className="min-h-screen bg-surface-muted flex items-center justify-center py-12">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </section>
    );
  }

  return renderDashboard(user, application);
}

export default function StudentDashboard() {
  return (
    <RequireAuth>
      <StudentDashboardInner />
    </RequireAuth>
  );
}

type StageState = "done" | "current" | "pending";

type TimelineStage = {
  key: string;
  title: string;
  icon: typeof CircleCheck;
  state: StageState;
  hint: string;
};

function StageCircle({
  stage,
  StageIcon,
}: {
  stage: TimelineStage;
  StageIcon: typeof CircleCheck;
}) {
  const base =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors";
  const tone =
    stage.state === "done"
      ? "border-success bg-success text-success-foreground"
      : stage.state === "current"
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-surface-muted text-muted-foreground";
  const stateLabel =
    stage.state === "done"
      ? "completed"
      : stage.state === "current"
        ? "current step"
        : "not started";
  return (
    <span
      className={`${base} ${tone}`}
      aria-label={`${stage.title} - ${stateLabel}`}
      role="img"
    >
      <StageIcon className="h-4 w-4" aria-hidden="true" />
    </span>
  );
}

function StageRail({ done, isLast = false }: { done: boolean; isLast?: boolean }) {
  const tone = done ? "bg-success/45" : "bg-border";
  // Vertical on small screens; horizontal from lg up. The final stage keeps an
  // invisible spacer of the same size so the last circle stays centred.
  return (
    <span
      aria-hidden="true"
      className={`${tone} my-1 block w-0.5 flex-1 rounded-full lg:mx-0 lg:my-0 lg:h-0.5 lg:w-full lg:flex-none ${
        isLast ? "lg:opacity-0" : ""
      }`}
    />
  );
}

function StageText({ stage }: { stage: TimelineStage }) {
  const titleTone =
    stage.state === "done"
      ? "text-success"
      : stage.state === "current"
        ? "text-foreground"
        : "text-muted-foreground";
  const hintTone =
    stage.state === "pending" ? "text-muted-foreground/80" : "text-muted-foreground";
  return (
    <>
      <p
        className={`text-sm leading-tight break-words hyphens-auto ${titleTone} ${
          stage.state === "current" ? "font-semibold" : "font-medium"
        }`}
      >
        {stage.title}
      </p>
      <p className={`mt-1 text-xs leading-snug break-words ${hintTone}`}>{stage.hint}</p>
    </>
  );
}

function renderDashboard(
  user: AuthUser,
  application: (ProgressApplication & {
    applicationId: string;
    status: string;
    paymentStatus?: string;
    payment?: {
      id: string | null;
      status: string;
      method?: string | null;
      amount?: number | null;
      txnId?: string | null;
      paymentDate?: string | null;
      verifiedAt?: string | null;
      verificationNote?: string | null;
      screenshot?: { name?: string | null; mime?: string | null; uploadedAt?: string | null } | null;
    } | null;
    documents?: Array<{ key: string; label: string; uploaded: boolean }>;
    decision?: {
      decisionMessage?: string | null;
      reviewedAt?: string | null;
      reviewedByName?: string | null;
      missingDocuments?: string[] | null;
      rejectionReasons?: string[] | null;
      correctionNote?: string | null;
    } | null;
    personalDetails?: Record<string, unknown> | null;
    address?: Record<string, unknown> | null;
    parentGuardian?: Record<string, unknown> | null;
    academicDetails?: Record<string, unknown> | null;
    financialDetails?: Record<string, unknown> | null;
    scholarshipProgram?: { name: string } | null;
    createdAt: string;
    submittedAt: string | null;
    // Decided by the backend using its own clock; the dashboard never recomputes.
    editability?: Editability | null;
  }) | null
) {
  // The nine-step application process, derived from the stored record only. It is
  // evaluated before the "no application yet" branch so a brand-new applicant also
  // sees the process as not started instead of an empty dashboard.
  const progress = evaluateApplicationProgress(application);
  const continueStep = progress.nextIncompleteStep;

  if (!application) {
    return (
      <section className="min-h-screen bg-background">
        <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 bg-surface-muted">
          <div className="w-full max-w-5xl space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-center mb-4">Welcome, {user.name || user.email.split("@")[0]}</h2>
              <p className="text-muted-foreground text-center">
                NEELAKKANNU EDUCATIONAL TRUST Scholarship Portal
              </p>
            </div>

            <ApplicationProgressIndicator progress={progress} />

            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-xl font-medium mb-2">Start your application</h3>
              <p className="text-muted-foreground">
                You have not started an application yet. The nine steps below are the
                application process; you can begin with Personal details and come back
                to finish the rest at any time.
              </p>
              <Link
                href="/student/application"
                className="mt-4 inline-block py-2 px-4 rounded bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                Start Your Application
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const {
    applicationId,
    status,
    paymentStatus,
    payment,
    documents,
    decision,
    scholarshipProgram,
    createdAt,
    submittedAt,
  } = application;

  const scholarshipProgramName = scholarshipProgram?.name ?? null;
  const studentName = user.name || user.email.split("@")[0];

  const editability = readEditability(application);
  const applicationEditable = editability.editable;
  const editNotice = editWindowNotice(editability);

  // Applicant-entered scholarship amount. This is a distinct value from the
  // admin-configured application fee charged at payment time.
  const requestedScholarshipAmount = (() => {
    const raw = application.financialDetails?.scholarshipAmount;
    const n = typeof raw === "string" ? Number(raw) : raw;
    return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : null;
  })();

  const paymentStatusMap: Record<string, string> = {
    PENDING: "Pending",
    PENDING_VERIFICATION: "Awaiting Verification",
    SUCCESS: "Payment Verified",
    VERIFIED: "Payment Verified",
    FAILED: "Failed",
    REFUNDED: "Refunded",
    REJECTED: "Payment Verification Rejected",
    NOT_SUBMITTED: "Not Yet Submitted",
    NO_PAYMENT: "Not Paid",
  };

  const applicationStatusMap: Record<string, string> = {
    DRAFT: "Draft",
    SUBMITTED: "Submitted",
    UNDER_REVIEW: "Under Review",
    DOCUMENT_VERIFICATION: "Document Verification",
    APPROVED: "Accepted",
    ACCEPTED: "Accepted",
    REJECTED: "Rejected",
    WAITLISTED: "Waitlisted",
    WITHDRAWN: "Withdrawn",
    CORRECTION_REQUESTED: "Correction Requested",
  };

  const effectivePaymentStatus = payment?.status || paymentStatus || "NO_PAYMENT";
  const displayPaymentStatus = paymentStatusMap[effectivePaymentStatus] || "Pending";
  // "Verified" is the only state that means the Trust confirmed the money.
  // SUCCESS is a gateway-level capture; it must not be conflated with the
  // Trust's own verification, nor with the application decision.
  const paymentVerified = payment?.status === "VERIFIED";
  const paymentSubmitted =
    !!payment && payment.status !== "NOT_SUBMITTED" && payment.status !== "NO_PAYMENT";
  const appStatus = applicationStatusMap[status] || "Draft";
  const decisionDate = decision?.reviewedAt ? new Date(decision.reviewedAt).toLocaleDateString() : null;
  const submissionDate = submittedAt ? new Date(submittedAt).toLocaleDateString() : createdAt ? new Date(createdAt).toLocaleDateString() : "N/A";

  // ---------------------------------------------------------------------
  // Application timeline stages, derived from real stored state only.
  // Nothing is marked complete merely because the page is being viewed.
  // ---------------------------------------------------------------------
  const uploadedDocCount = (documents || []).filter((d) => d.uploaded).length;
  const totalDocCount = (documents || []).length;
  const requiredDocsMet = totalDocCount > 0 && uploadedDocCount >= totalDocCount;

  const DECIDED: string[] = ["APPROVED", "ACCEPTED", "REJECTED", "WAITLISTED", "CORRECTION_REQUESTED"];
  const SUBMITTED_STATES: string[] = ["SUBMITTED", "UNDER_REVIEW", "DOCUMENT_VERIFICATION", ...DECIDED];

const started = !!applicationId;
  const submitted = SUBMITTED_STATES.includes(status);
  const reviewActive = status === "UNDER_REVIEW" || status === "DOCUMENT_VERIFICATION";
  const decided = DECIDED.includes(status);

  type StageState = "done" | "current" | "pending";

  // First describe each stage purely as achieved / not-achieved from real
  // stored state. Progress is not strictly linear (an application can be
  // submitted while documents are still outstanding), so each stage is judged
  // on its own evidence rather than on the position of the previous one.
  const achieved: Record<string, boolean> = {
    registration: true,
    email: !!user.emailVerified,
    started,
    documents: requiredDocsMet,
    payment: paymentVerified,
    submitted,
    // Review is only "achieved" once a decision exists. While the Trust is
    // actively reviewing, Under Review is the current step and Decision stays
    // pending, so the stepper never claims a decision is imminent.
    review: decided,
    decision: decided,
  };

  const stageMeta: Array<{
    key: string;
    title: string;
    icon: typeof CircleCheck;
    hint: string;
  }> = [
    { key: "registration", title: "Registration", icon: UserRound, hint: "Account created" },
    {
      key: "email",
      title: "Email Verified",
      icon: MailCheck,
      hint: user.emailVerified ? "Email address confirmed" : "Confirm your email address",
    },
    {
      key: "started",
      title: "Application Started",
      icon: FilePenLine,
      hint: started ? "Draft application created" : "Begin your application",
    },
    {
      key: "documents",
      title: "Documents Uploaded",
      icon: FileUp,
      hint: started
        ? `${uploadedDocCount} of ${totalDocCount} uploaded`
        : "No documents uploaded yet",
    },
    {
      key: "payment",
      title: "Payment Completed",
      icon: Wallet,
      hint: paymentVerified
        ? "Payment verified by the Trust"
        : payment?.status === "PENDING_VERIFICATION"
          ? "Awaiting verification"
          : paymentSubmitted
            ? displayPaymentStatus
            : "Application fee not paid yet",
    },
    {
      key: "submitted",
      title: "Application Submitted",
      icon: Send,
      hint: submitted ? "Submitted for review" : "Not submitted yet",
    },
    {
      key: "review",
      title: "Under Review",
      icon: SearchCheck,
      hint: decided
        ? "Reviewed by the Trust"
        : reviewActive
          ? "Trust is reviewing your application"
          : "Begins after submission",
    },
    {
      key: "decision",
      title: "Decision",
      icon: decided ? BadgeCheck : CircleDashed,
      hint: decided ? appStatus : "Awaiting a decision",
    },
  ];

  // Exactly one stage is highlighted as current: the earliest stage that has
  // not been achieved yet. Everything before it is done, everything after is
  // pending. A fully decided application has no outstanding stage.
  const firstOutstanding = stageMeta.findIndex((s) => !achieved[s.key]);
  const timelineStages: Array<TimelineStage & { state: StageState }> = stageMeta.map(
    (stage, index) => ({
      ...stage,
      state: achieved[stage.key]
        ? "done"
        : index === firstOutstanding
          ? "current"
          : "pending",
    })
  );

  // For correction requested, show correction note
  let correctionNote = null;
  if (status === "CORRECTION_REQUESTED") {
    correctionNote = (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
        <p className="font-medium text-yellow-800">Correction Required</p>
        <p className="text-yellow-700 mt-1">Please review and edit the requested information below.</p>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-background">
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 bg-surface-muted">
        <div className="w-full max-w-5xl space-y-8">
          {/* Welcome section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-center mb-4">
              Welcome, {studentName}
            </h2>
            <p className="text-muted-foreground text-center">
              NEELAKANNU EDUCATIONAL TRUST Scholarship Portal
            </p>
          </div>

          {/* Application status card */}
          <div className="p-6 rounded-lg border border-border bg-card">
            <h3 className="text-xl font-medium mb-4">Application Status</h3>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-muted-foreground">
                  <strong>Application ID:</strong> {applicationId}
                </p>
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-semibold text-navy-800">
                  <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                  {appStatus}
                </span>
              </div>
              <p className="text-muted-foreground">
                <strong>Submission Date:</strong> {submissionDate}
              </p>
              {decisionDate && (
                <p className="text-muted-foreground">
                  <strong>Decision Date:</strong> {decisionDate}
                </p>
              )}
              {/* Applicant-entered scholarship amount. Separate from the ₹500
                  application fee shown in the Payment section below. */}
              {requestedScholarshipAmount !== null && (
                <p className="text-muted-foreground">
                  <strong>Scholarship Amount Requested:</strong>{" "}
                  <span className="font-semibold text-foreground">
                    ₹{requestedScholarshipAmount.toLocaleString("en-IN")}
                  </span>
                </p>
              )}
              {scholarshipProgramName && (
                <p className="text-muted-foreground">
                  <strong>Scholarship Program:</strong> {scholarshipProgramName}
                </p>
              )}
              {decision?.decisionMessage && (
                <div className="mt-2 rounded-lg border border-border bg-surface-muted p-3">
                  <p className="text-sm text-navy whitespace-pre-wrap dark:text-slate-300">
                    {decision.decisionMessage}
                  </p>
                </div>
              )}
              {decision?.rejectionReasons && decision.rejectionReasons.length > 0 && (
                <p className="text-muted-foreground">
                  <strong>Reasons:</strong> {decision.rejectionReasons.join(", ")}
                </p>
              )}
              {decision?.missingDocuments && decision.missingDocuments.length > 0 && (
                <p className="text-muted-foreground">
                  <strong>Missing documents:</strong> {decision.missingDocuments.join(", ")}
                </p>
              )}
            </div>
          </div>

          {/* Nine-step application process. Same order as the wizard, and every
              state comes from the stored record via evaluateApplicationProgress. */}
          <ApplicationProgressIndicator progress={progress} />

          {/* Payment card - deliberately separate from Application Status so a
              verified payment can never be read as an approved application. */}
          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="text-xl font-medium">Payment Information</h3>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                  paymentVerified
                    ? "bg-success/10 text-success"
                    : payment?.status === "REJECTED"
                      ? "bg-destructive/10 text-destructive"
                      : paymentSubmitted
                        ? "bg-gold-soft text-navy-800"
                        : "bg-surface-muted text-muted-foreground"
                }`}
              >
                {paymentVerified ? (
                  <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
                ) : paymentSubmitted ? (
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <CircleDashed className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {displayPaymentStatus}
              </span>
            </div>

            <div className="space-y-3">
              {paymentVerified && (
                <p className="text-muted-foreground">
                  Your payment has been verified by the Trust. This is separate from the
                  scholarship decision, which is shown under Application Status.
                </p>
              )}
              {payment?.status === "PENDING_VERIFICATION" && (
                <p className="text-muted-foreground">
                  Your payment details have been submitted. The Trust will verify the
                  payment before your application is reviewed.
                </p>
              )}
              {payment?.amount != null && (
                <p className="text-muted-foreground">
                  <strong>Application Fee Paid:</strong> ₹{Number(payment.amount).toLocaleString("en-IN")}
                </p>
              )}
              {payment?.txnId && (
                <p className="text-muted-foreground">
                  <strong>Transaction ID / UTR:</strong>{" "}
                  <span className="break-all font-mono">{payment.txnId}</span>
                </p>
              )}
              {payment?.screenshot && (
                <a
                  href={`${API_BASE_URL}/api/payments/application/${encodeURIComponent(applicationId)}/screenshot`}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                  className="text-primary underline underline-offset-2 hover:text-primary/90 inline-flex items-center gap-2 mt-1">
                  <Receipt className="h-4 w-4" aria-hidden="true" />
                  View payment screenshot
                </a>
              )}
              {payment?.verifiedAt && (
                <p className="text-muted-foreground">
                  <strong>Verified On:</strong> {new Date(payment.verifiedAt).toLocaleString()}
                </p>
              )}
              {payment?.status === "REJECTED" && (
                <p className="text-muted-foreground">
                  <strong>Reason:</strong>{" "}
                  {payment.verificationNote || "Payment verification was not approved. Please contact the trust office."}
                </p>
              )}
              {!paymentSubmitted && (
                <p className="text-muted-foreground">
                  The application fee has not been paid yet.
                </p>
              )}
            </div>
          </div>

          {/* Application timeline. One <ol> that switches between a vertical rail
              (small screens) and a horizontal rail (lg and up) so the eight
              stages exist exactly once in the DOM. Each stage is a flex item
              with a min-width, so labels never collapse into a narrow column. */}
          <div className="p-6 rounded-lg border border-border bg-card">
            <h3 className="text-xl font-medium mb-1">Application Timeline</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Track your application from registration through to the final decision.
            </p>

            <ol className="flex flex-col lg:flex-row lg:items-start">
              {timelineStages.map((stage, index) => {
                const StageIcon = stage.icon;
                const isLast = index === timelineStages.length - 1;
                return (
                  <li
                    key={stage.key}
                    className="flex gap-3 lg:min-w-0 lg:flex-1 lg:flex-col lg:items-center lg:gap-0"
                  >
                    {/* marker + connector */}
                    <div className="flex flex-col items-center lg:w-full lg:flex-row lg:items-center">
                      <StageCircle stage={stage} StageIcon={StageIcon} />
                      <StageRail done={stage.state === "done"} isLast={isLast} />
                    </div>
                    {/* label */}
                    <div
                      className={`min-w-0 flex-1 lg:mt-3 lg:w-full lg:flex-none ${
                        isLast ? "pb-0" : "pb-6"
                      } lg:text-center lg:pb-0`}
                    >
                      <StageText stage={stage} />
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Correction note if applicable */}
          {correctionNote}

          {/* Document status - driven entirely by the backend checklist, which keeps the
              same 13 document identifiers used by the upload form and the admin
              view. Missing stays Missing; nothing is invented here. */}
          {applicationId && (
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="text-xl font-medium">Documents</h3>
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-semibold text-navy-800">
                  <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                  {uploadedDocCount} of {totalDocCount} uploaded
                </span>
              </div>
              {documents && documents.length > 0 ? (
                <ul className="divide-y divide-border">
                  {documents.map((d) => (
                    <li
                      key={d.key}
                      className="flex items-center justify-between gap-3 py-2.5 text-sm"
                    >
                      <span className="text-navy dark:text-slate-200 min-w-0 break-words">
                        {d.label}
                      </span>
                      {d.uploaded ? (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                          <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                          <CircleDashed className="h-3.5 w-3.5" aria-hidden="true" />
                          Missing
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">
                  <Link
                    href="/student/application"
                    className="inline-flex items-center gap-2 text-primary underline underline-offset-2 hover:text-primary/90"
                  >
                    <FileUp className="h-4 w-4" aria-hidden="true" />
                    Upload Documents
                  </Link>
                </p>
              )}
            </div>
          )}

          {/* Action buttons based on status */}
          <div className="mt-4">

            {/* Edit window, as decided by the backend. While it is open the
                candidate gets an "Edit Application" action and a plain statement
                of what is left; once it closes the action disappears and the
                reason is shown instead. */}
            {applicationEditable && (
              <div>
                <Link
                  href="/student/application"
                  className="inline-block py-2 px-4 rounded bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                  Edit Application
                </Link>
                {editNotice && (
                  <p className="text-muted-foreground text-sm mt-2">{editNotice}</p>
                )}
              </div>
            )}
            {!applicationEditable && editNotice && (
              <p className="text-muted-foreground text-sm">{editNotice}</p>
            )}

            {/* "Continue Application" opens the next step that still needs
                attention instead of always restarting at step 1. Gated on the
                backend's editability so a locked or accepted application never
                offers an edit path, and hidden once the application is submitted:
                from that point the process is waiting on the Trust, not on the
                applicant, so there is no next step for them to continue to. The
                separate "Edit Application" link still lets them correct details
                inside the edit window. */}
            {applicationEditable && !progress.submitted && continueStep != null && (
              <div className={status === "DRAFT" ? "mt-4" : ""}>
                <Link
                  href={`/student/application?step=${continueStep}`}
                  className="inline-block py-2 px-4 rounded bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                  Continue Application
                </Link>
                <p className="text-muted-foreground text-sm mt-2">
                  Next: {progress.steps[continueStep].label}
                </p>
              </div>
            )}
            {status === "SUBMITTED" && (
              <p className="text-muted-foreground text-sm">
                Your application has been submitted. You will be notified of the decision.
              </p>
            )}
            {status === "UNDER_REVIEW" && (
              <p className="text-muted-foreground text-sm">
                Your application is under review. You will be notified of the decision.
              </p>
            )}
            {status === "APPROVED" && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                <p className="text-green-800 font-medium">Congratulations!</p>
                <p className="text-green-700 mt-1">Your application has been accepted for the scholarship!</p>
              </div>
            )}
            {status === "ACCEPTED" && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                <p className="text-green-800 font-medium">Congratulations!</p>
                <p className="text-green-700 mt-1">Your application has been accepted for the scholarship!</p>
              </div>
            )}
            {status === "REJECTED" && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                <p className="text-red-800 font-medium">Application Rejected</p>
                <p className="text-red-700 mt-1">
                  {decision?.decisionMessage
                    ? decision.decisionMessage
                    : "Your application was not accepted for this scholarship."}
                </p>
              </div>
            )}
            {status === "WAITLISTED" && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                <p className="text-orange-800 font-medium">Waitlisted</p>
                <p className="text-orange-700 mt-1">Your application is on the waitlist.</p>
              </div>
            )}
            {status === "CORRECTION_REQUESTED" && (
              <div>
                <p className="text-muted-foreground text-sm">
                  The administration has requested corrections to your application.
                </p>
                <Link
                  href="/student/application"
                  className="text-primary underline hover:text-primary/90 mt-2">
                    Edit and Resubmit
                  </Link>
              </div>
            )}

            {payment?.status === "REJECTED" &&
              status !== "APPROVED" &&
              status !== "ACCEPTED" &&
              status !== "REJECTED" &&
              status !== "WITHDRAWN" && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                <p className="text-red-800 font-medium">Fix Payment Details</p>
                <p className="text-red-700 mt-1 text-sm">
                  {payment.verificationNote
                    ? `Reason: ${payment.verificationNote} `
                    : ""}The payment details you provided were not approved. Please re-upload your payment screenshot and the correct transaction reference, then submit again.
                </p>
                <Link
                  href="/student/application"
                  className="text-primary underline hover:text-primary/90 mt-2 inline-block">
                  Re-upload screenshot & resubmit
                </Link>
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="mt-8 border-t pt-8 text-sm text-muted-foreground">
            <h3 className="text-xl font-medium mb-4">Quick Links</h3>
            <div className="grid grid-cols-2 gap-4">
              <a
                href="/scholarship"
                className="group py-2 flex items-center justify-center rounded-lg border border-border hover:bg-primary/5 transition-colors">
                <span className="group-hover text-primary">Scholarship Program</span>
              </a>
              <a href="/contact" className="group py-2 flex items-center justify-center rounded-lg border border-border hover:bg-primary/5 transition-colors">
                <span className="group-hover text-primary">Contact</span>
              </a>
              {/* Follows the edit window rather than a status list, so a closed window no
                  longer offers a "continue" link to a read-only form. */}
              {applicationEditable && (
                <a
                  href="/student/application"
                  className="group py-2 flex items-center justify-center rounded-lg border border-border hover:bg-primary/5 transition-colors">
                  <span className="group-hover text-primary">Edit Application</span>
                </a>
              )}
              {(status === "SUBMITTED" || status === "APPROVED" || status === "ACCEPTED") && (
                <Link href="/" className="group py-2 flex items-center justify-center rounded-lg border border-border hover:bg-primary/5 transition-colors">
                  <span className="group-hover text-primary">Home</span>
                </Link>
              )}
            </div>
          </div>

          {/* Logout */}
          <div className="mt-6">
            <button
              onClick={() => fetch(`${API_BASE_URL}/api/auth/logout`, { method: "POST", credentials: "include" })}
              className="w-full py-3 px-6 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
