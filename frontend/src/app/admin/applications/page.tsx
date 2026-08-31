"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, Badge, Button, Spinner, ErrorState, EmptyState } from "@/components/admin/ui";
import { adminApi, statusColor, fmtDate } from "@/lib/admin-api";

const VALID_STATUSES = [
  "DRAFT", "SUBMITTED", "UNDER_REVIEW", "DOCUMENT_VERIFICATION",
  "APPROVED", "REJECTED", "WAITLISTED", "WITHDRAWN", "CORRECTION_REQUESTED",
];

const EDUCATION_LEVELS = ["HIGH_SCHOOL", "DIPLOMA", "UNDERGRADUATE", "POSTGRADUATE"];

export default function ApplicationsPage() {
  const searchParams = useSearchParams();

  const [applications, setApplications] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [scholarshipId, setScholarshipId] = useState(searchParams.get("scholarshipId") || "");
  const [educationLevel, setEducationLevel] = useState(searchParams.get("educationLevel") || "");
  const [district, setDistrict] = useState(searchParams.get("district") || "");
  const [state, setState] = useState(searchParams.get("state") || "");
  const [from, setFrom] = useState(searchParams.get("from") || "");
  const [to, setTo] = useState(searchParams.get("to") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "desc");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));

  const [scholarships, setScholarships] = useState<any[]>([]);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | undefined> = {
        search: search || undefined,
        status: status || undefined,
        scholarshipId: scholarshipId || undefined,
        educationLevel: educationLevel || undefined,
        district: district || undefined,
        state: state || undefined,
        from: from || undefined,
        to: to || undefined,
        sort,
        page: String(page),
        limit: "15",
      };
      const data = await adminApi.applications.list(params);
      setApplications(data.applications || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (e: any) {
      setError(e.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [search, status, scholarshipId, educationLevel, district, state, from, to, sort, page]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    adminApi.scholarships.list().then((d) => setScholarships(d.scholarships || [])).catch(() => {});
  }, []);

  const handleExport = () => {
    const url = adminApi.applications.exportCsv({
      search: search || undefined,
      status: status || undefined,
      scholarshipId: scholarshipId || undefined,
    });
    window.location.href = url;
  };

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchApplications();
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">Applications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} application{total !== 1 ? "s" : ""} found
          </p>
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
              placeholder="ID, name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="field-label">Status</span>
            <select className="field-input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {VALID_STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="field-label">Scholarship</span>
            <select className="field-input" value={scholarshipId} onChange={(e) => setScholarshipId(e.target.value)}>
              <option value="">All Scholarships</option>
              {scholarships.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="field-label">Education Level</span>
            <select className="field-input" value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)}>
              <option value="">All Levels</option>
              {EDUCATION_LEVELS.map((l) => (
                <option key={l} value={l}>{l.replace(/_/g, " ")}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="field-label">District</span>
            <input type="text" className="field-input" value={district} onChange={(e) => setDistrict(e.target.value)} />
          </label>

          <label className="block">
            <span className="field-label">State</span>
            <input type="text" className="field-input" value={state} onChange={(e) => setState(e.target.value)} />
          </label>

          <label className="block">
            <span className="field-label">From</span>
            <input type="date" className="field-input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>

          <label className="block">
            <span className="field-label">To</span>
            <input type="date" className="field-input" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>

          <label className="block">
            <span className="field-label">Sort</span>
            <select className="field-input" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </label>

          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
            <Button type="submit">Apply Filters</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearch(""); setStatus(""); setScholarshipId("");
                setEducationLevel(""); setDistrict(""); setState("");
                setFrom(""); setTo(""); setSort("desc"); setPage(1);
              }}
            >
              Clear
            </Button>
          </div>
        </form>
      </Card>

      {error && <ErrorState message={error} />}
      {loading && <Spinner label="Loading applications..." />}

      {!loading && !error && applications.length === 0 && (
        <EmptyState title="No applications found" subtitle="Try adjusting your filters." />
      )}

      {!loading && !error && applications.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-4 font-semibold">Application ID</th>
                  <th className="pb-2 pr-4 font-semibold">Student</th>
                  <th className="pb-2 pr-4 font-semibold">Email</th>
                  <th className="pb-2 pr-4 font-semibold">Scholarship</th>
                  <th className="pb-2 pr-4 font-semibold">Status</th>
                  <th className="pb-2 pr-4 font-semibold">Submitted</th>
                  <th className="pb-2 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 pr-4 font-mono text-xs text-navy">{a.applicationId}</td>
                    <td className="py-2.5 pr-4 font-medium text-navy">
                      {a.personalDetails?.fullName || a.student?.name || "—"}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{a.student?.email || "—"}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{a.scholarshipProgram?.name || "—"}</td>
                    <td className="py-2.5 pr-4">
                      <Badge className={statusColor(a.status)}>{a.status.replace(/_/g, " ")}</Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{fmtDate(a.submittedAt || a.createdAt)}</td>
                    <td className="py-2.5">
                      <Link href={`/admin/applications/${a.id}`} className="text-xs font-semibold text-navy hover:underline">
                        View
                      </Link>
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
