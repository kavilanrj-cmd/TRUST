"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import { useAuth, AuthUser } from "@/lib/auth";
import { RequireAuth } from "@/components/auth/RequireAuth";

function StudentDashboardInner() {
  const { user } = useAuth();
  const [application, setApplication] = useState<{
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
  } | null>(null);
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
      <section className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
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

function renderDashboard(
  user: AuthUser,
  application: {
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
  } | null
) {
  if (!application) {
    return (
      <section className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <p className="text-lg text-muted-foreground">
          <Link href="/student/application" className="text-primary underline underline-offset-2 hover:text-primary/90">
            Start your application
          </Link>{" "}
          to view your dashboard.
        </p>
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

  const scholarshipName = scholarshipProgram?.name || "Select a scholarship";
  const studentName = user.name || user.email.split("@")[0];

  const paymentStatusMap: Record<string, string> = {
    PENDING: "Pending",
    PENDING_VERIFICATION: "Awaiting Verification",
    SUCCESS: "Verified",
    VERIFIED: "Verified",
    FAILED: "Failed",
    REFUNDED: "Refunded",
    REJECTED: "Rejected",
    NO_PAYMENT: "Not Paid",
  };

  const applicationStatusMap: Record<string, string> = {
    DRAFT: "Draft",
    SUBMITTED: "Submitted",
    UNDER_REVIEW: "Under Review",
    APPROVED: "Accepted",
    REJECTED: "Rejected",
    WAITLISTED: "Waitlisted",
    CORRECTION_REQUESTED: "Correction Requested",
  };

  const effectivePaymentStatus = payment?.status || paymentStatus || "NO_PAYMENT";
  const displayPaymentStatus = paymentStatusMap[effectivePaymentStatus] || "Pending";
  const paymentVerified = payment?.status === "VERIFIED" || payment?.status === "SUCCESS";
  const appStatus = applicationStatusMap[status] || "Draft";
  const decisionDate = decision?.reviewedAt ? new Date(decision.reviewedAt).toLocaleDateString() : null;
  const submissionDate = submittedAt ? new Date(submittedAt).toLocaleDateString() : createdAt ? new Date(createdAt).toLocaleDateString() : "N/A";

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
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 bg-gray-50">
        <div className="w-full max-w-2xl space-y-8">
          {/* Welcome section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-center mb-4">
              Welcome, {studentName}
            </h2>
            <p className="text-muted-foreground text-center">
              Neelakannu Educational Trust Scholarship Portal
            </p>
          </div>

          {/* Application status card */}
          <div className="p-6 rounded-lg border border-gray-200 bg-white">
            <h3 className="text-xl font-medium mb-4">Application Status</h3>

            <div className="space-y-4">
              <p className="text-muted-foreground">
                <strong>Application ID:</strong> {applicationId}
              </p>
              <p className="text-muted-foreground">
                <strong>Status:</strong> {appStatus}
              </p>
              <p className="text-muted-foreground">
                <strong>Payment Status:</strong> {displayPaymentStatus}
              </p>
              {payment?.txnId && (
                <p className="text-muted-foreground">
                  <strong>UPI Transaction Ref:</strong> {payment.txnId}
                </p>
              )}
              {payment?.verifiedAt && (
                <p className="text-muted-foreground">
                  <strong>Verified On:</strong> {new Date(payment.verifiedAt).toLocaleDateString()}
                </p>
              )}
              {payment?.status === "REJECTED" && (
                <p className="text-muted-foreground">
                  <strong>Rejection Note:</strong>{" "}
                  {payment.verificationNote || "Payment verification was not approved. Please contact the trust office."}
                </p>
              )}
              <p className="text-muted-foreground">
                <strong>Submission Date:</strong> {submissionDate}
              </p>
              {decisionDate && (
                <p className="text-muted-foreground">
                  <strong>Decision Date:</strong> {decisionDate}
                </p>
              )}
              <p className="text-muted-foreground">
                <strong>Scholarship:</strong> {scholarshipName}
              </p>
              {decision?.decisionMessage && (
                <div className="mt-2 rounded-lg border border-border bg-gray-50 p-3">
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

          {/* Application timeline */}
          <div>
            <h3 className="text-xl font-medium mb-4">Application Timeline</h3>
            <nav className="mb-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>1 Registration</span>
                <span>2 Email Verified</span>
                <span>3 Application Started</span>
                <span>4 Documents Uploaded</span>
                <span>5 Payment Completed</span>
                <span>6 Application Submitted</span>
                <span>7 Under Review</span>
                <span>8 Decision</span>
              </div>

              {[
                { label: "Registration", passed: true, current: false },
                { label: "Email Verified", passed: user.emailVerified ? true : false, current: false },
                { label: "Application Started", passed: applicationId ? true : false, current: false },
                {
                  label: "Documents Uploaded",
                  passed:
                    application?.status !== "DRAFT" &&
                    application?.status !== "SUBMITTED"
                    ? true
                    : false,
                  current: false,
                },
                {
                  label: "Payment Completed",
                  passed: paymentVerified,
                  current: !paymentVerified && payment?.status === "PENDING_VERIFICATION",
                },
                {
                  label: "Application Submitted",
                  passed:
                    status === "SUBMITTED" ||
                    status === "APPROVED" ||
                    status === "REJECTED" ||
                    status === "WAITLISTED" ||
                    status === "CORRECTION_REQUESTED",
                  current:
                    status !== "SUBMITTED" &&
                    status !== "APPROVED" &&
                    status !== "REJECTED" &&
                    status !== "WAITLISTED" &&
                    status !== "CORRECTION_REQUESTED",
                },
                {
                  label: "Under Review",
                  passed:
                    status === "UNDER_REVIEW" ||
                    status === "APPROVED" ||
                    status === "REJECTED" ||
                    status === "WAITLISTED" ||
                    status === "CORRECTION_REQUESTED",
                  current: status === "UNDER_REVIEW",
                },
                {
                  label: "Decision",
                  passed:
                    status === "APPROVED" ||
                    status === "REJECTED" ||
                    status === "WAITLISTED" ||
                    status === "CORRECTION_REQUESTED",
                  current: status !== "APPROVED" &&
                    status !== "REJECTED" &&
                    status !== "WAITLISTED" &&
                    status !== "CORRECTION_REQUESTED",
                },
              ].map((step, index) => {
                const isCurrent = step.current;
                const isPassed = step.passed;
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-2 ${
                      isCurrent
                        ? "text-primary"
                        : isPassed
                          ? "text-success"
                          : "text-muted-foreground"
                    } ${isCurrent ? "font-medium" : ""}`}>
                    <span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 ${
                          isCurrent ? "text-primary" : isPassed ? "text-success" : "currentColor"
                        }`}
                        viewBox="0 0 24 24"
                        fill={isCurrent ? "currentColor" : "none"}
                        stroke={isCurrent ? "currentColor" : "none"}
                      >
                        <path
                          className={isCurrent ? "stroke-primary" : isPassed ? "stroke-success" : "stroke-current"}
                          d="M17.657 16.657a8 8 0 0 1-1.06-1.06l-4.244 4.243-4.244-4.243a8 8 0 1 1 1.06-1.06l5.33 5.331 5.33-5.331z"
                        />
                        <path
                          className={isCurrent ? "stroke-primary" : isPassed ? "stroke-success" : "stroke-current"}
                          d="M21 8.25c0-2.485-2.099-4.5-5.25-4.5-1.401 0-2.726.163-3.979.45L12 4.268l-.33-.32-.33.32c-1.253.787-2.578 1.05-3.98.45C-2.099 4.5 0 6.515 0 8.25s2.099 3.75 5.25 3.75 5.25-1.265 5.25-3.75z"
                        />
                      </svg>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Correction note if applicable */}
          {correctionNote}

          {/* Document status */}
          {applicationId && (
            <div className="p-6 rounded-lg border border-gray-200 bg-white">
              <h3 className="text-xl font-medium mb-4">Documents</h3>
              {documents && documents.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {documents.map((d) => (
                    <li key={d.key} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-gray-700">{d.label}</span>
                      <span className={d.uploaded ? "font-medium text-green-600" : "font-medium text-red-600"}>
                        {d.uploaded ? "✓ Uploaded" : "Missing"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">
                  {status === "SUBMITTED" || status === "APPROVED" ? (
                    "Documents have been uploaded and verified"
                  ) : (
                    <a
                      href="/student/application"
                      className="underline text-primary hover:text-primary/90"
                    >
                      Upload Documents
                    </a>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Action buttons based on status */}
          <div className="mt-4">
            {status === "DRAFT" && (
              <Link
                href="/student/application"
                className="inline-block py-2 px-4 rounded bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                Continue Application
              </Link>
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
          </div>

          {/* Quick links */}
          <div className="mt-8 border-t pt-8 text-sm text-muted-foreground">
            <h3 className="text-xl font-medium mb-4">Quick Links</h3>
            <div className="grid grid-cols-2 gap-4">
              <a
                href="/scholarship"
                className="group py-2 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-primary/5 transition-colors">
                <span className="group-hover text-primary">Scholarship Program</span>
              </a>
              <a href="/contact" className="group py-2 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-primary/5 transition-colors">
                <span className="group-hover text-primary">Contact</span>
              </a>
              {status !== "SUBMITTED" && (
                <a
                  href="/student/application"
                  className="group py-2 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-primary/5 transition-colors">
                  <span className="group-hover text-primary">Continue Application</span>
                </a>
              )}
              {status === "SUBMITTED" && (
                <Link href="/" className="group py-2 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-primary/5 transition-colors">
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
