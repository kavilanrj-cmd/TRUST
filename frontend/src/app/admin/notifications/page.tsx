"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, Button, Spinner, ErrorState, EmptyState, pageHeading, fmtDateTime } from "@/components/admin/ui";
import { adminApi } from "@/lib/admin-api";

interface Notification {
  id: string;
  title: string;
  message: string | null;
  read: boolean;
  createdAt: string;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.notifications
      .list()
      .then((d) => {
        setNotifications(d.notifications || []);
        setUnreadCount(d.unreadCount || 0);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = async (id: string) => {
    try {
      await adminApi.notifications.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await adminApi.notifications.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <AdminLayout>
      {pageHeading("Notifications", unreadCount > 0 ? `${unreadCount} unread` : "All caught up")}

      {error && <ErrorState message={error} />}
      {loading && <Spinner />}
      {!loading && !error && notifications.length === 0 && (
        <EmptyState title="No notifications" />
      )}
      {!loading && !error && notifications.length > 0 && (
        <Card
          actions={
            unreadCount > 0 ? (
              <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                Mark all read
              </Button>
            ) : undefined
          }
        >
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start justify-between gap-4 rounded-lg border p-4 transition ${
                  n.read ? "border-border bg-white" : "border-gold/30 bg-gold/5"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-gold" />}
                    <p className="text-sm font-medium text-navy">{n.title}</p>
                  </div>
                  {n.message && <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{fmtDateTime(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <Button variant="ghost" size="sm" onClick={() => handleMarkRead(n.id)}>
                    Mark read
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </AdminLayout>
  );
}
