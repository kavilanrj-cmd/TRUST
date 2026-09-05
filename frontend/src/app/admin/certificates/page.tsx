"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, Badge, Button, Spinner, ErrorState, EmptyState, Field } from "@/components/admin/ui";
import { adminApi, fmtDateTime } from "@/lib/admin-api";

interface CertForm {
  title: string;
  isPublished: boolean;
}

const emptyForm: CertForm = { title: "", isPublished: false };

function fileSizeLabel(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CertForm>(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.certificates.list();
      setCertificates(data.certificates || []);
    } catch (e: any) {
      setError(e.message || "Failed to load certificates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFile(null);
    setShowForm(true);
  };

  const startEdit = (c: any) => {
    setEditingId(c.id);
    setForm({ title: c.title || "", isPublished: !!c.isPublished });
    setFile(null);
    setShowForm(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert("Certificate title is required.");
      return;
    }
    if (!file) {
      alert("Please choose a certificate file (PDF, JPG, PNG or WEBP).");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("file", file);
      await adminApi.certificates.create(fd);
      setShowForm(false);
      setForm(emptyForm);
      setFile(null);
      fetchCertificates();
    } catch (err: any) {
      alert(err.message || "Failed to upload certificate");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!form.title.trim()) {
      alert("Certificate title is required.");
      return;
    }
    setSaving(true);
    try {
      if (file) {
        const fd = new FormData();
        fd.append("title", form.title.trim());
        fd.append("file", file);
        await adminApi.certificates.replaceFile(editingId, fd);
      } else {
        await adminApi.certificates.update(editingId, {
          title: form.title.trim(),
          isPublished: form.isPublished,
        });
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      setFile(null);
      fetchCertificates();
    } catch (err: any) {
      alert(err.message || "Failed to update certificate");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (c: any) => {
    try {
      await adminApi.certificates.update(c.id, {
        title: c.title,
        isPublished: !c.isPublished,
      });
      fetchCertificates();
    } catch (err: any) {
      alert(err.message || "Failed to update certificate");
    }
  };

  const handleDelete = async (c: any) => {
    if (!confirm(`Delete "${c.title}"? This action cannot be undone.`)) return;
    try {
      await adminApi.certificates.remove(c.id);
      fetchCertificates();
    } catch (err: any) {
      alert(err.message || "Failed to delete certificate");
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy dark:text-white">Certificates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload and manage certificates. Only published certificates appear on the public site.
          </p>
        </div>
        {!showForm && (
          <Button variant="gold" onClick={startCreate}>Upload Certificate</Button>
        )}
      </div>

      {showForm && (
        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-navy dark:text-white">
            {editingId ? "Edit Certificate" : "Upload a New Certificate"}
          </h2>
          <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
            <Field label="Title">
              <input
                type="text"
                className="field-input"
                placeholder="e.g. Scholarship Award Certificate – 2026"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </Field>

            <div>
              <span className="field-label">
                Certificate File {!editingId && <span className="text-destructive">*</span>}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full text-sm text-muted-foreground"
              />
              {editingId ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {file ? "A new file replaces the current one." : "Leave empty to keep the current file."}
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">PDF, JPG, PNG or WEBP (max 20MB).</p>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm text-navy dark:text-white">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#d4af37]"
                checked={form.isPublished}
                onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
              />
              Publish on public site
            </label>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editingId ? "Save Changes" : "Upload Certificate"}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); setFile(null); }}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {error && <ErrorState message={error} />}
      {loading && <Spinner label="Loading certificates..." />}

      {!loading && !error && certificates.length === 0 && (
        <EmptyState title="No certificates yet" subtitle="Upload your first certificate to get started." />
      )}

      {!loading && !error && certificates.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-4 font-semibold">Title</th>
                  <th className="pb-2 pr-4 font-semibold">Status</th>
                  <th className="pb-2 pr-4 font-semibold">Type</th>
                  <th className="pb-2 pr-4 font-semibold">Size</th>
                  <th className="pb-2 pr-4 font-semibold">Uploaded</th>
                  <th className="pb-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 pr-4">
                      <p className="font-medium text-navy dark:text-white">{c.title}</p>
                      {c.originalFileName && (
                        <p className="text-xs text-muted-foreground">{c.originalFileName}</p>
                      )}
                    </td>
                    <td className="py-2.5 pr-4">
                      {c.isPublished ? (
                        <Badge className="bg-green-100 text-green-700">Published</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-600">Draft</Badge>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">{(c.fileType || "—").replace("image/", "").replace("application/", "")}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{fileSizeLabel(c.fileSize)}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{fmtDateTime(c.createdAt)}</td>
                    <td className="py-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={adminApi.certificates.serve(c.id, true)}
                          target="_blank"
                          rel="noopener noreferrer"
                          referrerPolicy="no-referrer"
                          className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-navy hover:bg-gold-soft dark:text-gold dark:hover:bg-white/10"
                        >
                          View
                        </a>
                        <Button variant="outline" size="sm" onClick={() => startEdit(c)}>Edit</Button>
                        <Button variant="outline" size="sm" onClick={() => handleTogglePublish(c)}>
                          {c.isPublished ? "Unpublish" : "Publish"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(c)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </AdminLayout>
  );
}