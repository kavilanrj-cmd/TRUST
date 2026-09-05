"use client";

import React, { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, Badge, Button, Spinner, ErrorState, EmptyState } from "@/components/admin/ui";
import { adminApi, fmtDateTime } from "@/lib/admin-api";

const PAYMENT_STATUSES = ["NOT_SUBMITTED", "SUCCESS", "VERIFIED", "PENDING", "PENDING_VERIFICATION", "REJECTED", "FAILED", "REFUNDED"];

function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    SUCCESS: "bg-green-100 text-green-700",
    VERIFIED: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-700",
    PENDING: "bg-amber-100 text-amber-700",
    PENDING_VERIFICATION: "bg-amber-100 text-amber-700",
    REJECTED: "bg-red-100 text-red-700",
    REFUNDED: "bg-gray-100 text-gray-600",
    NOT_SUBMITTED: "bg-gray-100 text-gray-600",
    NO_PAYMENT: "bg-gray-100 text-gray-600",
  };
  const labelMap: Record<string, string> = {
    PENDING_VERIFICATION: "Awaiting Verification",
    VERIFIED: "Verified",
    REJECTED: "Rejected",
    SUCCESS: "Success",
    FAILED: "Failed",
    PENDING: "Pending",
    REFUNDED: "Refunded",
    NOT_SUBMITTED: "Not Yet Submitted",
  };
  return <Badge className={map[status] || "bg-gray-100 text-gray-600"}>{labelMap[status] || status.replace(/_/g, " ")}</Badge>;
}

function PaymentsPage() {
  const searchParams = useSearchParams();
  const [payments, setPayments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [from, setFrom] = useState(searchParams.get("from") || "");
  const [to, setTo] = useState(searchParams.get("to") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.payments.list({
        status: status || undefined,
        search: search || undefined,
        from: from || undefined,
        to: to || undefined,
        page: String(page),
        limit: "15",
      });
      setPayments(data.payments || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (e: any) {
      setError(e.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [status, search, from, to, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPayments();
  }, [fetchPayments]);

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPayments();
  };

  const handleVerify = async (id: string) => {
    if (!window.confirm("Verify this payment? The application's payment status will be set to VERIFIED.")) return;
    const label = payments.find((p) => p.id === id)?.razorpayPaymentId || id;
    setError("");
    try {
      const res = await adminApi.payments.verify(id);
      window.alert(res?.message || `Payment ${label} verified.`);
      fetchPayments();
    } catch (e: any) {
      setError(e.message || "Could not verify payment");
    }
  };

  const handleReject = async (id: string) => {
    const note = window.prompt("Reason for rejecting this payment verification:", "");
    if (note === null) return;
    setError("");
    try {
      const res = await adminApi.payments.reject(id, note.trim() || "Payment not verified");
      window.alert(res?.message || "Payment verification rejected.");
      fetchPayments();
    } catch (e: any) {
      setError(e.message || "Could not reject payment");
    }
  };

  const handleExport = () => {
    window.location.href = adminApi.payments.exportCsv({ status: status || undefined, search: search || undefined });
  };

  const fmt = (amount: unknown, currency: unknown) => {
    const amt = typeof amount === "number" ? amount : Number(amount || 0);
    const cur = (currency as string) || "INR";
    return `${cur} ${amt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy dark:text-white">Payments</h1>
          <p className="mt-1 text-sm text-muted-foreground">{total} payment{total !== 1 ? "s" : ""} found</p>
        </div>
        <Button variant="gold" onClick={handleExport}>Export CSV</Button>
      </div>

      <Card className="mb-6">
        <form onSubmit={applyFilters} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="field-label">Search</span>
            <input
              type="text"
              className="field-input"
              placeholder="Order ID, Payment ID, App ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="field-label">Status</span>
            <select className="field-input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="field-label">From</span>
            <input type="date" className="field-input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">To</span>
            <input type="date" className="field-input" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <div className="flex items-end gap-2">
            <Button type="submit">Apply Filters</Button>
            <Button type="button" variant="outline" onClick={() => { setSearch(""); setStatus(""); setFrom(""); setTo(""); setPage(1); }}>
              Clear
            </Button>
          </div>
        </form>
      </Card>

      {error && <ErrorState message={error} />}
      {loading && <Spinner label="Loading payments..." />}

      {!loading && !error && payments.length === 0 && (
        <EmptyState title="No payments found" subtitle="Try adjusting your filters." />
      )}

      {!loading && !error && payments.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-4 font-semibold">Application ID</th>
                  <th className="pb-2 pr-4 font-semibold">Applicant</th>
                  <th className="pb-2 pr-4 font-semibold">Transaction ID / UTR</th>
                  <th className="pb-2 pr-4 font-semibold">Amount</th>
                  <th className="pb-2 pr-4 font-semibold">Method</th>
                  <th className="pb-2 pr-4 font-semibold">Order Ref</th>
                  <th className="pb-2 pr-4 font-semibold">Status</th>
                  <th className="pb-2 pr-4 font-semibold">Date</th>
                  <th className="pb-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 pr-4">
                      <Link
                        href={`/admin/applications/${p.application?.id}`}
                        className="font-mono text-xs text-navy hover:underline dark:text-gold"
                      >
                        {p.application?.applicationId || "—"}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4">
                      <p className="font-medium text-navy dark:text-white">
                        {p.application?.personalDetails?.fullName || p.application?.student?.name || "—"}
                      </p>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="break-all font-mono text-xs text-navy dark:text-white">{p.razorpayPaymentId || "—"}</span>
                    </td>
                    <td className="py-2.5 pr-4 text-navy dark:text-white">{fmt(p.amount, p.currency)}</td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">{(p.paymentMethod || "MANUAL_UPI") === "RAZORPAY" ? "Razorpay" : "Manual UPI"}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{p.razorpayOrderId || "—"}</td>
                    <td className="py-2.5 pr-4"><PaymentStatusBadge status={p.status} /></td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{fmtDateTime(p.paymentDate || p.createdAt)}</td>
                    <td className="py-2.5">
                      {p.paymentScreenshotKey ? (
                        <a
                          href={adminApi.payments.paymentScreenshot(p.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          referrerPolicy="no-referrer"
                          className="mr-2 inline-block rounded-md border border-border px-2 py-1 text-xs font-semibold text-navy hover:bg-gold-soft dark:text-gold dark:hover:bg-white/10"
                        >
                          Screenshot
                        </a>
                      ) : null}
                      {p.status === "PENDING" || p.status === "PENDING_VERIFICATION" ? (
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleVerify(p.id)}>
                            Verify
                          </Button>
                          {p.status === "PENDING_VERIFICATION" && (
                            <Button variant="outline" size="sm" onClick={() => handleReject(p.id)}>
                              Reject
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </AdminLayout>
  );
}

export default function PaymentsPageWrapper() {
  return (
    <Suspense>
      <PaymentsPage />
    </Suspense>
  );
}
