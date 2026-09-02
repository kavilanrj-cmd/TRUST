"use client";

import React, { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, Badge, Button, Spinner, ErrorState, EmptyState } from "@/components/admin/ui";
import { adminApi, fmtDateTime } from "@/lib/admin-api";

const PAYMENT_STATUSES = ["SUCCESS", "FAILED", "PENDING", "REFUNDED"];

function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    SUCCESS: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-700",
    PENDING: "bg-amber-100 text-amber-700",
    REFUNDED: "bg-gray-100 text-gray-600",
  };
  return <Badge className={map[status] || "bg-gray-100 text-gray-600"}>{status}</Badge>;
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
          <h1 className="text-2xl font-bold tracking-tight text-navy">Payments</h1>
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
                  <th className="pb-2 pr-4 font-semibold">Amount</th>
                  <th className="pb-2 pr-4 font-semibold">Razorpay Order ID</th>
                  <th className="pb-2 pr-4 font-semibold">Razorpay Payment ID</th>
                  <th className="pb-2 pr-4 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 pr-4">
                      <Link
                        href={`/admin/applications/${p.application?.id}`}
                        className="font-mono text-xs text-navy hover:underline"
                      >
                        {p.application?.applicationId || "—"}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4">
                      <p className="font-medium text-navy">
                        {p.application?.personalDetails?.fullName || p.application?.student?.name || "—"}
                      </p>
                    </td>
                    <td className="py-2.5 pr-4 text-navy">{fmt(p.amount, p.currency)}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{p.razorpayOrderId || "—"}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{p.razorpayPaymentId || "—"}</td>
                    <td className="py-2.5 pr-4"><PaymentStatusBadge status={p.status} /></td>
                    <td className="py-2.5 text-muted-foreground">{fmtDateTime(p.paymentDate || p.createdAt)}</td>
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
