"use client";

import React, { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, Badge, Button, Spinner, ErrorState, EmptyState } from "@/components/admin/ui";
import { adminApi, statusColor, fmtDate, fmtDateTime } from "@/lib/admin-api";

const VALID_STATUSES = [
  "DRAFT", "SUBMITTED", "UNDER_REVIEW", "DOCUMENT_VERIFICATION",
  "APPROVED", "REJECTED", "WAITLISTED", "WITHDRAWN", "CORRECTION_REQUESTED",
];

export default function StudentsPageWrapper() {
  return (
    <Suspense>
      <StudentsPage />
    </Suspense>
  );
}

function StudentsPage() {
  const searchParams = useSearchParams();

  const [students, setStudents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "desc");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | undefined> = {
        search: search || undefined,
        status: status || undefined,
        sort,
        page: String(page),
        limit: "15",
      };
      const data = await adminApi.students.list(params);
      setStudents(data.students || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (e: any) {
      setError(e.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [search, status, sort, page]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy dark:text-white">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} student{total !== 1 ? "s" : ""} found
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <form onSubmit={applyFilters} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="field-label">Search</span>
            <input
              type="text"
              className="field-input"
              placeholder="Name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="field-label">Application Status</span>
            <select className="field-input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {VALID_STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="field-label">Sort</span>
            <select className="field-input" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </label>

          <div className="flex items-end gap-2 sm:col-span-3">
            <Button type="submit">Apply Filters</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearch(""); setStatus(""); setSort("desc"); setPage(1);
              }}
            >
              Clear
            </Button>
          </div>
        </form>
      </Card>

      {error && <ErrorState message={error} />}
      {loading && <Spinner label="Loading students..." />}

      {!loading && !error && students.length === 0 && (
        <EmptyState title="No students found" subtitle="Try adjusting your filters." />
      )}

      {!loading && !error && students.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-4 font-semibold">Name</th>
                  <th className="pb-2 pr-4 font-semibold">Email</th>
                  <th className="pb-2 pr-4 font-semibold">Email Verified</th>
                  <th className="pb-2 pr-4 font-semibold">Application</th>
                  <th className="pb-2 pr-4 font-semibold">Status</th>
                  <th className="pb-2 pr-4 font-semibold">Scholarship</th>
                  <th className="pb-2 pr-4 font-semibold">Submitted</th>
                  <th className="pb-2 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 pr-4 font-medium text-navy dark:text-white">{s.name || "—"}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{s.email || "—"}</td>
                    <td className="py-2.5 pr-4">
                      {s.emailVerified ? (
                        <Badge className="bg-green-50 text-green-700">Verified</Badge>
                      ) : (
                        <Badge className="bg-amber-50 text-amber-700">Pending</Badge>
                      )}
                    </td>
                    <td className="py-2.5 pr-4">
                      {s.application ? (
                        <Link href={`/admin/applications/${s.application.id}`} className="font-mono text-xs text-navy hover:underline dark:text-gold">
                          {s.application.applicationId}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">No application</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4">
                      {s.application ? (
                        <Badge className={statusColor(s.application.status)}>{s.application.status.replace(/_/g, " ")}</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-600">—</Badge>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{s.application?.scholarshipProgram?.name || "—"}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{s.application?.submittedAt ? fmtDate(s.application.submittedAt) : (s.application?.createdAt ? fmtDate(s.application.createdAt) : "—")}</td>
                    <td className="py-2.5">
                      {s.application && (
                        <Link href={`/admin/applications/${s.application.id}`} className="text-xs font-semibold text-navy hover:underline dark:text-gold">
                          View Application
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
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