"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, Badge, Button, Spinner, ErrorState } from "@/components/admin/ui";
import { adminApi, fmtDateTime } from "@/lib/admin-api";

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-1.5 sm:flex-row sm:items-start sm:gap-4">
      <span className="min-w-[160px] text-xs font-medium text-muted-foreground sm:pt-0.5">{label}</span>
      <span className="text-sm text-navy dark:text-white">{value || "—"}</span>
    </div>
  );
}

export default function ContactMessageDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [message, setMessage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.contactMessages.detail(id);
      setMessage(data.message);
    } catch (e: any) {
      setError(e.message || "Failed to load message");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDetail();
  }, [fetchDetail]);

  const handleToggleRead = async () => {
    if (!message) return;
    setBusy(true);
    setError("");
    try {
      await adminApi.contactMessages.markRead(message.id, !message.isRead);
      await fetchDetail();
    } catch (e: any) {
      setError(e.message || "Failed to update message");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this message permanently?")) return;
    setBusy(true);
    setError("");
    try {
      await adminApi.contactMessages.remove(id);
      router.push("/admin/contact-messages");
    } catch (e: any) {
      setError(e.message || "Failed to delete message");
      setBusy(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/contact-messages" className="text-sm font-semibold text-navy hover:underline dark:text-gold">
            &larr; Back
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-navy dark:text-white">Contact Message</h1>
        </div>
      </div>

      {error && <ErrorState message={error} />}
      {loading && <Spinner label="Loading message..." />}

      {!loading && !error && message && (
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Received {fmtDateTime(message.createdAt)}</p>
                {message.isRead ? (
                  <Badge className="mt-1 bg-gray-100 text-gray-600">Read</Badge>
                ) : (
                  <Badge className="mt-1 bg-blue-50 text-blue-700">Unread</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleToggleRead} disabled={busy}>
                  {message.isRead ? "Mark unread" : "Mark as read"}
                </Button>
                <Button variant="danger" onClick={handleDelete} disabled={busy}>
                  Delete
                </Button>
              </div>
            </div>
          </Card>

          <Card title="Sender">
            <div className="divide-y divide-border">
              <Field label="Name" value={message.name} />
              <Field
                label="Email"
                value={
                  <a href={`mailto:${message.email}`} className="text-navy underline hover:text-gold-600 dark:text-white dark:hover:text-gold">
                    {message.email}
                  </a>
                }
              />
            </div>
          </Card>

          <Card title="Message">
            <div className="space-y-4">
              <Field label="Subject" value={message.subject} />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Body</p>
                <p className="mt-1 whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-navy dark:bg-[#131a2e] dark:text-slate-300">
                  {message.message}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
