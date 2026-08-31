"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, Button, Badge, Field, Spinner, ErrorState, pageHeading, inputCls } from "@/components/admin/ui";
import { adminApi } from "@/lib/admin-api";

interface WebsiteField {
  key: string;
  page: string;
  section: string;
  type: string;
  label: string;
  help?: string;
  editable: boolean;
  maxLength?: number;
  value: string;
  draftValue: string | null;
  lastPublishedAt?: string | null;
}

export default function AdminWebsitePage() {
  const [fields, setFields] = useState<WebsiteField[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [msg, setMsg] = useState("");
  const [confirmPublish, setConfirmPublish] = useState(false);

  useEffect(() => {
    adminApi.website
      .content()
      .then((d) => {
        setFields(d.fields || []);
        const init: Record<string, string> = {};
        for (const f of d.fields || []) init[f.key] = f.draftValue ?? f.value;
        setDrafts(init);
        if (d.fields && d.fields.length) setSelected(d.fields[0].key);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const dirtyKeys = useMemo(() => {
    return fields.filter((f) => (drafts[f.key] ?? "") !== (f.draftValue ?? f.value ?? "")).map((f) => f.key);
  }, [fields, drafts]);
  const isDirty = dirtyKeys.length > 0;

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const groups = useMemo(() => {
    const map = new Map<string, Map<string, WebsiteField[]>>();
    for (const f of fields) {
      if (!f.editable) continue;
      if (!map.has(f.page)) map.set(f.page, new Map());
      const sections = map.get(f.page)!;
      if (!sections.has(f.section)) sections.set(f.section, []);
      sections.get(f.section)!.push(f);
    }
    return map;
  }, [fields]);

  const sel = fields.find((f) => f.key === selected);

  const handleEdit = (key: string, value: string) => {
    setDrafts((d) => ({ ...d, [key]: value }));
  };

  const handleSaveDrafts = async () => {
    setSaving(true);
    setMsg("");
    setError("");
    try {
      const updates = dirtyKeys.map((k) => ({ key: k, value: drafts[k] ?? "" }));
      const d = await adminApi.website.saveDrafts(updates);
      setMsg(d.message || "Draft saved.");
      // Refresh to reflect persisted draft values.
      await reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const reload = async () => {
    const d = await adminApi.website.content();
    setFields(d.fields || []);
    const init: Record<string, string> = {};
    for (const f of d.fields || []) init[f.key] = f.draftValue ?? f.value;
    setDrafts(init);
    setError("");
  };

  const handlePublish = async () => {
    setPublishing(true);
    setMsg("");
    setError("");
    try {
      // Ensure any unsaved edits are persisted as drafts before publishing.
      if (dirtyKeys.length) {
        await adminApi.website.saveDrafts(dirtyKeys.map((k) => ({ key: k, value: drafts[k] ?? "" })));
      }
      const d = await adminApi.website.publish();
      setMsg(d.message || "Published.");
      setConfirmPublish(false);
      await reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <AdminLayout>
      {pageHeading("Website Editor", "Edit homepage copy as drafts, preview, then publish. Changes are never live until you publish.")}

      {msg && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{msg}</div>
      )}
      {error && <ErrorState message={error} />}
      {loading && <Spinner />}

      {!loading && !error && (
        <Card
          actions={
            <>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-navy/20 bg-white px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-muted"
              >
                View live site
              </a>
              <Button variant="gold" disabled={!isDirty || saving} onClick={handleSaveDrafts}>
                {saving ? "Saving…" : "Save Drafts"}
              </Button>
              <Button disabled={publishing} onClick={() => setConfirmPublish(true)}>
                {publishing ? "Publishing…" : "Publish"}
              </Button>
              {isDirty && (
                <Badge className="bg-amber-100 text-amber-800">
                  {dirtyKeys.length} unsaved
                </Badge>
              )}
            </>
          }
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
            <div className="max-h-[70vh] overflow-y-auto rounded-lg border border-border">
              {Array.from(groups.entries()).map(([page, sections]) => (
                <div key={page} className="border-b border-border last:border-b-0">
                  <div className="bg-muted/60 px-3 py-2 text-xs font-bold uppercase tracking-wide text-navy">
                    {page}
                  </div>
                  {Array.from(sections.entries()).map(([section, list]) => (
                    <div key={section}>
                      <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {section}
                      </div>
                      {list.map((f) => {
                        const hasDraft = f.draftValue !== null && f.draftValue !== f.value;
                        const isCurrentDirty = (drafts[f.key] ?? "") !== (f.draftValue ?? f.value ?? "");
                        return (
                          <button
                            key={f.key}
                            onClick={() => setSelected(f.key)}
                            className={`block w-full px-3 py-2 text-left text-sm transition hover:bg-muted ${
                              selected === f.key ? "bg-gold/15 font-semibold text-navy" : "text-muted-foreground"
                            }`}
                          >
                            <span className="flex items-center justify-between gap-2">
                              <span className="truncate">{f.label}</span>
                              {hasDraft && (
                                <Badge className="shrink-0 bg-gold/20 text-navy">Draft</Badge>
                              )}
                              {isCurrentDirty && (
                                <Badge className="shrink-0 bg-amber-100 text-amber-800">•</Badge>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {sel ? (
                <FieldEditor
                  field={sel}
                  value={drafts[sel.key] ?? ""}
                  onChange={(v) => handleEdit(sel.key, v)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Select a field from the left to edit it.</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {sel && !loading && !error && (
        <div className="mt-4">
          <VersionHistory field={sel} />
        </div>
      )}

      {confirmPublish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-lg">
            <h3 className="mb-2 text-base font-semibold text-navy">Publish all draft changes?</h3>
            <p className="text-sm text-muted-foreground">
              All fields with pending drafts will become live on the public website immediately. Version snapshots are
              created so you can restore later.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmPublish(false)}>Cancel</Button>
              <Button disabled={publishing} onClick={handlePublish}>
                {publishing ? "Publishing…" : "Confirm Publish"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function FieldEditor({
  field,
  value,
  onChange,
}: {
  field: WebsiteField;
  value: string;
  onChange: (v: string) => void;
}) {
  const isTextarea = field.type === "textarea" || field.type === "rich";
  const isImage = field.type === "image";
  const isDraft = field.draftValue !== null && field.draftValue !== field.value;
  const looksLikeImage =
    isImage ||
    (/\.(png|jpe?g|gif|webp|svg|avif)(\?|#|$)/i.test(value) ||
      /^\/media\//.test(value) ||
      /^media\//.test(value));
  return (
    <Card
      title={field.label}
      subtitle={field.help}
      actions={
        isDraft ? (
          <Badge className="bg-gold/20 text-navy">Unpublished draft</Badge>
        ) : (
          <Badge className="bg-green-100 text-green-800">Live</Badge>
        )
      }
    >
      {isImage && (
        <div className="mb-4">
          <p className="field-label mb-2">Image preview</p>
          {looksLikeImage && value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt={field.label}
              className="max-h-56 w-full rounded-lg border border-border object-cover"
            />
          ) : (
            <p className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
              No image set yet. Enter a media URL or /media/&lt;filename&gt; reference below.
            </p>
          )}
        </div>
      )}
      <Field label={field.label} hint={field.key}>
        {isTextarea ? (
          <textarea
            className={inputCls}
            rows={6}
            value={value}
            maxLength={field.maxLength}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <input
            type={field.type === "url" ? "url" : "text"}
            className={inputCls}
            value={value}
            maxLength={field.maxLength}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      </Field>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Last published: {field.lastPublishedAt ? new Date(field.lastPublishedAt).toLocaleString() : "never"}</span>
        {field.maxLength && (
          <span>
            {value.length}/{field.maxLength}
          </span>
        )}
      </div>
    </Card>
  );
}

interface ContentVersion {
  id: string;
  versionNumber: number;
  value: string;
  editedByName?: string;
  createdAt?: string;
  summary?: string;
}

function VersionHistory({ field }: { field: WebsiteField }) {
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const load = async (force = false) => {
    setOpen(true);
    if (!force && versions.length) return;
    setLoading(true);
    setError("");
    try {
      const d = await adminApi.website.versions(field.key);
      setVersions(d.versions || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const restore = async (versionId: string) => {
    setMsg("");
    setError("");
    if (!window.confirm("Restore this version? It is set as a draft — publish to make it live.")) return;
    try {
      const d = await adminApi.website.restore(field.key, versionId);
      setMsg(d.message || "Restored as draft.");
      await load(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Card
      title={`Version history — ${field.label}`}
      actions={
        <Button variant="outline" size="sm" onClick={() => load()}>
          {open ? "Refresh" : "Load history"}
        </Button>
      }
    >
      {!open && <p className="text-sm text-muted-foreground">Click “Load history” to see past published versions of this field.</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {msg && <p className="text-sm text-green-700">{msg}</p>}
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {open && !loading && versions.length === 0 && (
        <p className="text-sm text-muted-foreground">No published versions yet for this field.</p>
      )}
      {open && !loading && versions.length > 0 && (
        <ul className="space-y-2">
          {versions.map((v) => (
            <li key={v.id} className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-navy">v{v.versionNumber}</span>
                  <span className="text-xs text-muted-foreground">
                    {v.editedByName || "—"} · {v.createdAt ? new Date(v.createdAt).toLocaleString() : "—"}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">{v.value || "(empty)"}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => restore(v.id)}>
                Restore
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
