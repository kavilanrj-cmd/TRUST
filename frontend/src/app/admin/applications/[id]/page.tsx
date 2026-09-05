"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, Badge, Button, Spinner, ErrorState, Field } from "@/components/admin/ui";
import { adminApi, statusColor, fmtDate, fmtDateTime } from "@/lib/admin-api";

const VALID_STATUSES = [
  "DRAFT", "SUBMITTED", "UNDER_REVIEW", "DOCUMENT_VERIFICATION",
  "APPROVED", "REJECTED", "WAITLISTED", "WITHDRAWN", "CORRECTION_REQUESTED",
];

const TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SUBMITTED", "WITHDRAWN"],
  SUBMITTED: ["UNDER_REVIEW", "REJECTED", "WITHDRAWN", "CORRECTION_REQUESTED"],
  UNDER_REVIEW: ["DOCUMENT_VERIFICATION", "APPROVED", "REJECTED", "WAITLISTED", "CORRECTION_REQUESTED", "WITHDRAWN"],
  DOCUMENT_VERIFICATION: ["APPROVED", "REJECTED", "WAITLISTED", "CORRECTION_REQUESTED", "UNDER_REVIEW", "WITHDRAWN"],
  APPROVED: ["REJECTED", "WITHDRAWN"],
  REJECTED: ["UNDER_REVIEW", "APPROVED", "WITHDRAWN"],
  WAITLISTED: ["APPROVED", "REJECTED", "WITHDRAWN"],
  WITHDRAWN: [],
  CORRECTION_REQUESTED: ["SUBMITTED", "UNDER_REVIEW", "DRAFT", "WITHDRAWN"],
};

const DOC_STATUSES = ["VERIFIED", "REJECTED", "RE_UPLOAD_REQUESTED", "PENDING"];

// The exact 13 required scholarship documents (order preserved from the app form).
const REQUIRED_DOCUMENTS = [
  { key: "sslc", label: "SSLC" },
  { key: "hsc", label: "HSC" },
  { key: "currentSemesterResult", label: "Current Semester Result" },
  { key: "bonafide", label: "Bonafide Certificate" },
  { key: "idCard", label: "ID Card" },
  { key: "community", label: "Community Certificate" },
  { key: "income", label: "Income Certificate" },
  { key: "pan", label: "PAN" },
  { key: "aadhar", label: "Aadhar" },
  { key: "bankPassbook", label: "Bank Passbook (Student Account)" },
  { key: "disability", label: "Disability Certificate" },
  { key: "sports", label: "Sports Certificate" },
  { key: "deathCertificate", label: "Death Certificate of Parent" },
];

// Rejection reason options shown in the reject dialog.
const REJECTION_REASONS = [
  "Incomplete application",
  "Missing required documents",
  "Payment not completed",
  "Not eligible for scholarship",
  "Incorrect details provided",
];

// "No Parents" family status is derived from the saved parent2 fields (no separate DB column).
function isNoParentsApp(a: any): boolean {
  return !!a?.parentGuardian?.parent2Name && !a?.parentGuardian?.isSingleParent;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy dark:text-white">{title}</h3>
      <div className="rounded-lg border border-border bg-gray-50 p-4 dark:border-white/15 dark:bg-[#131a2e]">{children}</div>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-1.5 sm:flex-row sm:items-center sm:gap-4">
      <span className="min-w-[160px] text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-navy dark:text-white">{value || "—"}</span>
    </div>
  );
}

