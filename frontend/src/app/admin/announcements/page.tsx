"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, Badge, Button, Spinner, ErrorState, EmptyState, Field } from "@/components/admin/ui";
import { adminApi, fmtDateTime } from "@/lib/admin-api";

interface AnnouncementForm {
  title: string;
  content: string;
  category: string;
  imageUrl: string;
  isActive: boolean;
}

const emptyForm: AnnouncementForm = {
  title: "",
  content: "",
  category: "",
  imageUrl: "",
  isActive: true,
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AnnouncementForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.announcements.list();
      setAnnouncements(data.announcements || []);
    } catch (e: any) {
      setError(e.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const set = (k: keyof AnnouncementForm, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const startEdit = (a: any) => {
    setEditingId(a.id);
    setForm({
      title: a.title || "",
      content: a.content || "",
      category: a.category || "",
      imageUrl: a.imageUrl || "",
      isActive: a.isActive ?? true,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        content: form.content,
        category: form.category || null,
        imageUrl: form.imageUrl || null,
        isActive: form.isActive,
      };
      if (editingId) {
        await adminApi.announcements.update(editingId, payload);
      } else {
        await adminApi.announcements.create(payload);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchAnnouncements();
    } catch (e: any) {
      alert(e.message || "Failed to save announcement");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await adminApi.announcements.toggle(id);
      fetchAnnouncements();
    } catch (e: any) {
      alert(e.message || "Failed to toggle announcement");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This action cannot be undone.`)) return;
    try {
      await adminApi.announcements.remove(id);
      fetchAnnouncements();
    } catch (e: any) {
      alert(e.message || "Failed to delete announcement");
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy dark:text-white">Announcements</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage news and announcements displayed on the public site.
          </p>
        </div>
        {!showForm && (
          <Button variant="gold" onClick={startCreate}>New Announcement</Button>
        )}
      </div>

      {showForm && (
        <Card title={editingId ? "Edit Announcement" : "New Announcement"} className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Title">
              <input className="field-input" required maxLength={200} value={form.title} onChange={(e) => set("title", e.target.value)} />
            </Field>

            <Field label="Content">
              <textarea className="field-input" rows={6} required value={form.content} onChange={(e) => set("content", e.target.value)} />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Category">
                <input className="field-input" placeholder="e.g. General, Deadline, Event" value={form.category} onChange={(e) => set("category", e.target.value)} />
              </Field>
              <Field label="Image URL" hint="Optional external image URL">
                <input className="field-input" value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} />
              </Field>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="annActive"
                checked={form.isActive}
                onChange={(e) => set("isActive", e.target.checked)}
                className="h-4 w-4 rounded border-border text-navy focus:ring-navy dark:text-white"
              />
              <label htmlFor="annActive" className="text-sm font-medium text-navy dark:text-white">Active (visible on public site)</label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" variant="gold" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {error && <ErrorState message={error} />}
      {loading && <Spinner label="Loading announcements..." />}

      {!loading && !error && announcements.length === 0 && (
        <EmptyState title="No announcements yet" subtitle="Create your first announcement." />
      )}

      {!loading && !error && announcements.length > 0 && (
        <div className="space-y-4">
          {announcements.map((a) => (
            <Card key={a.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-navy dark:text-white">{a.title}</h3>
                    <Badge className={a.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}>
                      {a.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {a.category && (
                      <Badge className="bg-navy-50 text-navy-800">{a.category}</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{a.content}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Created: {fmtDateTime(a.createdAt)}</span>
                    {a.publishedAt && <span>Published: {fmtDateTime(a.publishedAt)}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => startEdit(a)}>Edit</Button>
                  <Button variant={a.isActive ? "ghost" : "primary"} size="sm" onClick={() => handleToggle(a.id)}>
                    {a.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(a.id, a.title)}>Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
