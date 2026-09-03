"use client";

import React, { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, Badge, Button, Spinner, ErrorState, EmptyState } from "@/components/admin/ui";
import { adminApi, fmtDateTime } from "@/lib/admin-api";

function ContactMessagesPage() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [read, setRead] = useState(searchParams.get("read") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10));

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.contactMessages.list({
        search: search || undefined,
        read: read || undefined,
        page: String(page),
        limit: "15",
      });
      setMessages(data.messages || []);
      setUnread(data.unread || 0);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (e: any) {
      setError(e.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [search, read, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMessages();
  }, [fetchMessages]);

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMessages();
  };

  const handleMarkRead = async (id: string, value: boolean) => {
    try {
      await adminApi.contactMessages.markRead(id, value);
      fetchMessages();
    } catch (e: any) {
      setError(e.message || "Failed to update message");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this message permanently?")) return;
    try {
      await adminApi.contactMessages.remove(id);
      fetchMessages();
    } catch (e: any) {
      setError(e.message || "Failed to delete message");
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy dark:text-white">Contact Messages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} message{total !== 1 ? "s" : ""} · {unread} unread
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <form onSubmit={applyFilters} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="field-label">Search</span>
            <input
              type="text"
              className="field-input"
              placeholder="Name, email, subject, body..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="field-label">Filter</span>
            <select className="field-input" value={read} onChange={(e) => setRead(e.target.value)}>
              <option value="">All messages</option>
              <option value="false">Unread</option>
              <option value="true">Read</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <Button type="submit">Apply</Button>
            <Button type="button" variant="outline" onClick={() => { setSearch(""); setRead(""); setPage(1); }}>
              Clear
            </Button>
          </div>
        </form>
      </Card>

      {error && <ErrorState message={error} />}
      {loading && <Spinner label="Loading messages..." />}

      {!loading && !error && messages.length === 0 && (
        <EmptyState title="No contact messages" subtitle="Messages submitted from the Contact page will appear here." />
      )}

      {!loading && !error && messages.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-4 font-semibold">From</th>
                  <th className="pb-2 pr-4 font-semibold">Subject</th>
                  <th className="pb-2 pr-4 font-semibold">Status</th>
                  <th className="pb-2 pr-4 font-semibold">Received</th>
                  <th className="pb-2 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr key={m.id} className={`border-b border-border last:border-0 ${m.isRead ? "" : "bg-gold/5"}`}>
                    <td className="py-2.5 pr-4">
                      <p className="font-medium text-navy dark:text-white">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{m.subject}</td>
                    <td className="py-2.5 pr-4">
                      {m.isRead ? (
                        <Badge className="bg-gray-100 text-gray-600">Read</Badge>
                      ) : (
                        <Badge className="bg-blue-50 text-blue-700">Unread</Badge>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{fmtDateTime(m.createdAt)}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/contact-messages/${m.id}`}
                          className="text-xs font-semibold text-navy hover:underline dark:text-gold"
                        >
                          View
                        </Link>
                        {!m.isRead && (
                          <button
                            onClick={() => handleMarkRead(m.id, true)}
                            className="text-xs font-semibold text-blue-600 hover:underline"
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="text-xs font-semibold text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
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

export default function ContactMessagesPageWrapper() {
  return (
    <Suspense>
      <ContactMessagesPage />
    </Suspense>
  );
}
