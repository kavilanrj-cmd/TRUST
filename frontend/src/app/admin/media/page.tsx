"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, Button, Badge, Field, Spinner, ErrorState, EmptyState, pageHeading, fmtDateTime, inputCls } from "@/components/admin/ui";
import { adminApi, AdminApiError } from "@/lib/admin-api";

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  storageKey: string;
  mimeType: string;
  size: number;
  altText: string | null;
  usageCount: number;
  uploadedBy: { name: string; email: string } | null;
  createdAt: string;
}

export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [altText, setAltText] = useState("");
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    adminApi.media
      .list(search ? { search } : undefined)
      .then((d) => setItems(d.media || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setMsg("");
    try {
      const fd = new FormData();
      for (const f of Array.from(files)) fd.append("files", f);
      await adminApi.media.upload(fd);
      setMsg(`Uploaded ${files.length} file(s)`);
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (item.usageCount > 0) {
      setMsg(`"${item.originalName}" is used in ${item.usageCount} place(s). Remove the reference before deleting.`);
      return;
    }
    if (!confirm(`Delete "${item.originalName}"? This cannot be undone.`)) return;
    setMsg("");
    try {
      await adminApi.media.remove(item.id);
      setMsg(`Deleted "${item.originalName}"`);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err: any) {
      if (err.status === 409) {
        setMsg(err.message || "Cannot delete: image is currently in use.");
      } else {
        setError(err.message);
      }
    }
  };

  const handleSaveAlt = async (id: string) => {
    try {
      await adminApi.media.update(id, { altText });
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, altText } : i)));
      setEditingId(null);
      setMsg("Alt text updated");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fmtSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <AdminLayout>
      {pageHeading("Media Library", "Upload, manage and organize images.")}

      {msg && (
        <div className="mb-4 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-navy">{msg}</div>
      )}

      <Card
        actions={
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
            <Button variant="gold" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? "Uploading…" : "Upload Files"}
            </Button>
          </div>
        }
      >
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search media by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputCls}
          />
        </div>

        {error && <ErrorState message={error} />}
        {!error && loading && <Spinner />}
        {!error && !loading && items.length === 0 && <EmptyState title="No media files" subtitle="Upload images to get started." />}
        {!error && !loading && items.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((item) => (
              <div key={item.id} className="group relative overflow-hidden rounded-lg border border-border">
                <div className="aspect-square bg-gray-100">
                  <img
                    src={adminApi.media.serve(item.filename)}
                    alt={item.altText || item.originalName}
                    className="h-full w-full object-cover"
                    crossOrigin="use-credentials"
                  />
                </div>
                <div className="p-2">
                  <p className="truncate text-xs font-medium text-navy">{item.originalName}</p>
                  <p className="text-[11px] text-muted-foreground">{fmtSize(item.size)} · {item.mimeType.split("/")[1]?.toUpperCase()}</p>
                  {item.usageCount > 0 && (
                    <Badge className="mt-1 bg-amber-50 text-amber-700">Used {item.usageCount}×</Badge>
                  )}
                </div>
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    className="rounded bg-white/90 p-1 text-navy shadow hover:bg-white"
                    title="Edit alt text"
                    onClick={() => { setEditingId(item.id); setAltText(item.altText || ""); }}
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button
                    className="rounded bg-white/90 p-1 text-red-600 shadow hover:bg-white"
                    title="Delete"
                    onClick={() => handleDelete(item)}
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl border border-border bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-base font-semibold text-navy">Edit Alt Text</h3>
            <Field label="Alt text">
              <input
                className={inputCls}
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Describe the image"
              />
            </Field>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
              <Button onClick={() => editingId && handleSaveAlt(editingId)}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