export default function ApplicationDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [app, setApp] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const [noteContent, setNoteContent] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);

  const [docVerify, setDocVerify] = useState<Record<string, string>>({});
  const [docNote, setDocNote] = useState<Record<string, string>>({});
  const [verifyLoading, setVerifyLoading] = useState<Record<string, boolean>>({});

  // Decision dialog state
  const [decisionDialog, setDecisionDialog] = useState<"" | "ACCEPT" | "REJECT">("");
  const [decisionMsg, setDecisionMsg] = useState("");
  const [selectedReasons, setSelectedReasons] = useState<Set<string>>(new Set());
  const [selectedMissing, setSelectedMissing] = useState<Set<string>>(new Set());
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [decisionError, setDecisionError] = useState("");

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.applications.detail(id);
      setApp(data.application);
      setActivities(data.activities || []);
    } catch (e: any) {
      setError(e.message || "Failed to load application");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleStatusChange = async () => {
    if (!newStatus) return;
    const requiresNote = ["REJECTED", "CORRECTION_REQUESTED", "WITHDRAWN"].includes(newStatus);
    if (requiresNote && !statusNote.trim()) {
      setStatusMsg("A note is required for this status change.");
      return;
    }
    setStatusLoading(true);
    setStatusMsg("");
    try {
      await adminApi.applications.changeStatus(id, {
        status: newStatus,
        note: requiresNote ? statusNote.trim() : undefined,
      });
      setStatusMsg("Status updated successfully.");
      setNewStatus("");
      setStatusNote("");
      fetchDetail();
    } catch (e: any) {
      setStatusMsg(e.message || "Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  const openAcceptDialog = () => {
    setDecisionDialog("ACCEPT");
    setDecisionMsg(
      `Congratulations! Your application (${app.applicationId}) has been accepted. Welcome to the Neelakannu Educational Trust scholarship programme.`
    );
    setSelectedReasons(new Set());
    setSelectedMissing(new Set());
    setDecisionError("");
  };

  const openRejectDialog = () => {
    const docs = app.applicationDocuments || [];
    const uploaded = new Set(docs.map((d: any) => d.documentType).filter(Boolean));
    const applicableDocs = isNoParentsApp(app) ? REQUIRED_DOCUMENTS.filter((d) => d.key !== "income") : REQUIRED_DOCUMENTS;
    const missing = applicableDocs.filter((d) => !uploaded.has(d.key)).map((d) => d.label);
    const reasons = new Set<string>();
    if (missing.length > 0) reasons.add("Missing required documents");
    const paymentDone = (app.payments || []).some((p: any) => p.status === "SUCCESS");
    if (!paymentDone) reasons.add("Payment not completed");

    setDecisionDialog("REJECT");
    setSelectedMissing(new Set(missing));
    setSelectedReasons(reasons);
    const msg =
      `Thank you for applying to the Neelakannu Educational Trust scholarship. ` +
      (reasons.size > 0
        ? `Unfortunately, your application could not be accepted for the following reason(s): ${Array.from(reasons).join(", ")}.`
        : `Unfortunately, we are unable to consider your application at this time.`) +
      `\n\nFor queries, please contact the trust office.`;
    setDecisionMsg(msg);
    setDecisionError("");
  };

  const closeDecisionDialog = () => {
    if (decisionLoading) return;
    setDecisionDialog("");
    setDecisionMsg("");
    setSelectedReasons(new Set());
    setSelectedMissing(new Set());
    setDecisionError("");
  };

  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) => {
      const next = new Set(prev);
      if (next.has(reason)) next.delete(reason);
      else next.add(reason);
      return next;
    });
  };

  const toggleMissing = (docKey: string) => {
    setSelectedMissing((prev) => {
      const next = new Set(prev);
      if (next.has(docKey)) next.delete(docKey);
      else next.add(docKey);
      return next;
    });
  };

  const submitDecision = async () => {
    if (decisionLoading) return;
    if (decisionDialog === "REJECT" && selectedReasons.size === 0) {
      setDecisionError("Select at least one reason for rejection.");
      return;
    }
    setDecisionLoading(true);
    setDecisionError("");
    try {
      if (decisionDialog === "ACCEPT") {
        await adminApi.applications.changeStatus(id, {
          status: "APPROVED",
          message: decisionMsg.trim() || undefined,
        });
      } else {
        const missingLabels = (isNoParentsApp(app) ? REQUIRED_DOCUMENTS.filter((d) => d.key !== "income") : REQUIRED_DOCUMENTS)
        .filter((d) => selectedMissing.has(d.label))
        .map((d) => d.label);
        await adminApi.applications.changeStatus(id, {
          status: "REJECTED",
          message: decisionMsg.trim() || undefined,
          missingDocuments: missingLabels,
          rejectionReasons: Array.from(selectedReasons),
        });
      }
      closeDecisionDialog();
      setStatusNote("");
      fetchDetail();
    } catch (e: any) {
      setDecisionError(e.message || "Failed to save decision");
    } finally {
      setDecisionLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setNoteLoading(true);
    try {
      await adminApi.applications.addNote(id, { content: noteContent.trim() });
      setNoteContent("");
      fetchDetail();
    } catch (e: any) {
      alert(e.message || "Failed to add note");
    } finally {
      setNoteLoading(false);
    }
  };

  const handleVerifyDocument = async (docId: string) => {
    const statusVal = docVerify[docId];
    if (!statusVal) return;
    const requiresNote = ["REJECTED", "RE_UPLOAD_REQUESTED"].includes(statusVal);
    if (requiresNote && !docNote[docId]?.trim()) {
      alert("A reason is required for this action.");
      return;
    }
    setVerifyLoading((prev) => ({ ...prev, [docId]: true }));
    try {
      await adminApi.applications.verifyDocument(docId, {
        verificationStatus: statusVal,
        reason: requiresNote ? docNote[docId]?.trim() : undefined,
      });
      setDocVerify((prev) => ({ ...prev, [docId]: "" }));
      setDocNote((prev) => ({ ...prev, [docId]: "" }));
      fetchDetail();
    } catch (e: any) {
      alert(e.message || "Failed to verify document");
    } finally {
      setVerifyLoading((prev) => ({ ...prev, [docId]: false }));
    }
  };

  const handleDownload = async (docId: string) => {
    const url = adminApi.applications.documentAccess(docId);
    try {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    } catch (e: any) {
      alert(e.message || "Failed to download document");
    }
  };

  const allowedTransitions = app ? (TRANSITIONS[app.status] || []) : [];

  if (error) return <AdminLayout><ErrorState message={error} /></AdminLayout>;
  if (loading || !app) return <AdminLayout><Spinner label="Loading application..." /></AdminLayout>;

  const isNoParents = isNoParentsApp(app);
  const pd = app.personalDetails;
  const addr = app.address;
  const pg = app.parentGuardian;
  const acad = app.academicDetails;
  const fin = app.financialDetails;
  const docs = app.applicationDocuments || [];
  const notes = app.notes || [];
  const payments = app.payments || [];

  const uploadedDocKeys = new Set(docs.map((d: any) => d.documentType).filter(Boolean));
  const requiredChecklist = (isNoParents ? REQUIRED_DOCUMENTS.filter((d) => d.key !== "income") : REQUIRED_DOCUMENTS).map((d) => ({
    ...d,
    uploaded: uploadedDocKeys.has(d.key),
  }));

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-navy dark:text-white">
          Application {app.applicationId}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Submitted {fmtDate(app.submittedAt || app.createdAt)}
        </p>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <Badge className={statusColor(app.status)}>{app.status.replace(/_/g, " ")}</Badge>
        <span className="text-sm text-muted-foreground">
          {app.scholarshipProgram?.name || "—"}
        </span>
      </div>

      {app.reviewedAt && (
        <Section title="Decision Record">
          <FieldRow label="Decision Date" value={fmtDateTime(app.reviewedAt)} />
          <FieldRow label="Reviewed By" value={app.reviewedByName || "—"} />
          {app.decisionMessage && (
            <div className="mt-2 rounded-lg border border-border bg-background p-3 text-sm text-navy dark:bg-[#0f1526] dark:text-slate-300">
              <p className="whitespace-pre-wrap">{app.decisionMessage}</p>
            </div>
          )}
          {app.rejectionReasons && app.rejectionReasons.length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              <strong>Reasons:</strong> {app.rejectionReasons.join(", ")}
            </p>
          )}
          {app.missingDocuments && app.missingDocuments.length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              <strong>Missing documents:</strong> {app.missingDocuments.join(", ")}
            </p>
          )}
        </Section>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <Section title="Personal Details">
            <FieldRow label="Full Name" value={pd?.fullName} />
            <FieldRow label="Email" value={app.student?.email} />
            <FieldRow label="Phone" value={pd?.phone} />
            <FieldRow label="Date of Birth" value={fmtDate(pd?.dateOfBirth)} />
            <FieldRow label="Gender" value={pd?.gender} />
            <FieldRow label="Name (Bank Record)" value={pd?.bankRecordName} />
            <FieldRow label="ID Proof Number" value={pd?.idProofNumber} />
          </Section>

          <Section title="Address">
            <FieldRow label="Door Number" value={addr?.doorNumber} />
            <FieldRow label="Street" value={addr?.street} />
            <FieldRow label="City" value={addr?.city} />
            <FieldRow label="District" value={addr?.district} />
            <FieldRow label="State" value={addr?.state} />
            <FieldRow label="PIN Code" value={addr?.pinCode} />
          </Section>

          <Section title="Parent / Guardian">
            {isNoParents ? (
              <>
                <FieldRow label="Family Status" value="No Parents" />
                <FieldRow label="Parent 1 Name" value={pg?.guardianName} />
                <FieldRow label="Parent 1 Relationship" value={pg?.relationship} />
                <FieldRow label="Parent 1 Phone" value={pg?.contactNumber} />
                <FieldRow label="Parent 1 Occupation" value={pg?.occupation} />
                <FieldRow label="Parent 2 Name" value={pg?.parent2Name} />
                <FieldRow label="Parent 2 Relationship" value={pg?.parent2Relationship} />
              </>
            ) : (
              <>
                <FieldRow label="Name" value={pg?.guardianName} />
                <FieldRow label="Relationship" value={pg?.relationship} />
                <FieldRow label="Phone" value={pg?.contactNumber} />
                <FieldRow label="Occupation" value={pg?.occupation} />
                <FieldRow label="Single Parent" value={pg?.isSingleParent ? "Yes" : "No"} />
                {pg?.isSingleParent && <FieldRow label="Single Parent Type" value={pg?.singleParentType} />}
                <FieldRow label="Income" value={pg?.income != null ? `₹${pg.income.toLocaleString()}` : undefined} />
              </>
            )}
          </Section>

          <Section title="Academic Details">
            <FieldRow label="Academic Type" value={acad?.academicType} />
            <FieldRow label="School / College" value={acad?.schoolCollege} />
            <FieldRow label="Course" value={acad?.course} />
            <FieldRow label="Education Level" value={acad?.educationLevel?.replace(/_/g, " ")} />
            <FieldRow label="Academic Year" value={acad?.academicYear} />
            <FieldRow label="Class" value={acad?.className} />
            <FieldRow label="Section" value={acad?.section} />
            <FieldRow label="Semester" value={acad?.semester} />
            <FieldRow label="UG / PG" value={acad?.ugPg} />
            <FieldRow label="Year of Study" value={acad?.yearOfStudy} />
            <FieldRow label="Marks / CGPA" value={acad?.marksPercentageCGPA} />
          </Section>

          {!isNoParents && (
            <Section title="Financial Details">
              <FieldRow label="Family Annual Income" value={fin?.familyIncome != null ? `₹${fin.familyIncome.toLocaleString()}` : undefined} />
              <FieldRow label="Income Source" value={fin?.incomeSource} />
            </Section>
          )}

          <Section title="Application Metrics">
            <FieldRow label="Application ID" value={app.applicationId} />
            <FieldRow label="Created" value={fmtDateTime(app.createdAt)} />
            <FieldRow label="Submitted" value={fmtDateTime(app.submittedAt)} />
            <FieldRow label="Updated" value={fmtDateTime(app.updatedAt)} />
            <FieldRow label="Documents Count" value={app._count?.applicationDocuments} />
          </Section>

          {payments.length > 0 && (
            <Section title="Payments">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="pb-2 pr-4 font-semibold">Amount</th>
                      <th className="pb-2 pr-4 font-semibold">Status</th>
                      <th className="pb-2 pr-4 font-semibold">Payment ID</th>
                      <th className="pb-2 pr-4 font-semibold">Order ID</th>
                      <th className="pb-2 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p: any) => (
                      <tr key={p.id} className="border-b border-border last:border-0">
                        <td className="py-2 pr-4">₹{p.amount?.toLocaleString()}</td>
                        <td className="py-2 pr-4"><Badge className={statusColor(p.status)}>{p.status}</Badge></td>
                        <td className="py-2 pr-4 font-mono text-xs">{p.razorpayPaymentId || "—"}</td>
                        <td className="py-2 pr-4 font-mono text-xs">{p.razorpayOrderId || "—"}</td>
                        <td className="py-2">{fmtDate(p.paymentDate || p.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          <Section title="Document Checkpoint">
            <ul className="divide-y divide-border">
              {requiredChecklist.map((d) => (
                <li key={d.key} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-navy dark:text-white">{d.label}</span>
                  {d.uploaded ? (
                    <Badge className="bg-green-50 text-green-700">Uploaded</Badge>
                  ) : (
                    <Badge className="bg-red-50 text-red-600">Missing</Badge>
                  )}
                </li>
              ))}
            </ul>
          </Section>

          {docs.length > 0 && (
            <Section title="Documents">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="pb-2 pr-4 font-semibold">Name</th>
                      <th className="pb-2 pr-4 font-semibold">Type</th>
                      <th className="pb-2 pr-4 font-semibold">Verification</th>
                      <th className="pb-2 pr-4 font-semibold">Download</th>
                      <th className="pb-2 font-semibold">Verify</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map((doc: any) => (
                      <tr key={doc.id} className="border-b border-border last:border-0">
                        <td className="py-2.5 pr-4 font-medium text-navy dark:text-white">{doc.originalFilename || doc.name}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{doc.fileType || "—"}</td>
                        <td className="py-2.5 pr-4">
                          <Badge className={statusColor(doc.verificationStatus || "PENDING")}>
                            {(doc.verificationStatus || "PENDING").replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="py-2.5 pr-4">
                          <button
                            className="text-xs font-semibold text-navy hover:underline dark:text-gold"
                            onClick={() => handleDownload(doc.id)}
                          >
                            Download
                          </button>
                        </td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-1">
                            <select
                              className="field-input text-xs"
                              value={docVerify[doc.id] || ""}
                              onChange={(e) => setDocVerify((prev) => ({ ...prev, [doc.id]: e.target.value }))}
                            >
                              <option value="">Select...</option>
                              {DOC_STATUSES.map((s) => (
                                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                              ))}
                            </select>
                            {["REJECTED", "RE_UPLOAD_REQUESTED"].includes(docVerify[doc.id] || "") && (
                              <input
                                type="text"
                                className="field-input text-xs"
                                placeholder="Reason..."
                                value={docNote[doc.id] || ""}
                                onChange={(e) => setDocNote((prev) => ({ ...prev, [doc.id]: e.target.value }))}
                              />
                            )}
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={!docVerify[doc.id] || verifyLoading[doc.id]}
                              onClick={() => handleVerifyDocument(doc.id)}
                            >
                              {verifyLoading[doc.id] ? "..." : "Go"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Application Decision">
            <p className="mb-4 text-sm text-muted-foreground">
              Record a formal accept or reject decision. The applicant is shown your decision with any reasons or missing documents.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!allowedTransitions.includes("APPROVED")}
                onClick={openAcceptDialog}
                className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Accept
              </button>
              <button
                type="button"
                disabled={!allowedTransitions.includes("REJECTED")}
                onClick={openRejectDialog}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Reject
              </button>
            </div>
          </Card>

          <Card title="Change Status">
            {allowedTransitions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No status transitions available from {app.status}.</p>
            ) : (
              <div className="space-y-3">
                <label className="block">
                  <span className="field-label">New Status</span>
                  <select
                    className="field-input"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="">Select status...</option>
                    {allowedTransitions.map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </label>

                {["REJECTED", "CORRECTION_REQUESTED", "WITHDRAWN"].includes(newStatus) && (
                  <Field label="Note (required)" hint="Provide a reason for this status change">
                    <textarea
                      className="field-input"
                      rows={3}
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                    />
                  </Field>
                )}

                {statusMsg && (
                  <p className={`text-xs ${statusMsg.includes("success") ? "text-green-600" : "text-red-600"}`}>
                    {statusMsg}
                  </p>
                )}

                <Button
                  variant="gold"
                  disabled={!newStatus || statusLoading}
                  onClick={handleStatusChange}
                >
                  {statusLoading ? "Updating..." : "Update Status"}
                </Button>
              </div>
            )}
          </Card>

          <Card title={`Notes (${notes.length})`}>
            <form onSubmit={handleAddNote} className="mb-4 space-y-2">
              <textarea
                className="field-input"
                rows={3}
                placeholder="Add a note..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
              />
              <Button type="submit" size="sm" disabled={!noteContent.trim() || noteLoading}>
                {noteLoading ? "Adding..." : "Add Note"}
              </Button>
            </form>

            {notes.length === 0 && (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            )}

            <div className="space-y-3">
              {notes.map((n: any) => (
                <div key={n.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm text-navy whitespace-pre-wrap dark:text-slate-300">{n.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {n.author?.name || "Staff"} &middot; {fmtDateTime(n.createdAt)}
                    {n.isInternal && <span className="ml-2 rounded bg-navy/10 px-1.5 py-0.5 text-[10px] font-semibold text-navy dark:text-gold">Internal</span>}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {activities.length > 0 && (
            <Card title="Activity Timeline">
              <div className="space-y-3">
                {activities.map((act: any) => (
                  <div key={act.id} className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" />
                    <div>
                      <p className="text-sm text-navy dark:text-white">
                        <span className="font-medium">{act.actorName || "Staff"}</span>{" "}
                        <span className="text-muted-foreground">{act.action?.replace(/_/g, " ")}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{fmtDateTime(act.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {decisionDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-[#0f1526]">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-navy dark:text-white">
                  {decisionDialog === "ACCEPT" ? "Accept Application" : "Reject Application"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {app.applicationId} &middot; {app.student?.email || app.personalDetails?.fullName}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDecisionDialog}
                className="text-muted-foreground hover:text-navy dark:hover:text-white"
                aria-label="Close"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {decisionDialog === "REJECT" && (
              <div className="mb-4 space-y-4">
                <div>
                  <p className="mb-1 text-sm font-semibold text-navy dark:text-white">Missing Documents</p>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Select which of the required documents the applicant has not uploaded.
                  </p>
                  <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto">
                    {requiredChecklist.map((d) => (
                      <label key={d.key} className="flex items-center gap-2 text-sm text-navy dark:text-white">
                        <input
                          type="checkbox"
                          checked={selectedMissing.has(d.label)}
                          onChange={() => d.uploaded && toggleMissing(d.label)}
                          disabled={d.uploaded}
                        />
                        <span className={d.uploaded ? "text-muted-foreground line-through" : ""}>{d.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-sm font-semibold text-navy dark:text-white">Reasons for Rejection</p>
                  <p className="mb-2 text-xs text-muted-foreground">Select one or more reasons.</p>
                  <div className="space-y-2">
                    {REJECTION_REASONS.map((r) => (
                      <label key={r} className="flex items-center gap-2 text-sm text-navy dark:text-white">
                        <input
                          type="checkbox"
                          checked={selectedReasons.has(r)}
                          onChange={() => toggleReason(r)}
                        />
                        {r}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="mb-1 block text-sm font-semibold text-navy dark:text-white">
                Message to Applicant
              </label>
              <textarea
                className="field-input"
                rows={5}
                value={decisionMsg}
                onChange={(e) => setDecisionMsg(e.target.value)}
              />
            </div>

            {decisionError && <p className="mb-3 text-xs text-red-600">{decisionError}</p>}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDecisionDialog}
                disabled={decisionLoading}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitDecision}
                disabled={decisionLoading}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                  decisionDialog === "ACCEPT" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {decisionLoading ? "Saving..." : decisionDialog === "ACCEPT" ? "Accept Application" : "Reject Application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
