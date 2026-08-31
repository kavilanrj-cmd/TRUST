"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, Button, Field, Spinner, ErrorState, EmptyState, pageHeading, fmtDateTime, inputCls } from "@/components/admin/ui";
import { adminApi } from "@/lib/admin-api";

interface AuditLog {
  id: string;
  action: string;
  actorName: string;
  targetType: string | null;
  targetId: string | null;
  ip: string | null;
  metadata: any;
  createdAt: string;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState("");
  const [actor, setActor] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    adminApi
      .audit({
        action: action || undefined,
        actor: actor || undefined,
        from: from || undefined,
        to: to || undefined,
        page: String(page),
        limit: "20",
      })
      .then((d) => {
        setLogs(d.logs || []);
        setTotal(d.total || 0);
        setTotalPages(d.totalPages || 1);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [action, actor, from, to, page]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = () => {
    setPage(1);
  };

  return (
    <AdminLayout>
      {pageHeading("Audit Log", "Track all admin actions and changes.")}

      <Card title="Filters" actions={
        <Button variant="primary" size="sm" onClick={handleSearch}>Search</Button>
      }>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          <Field label="Action">
            <input className={inputCls} value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. user.created" />
          </Field>
          <Field label="Actor">
            <input className={inputCls} value={actor} onChange={(e) => setActor(e.target.value)} placeholder="Actor name" />
          </Field>
          <Field label="From">
            <input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="To">
            <input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
      </Card>

      <div className="mt-6">
        {error && <ErrorState message={error} />}
        {!error && loading && <Spinner />}
        {!error && !loading && logs.length === 0 && <EmptyState title="No audit entries" subtitle="Try adjusting your filters." />}
        {!error && !loading && logs.length > 0 && (
          <Card subtitle={`${total} total entries`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 pr-4 font-semibold">Action</th>
                    <th className="pb-2 pr-4 font-semibold">Actor</th>
                    <th className="pb-2 pr-4 font-semibold">Target</th>
                    <th className="pb-2 pr-4 font-semibold">IP</th>
                    <th className="pb-2 pr-4 font-semibold">Meta</th>
                    <th className="pb-2 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-border last:border-0">
                      <td className="py-2.5 pr-4 font-mono text-xs text-navy">{log.action}</td>
                      <td className="py-2.5 pr-4 text-navy">{log.actorName || "—"}</td>
                      <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                        {log.targetType ? `${log.targetType}` : "—"}
                        {log.targetId && <span className="ml-1 font-mono">({log.targetId.slice(0, 8)}…)</span>}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{log.ip || "—"}</td>
                      <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                        {log.metadata ? (
                          <span className="max-w-[200px] truncate block" title={JSON.stringify(log.metadata)}>
                            {typeof log.metadata === "object" ? JSON.stringify(log.metadata).slice(0, 60) : String(log.metadata)}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="py-2.5 text-muted-foreground">{fmtDateTime(log.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
