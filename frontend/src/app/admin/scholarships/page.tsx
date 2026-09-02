"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, Badge, Button, Spinner, ErrorState, EmptyState, Field } from "@/components/admin/ui";
import { adminApi, fmtDate } from "@/lib/admin-api";

const EDUCATION_LEVELS = ["HIGH_SCHOOL", "DIPLOMA", "UNDERGRADUATE", "POSTGRADUATE"];

const emptyForm = {
  name: "",
  description: "",
  educationLevels: [] as string[],
  minimumMarks: "",
  minimumCGPA: "",
  maximumFamilyIncome: "",
  applicationFee: "0",
  applicationDeadline: "",
  isActive: true,
  requiredDocuments: [] as { name: string; description: string; maxFileSize: number; allowedTypes: string[]; isRequired: boolean }[],
};

type FormState = typeof emptyForm;

function ScholarshipForm({
  initial,
  onSubmit,
  onCancel,
  saving,
}: {
  initial: FormState;
  onSubmit: (data: FormState) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const set = (k: keyof FormState, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const toggleLevel = (l: string) => {
    set("educationLevels", form.educationLevels.includes(l)
      ? form.educationLevels.filter((x) => x !== l)
      : [...form.educationLevels, l]);
  };

  const addDoc = () => {
    set("requiredDocuments", [...form.requiredDocuments, {
      name: "", description: "", maxFileSize: 5242880,
      allowedTypes: ["application/pdf", "image/jpeg", "image/png"], isRequired: true,
    }]);
  };

  const updateDoc = (i: number, k: string, v: any) => {
    const docs = [...form.requiredDocuments];
    (docs[i] as any)[k] = v;
    set("requiredDocuments", docs);
  };

  const removeDoc = (i: number) => {
    set("requiredDocuments", form.requiredDocuments.filter((_, idx) => idx !== i));
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <Field label="Name">
        <input className="field-input" required maxLength={200} value={form.name} onChange={(e) => set("name", e.target.value)} />
      </Field>

      <Field label="Description">
        <textarea className="field-input" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
      </Field>

      <div>
        <span className="field-label">Education Levels</span>
        <div className="mt-1 flex flex-wrap gap-2">
          {EDUCATION_LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => toggleLevel(l)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                form.educationLevels.includes(l)
                  ? "border-navy bg-navy text-white"
                  : "border-border bg-white text-navy hover:bg-muted dark:border-white/15 dark:bg-[#131a2e] dark:text-white dark:hover:bg-white/5"
              }`}
            >
              {l.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Minimum Marks (%)">
          <input type="number" className="field-input" min={0} max={100} value={form.minimumMarks} onChange={(e) => set("minimumMarks", e.target.value)} />
        </Field>
        <Field label="Minimum CGPA">
          <input type="number" className="field-input" min={0} max={10} step="0.1" value={form.minimumCGPA} onChange={(e) => set("minimumCGPA", e.target.value)} />
        </Field>
        <Field label="Max Family Income (₹)">
          <input type="number" className="field-input" min={0} value={form.maximumFamilyIncome} onChange={(e) => set("maximumFamilyIncome", e.target.value)} />
        </Field>
        <Field label="Application Fee (₹)">
          <input type="number" className="field-input" min={0} required value={form.applicationFee} onChange={(e) => set("applicationFee", e.target.value)} />
        </Field>
        <Field label="Application Deadline">
          <input type="date" className="field-input" required value={form.applicationDeadline} onChange={(e) => set("applicationDeadline", e.target.value)} />
        </Field>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={form.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
          className="h-4 w-4 rounded border-border text-navy focus:ring-navy dark:text-white"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-navy dark:text-white">Active</label>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="field-label">Required Documents</span>
          <Button type="button" variant="ghost" size="sm" onClick={addDoc}>+ Add Document</Button>
        </div>
        {form.requiredDocuments.map((doc, i) => (
          <div key={i} className="mt-2 flex flex-wrap items-end gap-2 rounded-lg border border-border p-3">
            <Field label="Doc Name">
              <input className="field-input" required value={doc.name} onChange={(e) => updateDoc(i, "name", e.target.value)} />
            </Field>
            <Field label="Description">
              <input className="field-input" value={doc.description} onChange={(e) => updateDoc(i, "description", e.target.value)} />
            </Field>
            <div className="flex items-center gap-2 pb-0.5">
              <input
                type="checkbox"
                checked={doc.isRequired}
                onChange={(e) => updateDoc(i, "isRequired", e.target.checked)}
          className="h-4 w-4 rounded border-border text-navy focus:ring-navy dark:text-white"
              />
              <span className="text-xs font-medium text-navy dark:text-white">Required</span>
            </div>
            <Button type="button" variant="danger" size="sm" onClick={() => removeDoc(i)}>Remove</Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" variant="gold" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchScholarships = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.scholarships.list();
      setScholarships(data.scholarships || []);
    } catch (e: any) {
      setError(e.message || "Failed to load scholarships");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScholarships();
  }, [fetchScholarships]);

  const toFormState = (s: any): FormState => ({
    name: s.name || "",
    description: s.description || "",
    educationLevels: s.educationLevels || [],
    minimumMarks: s.minimumMarks != null ? String(s.minimumMarks) : "",
    minimumCGPA: s.minimumCGPA != null ? String(s.minimumCGPA) : "",
    maximumFamilyIncome: s.maximumFamilyIncome != null ? String(s.maximumFamilyIncome) : "",
    applicationFee: s.applicationFee != null ? String(s.applicationFee) : "0",
    applicationDeadline: s.applicationDeadline ? new Date(s.applicationDeadline).toISOString().split("T")[0] : "",
    isActive: s.isActive ?? true,
    requiredDocuments: (s.requiredDocuments || []).map((d: any) => ({
      name: d.name || "",
      description: d.description || "",
      maxFileSize: d.maxFileSize || 5242880,
      allowedTypes: d.allowedTypes || ["application/pdf", "image/jpeg", "image/png"],
      isRequired: d.isRequired ?? true,
    })),
  });

  const buildPayload = (f: FormState) => ({
    name: f.name,
    description: f.description || null,
    educationLevels: f.educationLevels.length ? f.educationLevels : EDUCATION_LEVELS,
    minimumMarks: f.minimumMarks ? Number(f.minimumMarks) : null,
    minimumCGPA: f.minimumCGPA ? Number(f.minimumCGPA) : null,
    maximumFamilyIncome: f.maximumFamilyIncome ? Number(f.maximumFamilyIncome) : null,
    applicationFee: Number(f.applicationFee) || 0,
    applicationDeadline: f.applicationDeadline,
    isActive: f.isActive,
    requiredDocuments: f.requiredDocuments.map((d) => ({
      name: d.name,
      description: d.description || null,
      maxFileSize: d.maxFileSize,
      allowedTypes: d.allowedTypes,
      isRequired: d.isRequired,
    })),
  });

  const handleSubmit = async (form: FormState) => {
    setSaving(true);
    try {
      const payload = buildPayload(form);
      if (editingId) {
        await adminApi.scholarships.update(editingId, payload);
      } else {
        await adminApi.scholarships.create(payload);
      }
      setShowForm(false);
      setEditingId(null);
      fetchScholarships();
    } catch (e: any) {
      alert(e.message || "Failed to save scholarship");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await adminApi.scholarships.toggle(id);
      fetchScholarships();
    } catch (e: any) {
      alert(e.message || "Failed to toggle scholarship");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    try {
      await adminApi.scholarships.remove(id);
      fetchScholarships();
    } catch (e: any) {
      alert(e.message || "Failed to delete scholarship");
    }
  };

  const startEdit = (s: any) => {
    setEditingId(s.id);
    setShowForm(true);
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy dark:text-white">Scholarships</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage scholarship programs and required documents.
          </p>
        </div>
        {!showForm && (
          <Button
            variant="gold"
            onClick={() => { setEditingId(null); setShowForm(true); }}
          >
            New Scholarship
          </Button>
        )}
      </div>

      {showForm && (
        <Card title={editingId ? "Edit Scholarship" : "New Scholarship"} className="mb-6">
          <ScholarshipForm
            initial={editingId && scholarships.find((s) => s.id === editingId)
              ? toFormState(scholarships.find((s) => s.id === editingId))
              : emptyForm}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditingId(null); }}
            saving={saving}
          />
        </Card>
      )}

      {error && <ErrorState message={error} />}
      {loading && <Spinner label="Loading scholarships..." />}

      {!loading && !error && scholarships.length === 0 && (
        <EmptyState title="No scholarships yet" subtitle="Create your first scholarship program." />
      )}

      {!loading && !error && scholarships.length > 0 && (
        <div className="space-y-4">
          {scholarships.map((s) => (
            <Card key={s.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-navy dark:text-white">{s.name}</h3>
                    <Badge className={s.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}>
                      {s.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {s._count?.applications != null && (
                      <Badge className="bg-navy-50 text-navy-800">{s._count.applications} applications</Badge>
                    )}
                  </div>
                  {s.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{s.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {s.applicationDeadline && <span>Deadline: {fmtDate(s.applicationDeadline)}</span>}
                    {s.applicationFee != null && <span>Fee: ₹{s.applicationFee.toLocaleString()}</span>}
                    {s.minimumMarks != null && <span>Min Marks: {s.minimumMarks}%</span>}
                    {s.minimumCGPA != null && <span>Min CGPA: {s.minimumCGPA}</span>}
                    {s.maximumFamilyIncome != null && <span>Max Income: ₹{s.maximumFamilyIncome.toLocaleString()}</span>}
                  </div>
                  {s.educationLevels?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {s.educationLevels.map((l: string) => (
                        <Badge key={l} className="bg-navy-50 text-navy-800">{l.replace(/_/g, " ")}</Badge>
                      ))}
                    </div>
                  )}
                  {s.requiredDocuments?.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Required docs: {s.requiredDocuments.map((d: any) => d.name).join(", ")}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => startEdit(s)}>Edit</Button>
                  <Button variant={s.isActive ? "ghost" : "primary"} size="sm" onClick={() => handleToggle(s.id)}>
                    {s.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(s.id, s.name)}>Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
