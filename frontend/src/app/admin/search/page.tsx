"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, Badge, Spinner, ErrorState, EmptyState, pageHeading, statusColor, fmtDate } from "@/components/admin/ui";
import { adminApi } from "@/lib/admin-api";

interface SearchResults {
  query: string;
  applications: any[];
  scholarships: any[];
  announcements: any[];
  activity: any[];
}

export default function AdminSearchPage() {
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") || "";
    if (!q.trim()) {
      setResults({ query: "", applications: [], scholarships: [], announcements: [], activity: [] });
      setLoading(false);
      return;
    }
    adminApi
      .search(q)
      .then((d) => setResults(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const q = results?.query || "";
  const totalResults =
    (results?.applications?.length || 0) +
    (results?.scholarships?.length || 0) +
    (results?.announcements?.length || 0) +
    (results?.activity?.length || 0);

  return (
    <AdminLayout>
      {pageHeading("Search Results", q ? `Showing results for "${q}"` : "Enter a search query")}

      {error && <ErrorState message={error} />}
      {loading && <Spinner />}
      {!loading && !error && results && totalResults === 0 && (
        <EmptyState title="No results found" subtitle="Try a different search term." />
      )}
      {!loading && !error && results && totalResults > 0 && (
        <div className="space-y-6">
          {results.applications.length > 0 && (
            <Card title="Applications" subtitle={`${results.applications.length} result(s)`}>
              <div className="space-y-2">
                {results.applications.map((a: any) => (
                  <Link
                    key={a.id}
                    href={`/admin/applications/${a.id}`}
                    className="flex items-center justify-between rounded-lg border border-border p-3 transition hover:shadow-sm"
                  >
                    <div>
                      <p className="text-sm font-medium text-navy dark:text-white">{a.student?.name || a.personalDetails?.fullName || "—"}</p>
                      <p className="text-xs text-muted-foreground">{a.applicationId} · {a.scholarshipProgram?.name || "—"}</p>
                    </div>
                    <Badge className={statusColor(a.status)}>{a.status?.replace(/_/g, " ")}</Badge>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {results.scholarships.length > 0 && (
            <Card title="Scholarships" subtitle={`${results.scholarships.length} result(s)`}>
              <div className="space-y-2">
                {results.scholarships.map((s: any) => (
                  <Link
                    key={s.id}
                    href="/admin/scholarships"
                    className="flex items-center justify-between rounded-lg border border-border p-3 transition hover:shadow-sm"
                  >
                    <p className="text-sm font-medium text-navy dark:text-white">{s.name}</p>
                    <Badge className={s.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}>
                      {s.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {results.announcements.length > 0 && (
            <Card title="Announcements" subtitle={`${results.announcements.length} result(s)`}>
              <div className="space-y-2">
                {results.announcements.map((a: any) => (
                  <Link
                    key={a.id}
                    href="/admin/announcements"
                    className="block rounded-lg border border-border p-3 transition hover:shadow-sm"
                  >
                    <p className="text-sm font-medium text-navy dark:text-white">{a.title}</p>
                    {a.content && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{a.content}</p>}
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {results.activity.length > 0 && (
            <Card title="Activity" subtitle={`${results.activity.length} result(s)`}>
              <div className="space-y-2">
                {results.activity.map((a: any) => (
                  <div key={a.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-navy dark:text-white">{a.action}</span>
                      <span className="text-xs text-muted-foreground">by {a.actorName || "—"}</span>
                    </div>
                    {a.targetType && <p className="mt-1 text-xs text-muted-foreground">Target: {a.targetType} ({a.targetId})</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{fmtDate(a.createdAt)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
