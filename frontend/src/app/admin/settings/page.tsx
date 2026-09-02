"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, Button, Field, Spinner, ErrorState, pageHeading, inputCls } from "@/components/admin/ui";
import { adminApi } from "@/lib/admin-api";

interface Setting {
  key: string;
  label: string;
  type: string;
  value: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    adminApi.settings
      .list()
      .then((d) => setSettings(d.settings || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)));
  };

  const handleToggle = (key: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value: s.value === "true" ? "false" : "true" } : s))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg("");
    setError("");
    try {
      const updates = settings.map((s) => ({ key: s.key, value: s.value }));
      await adminApi.settings.update(updates);
      setMsg("Settings saved successfully.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      {pageHeading("Website Settings", "Configure public-facing site details. Secrets are not displayed here.")}

      {msg && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{msg}</div>
      )}

      {error && <ErrorState message={error} />}
      {loading && <Spinner />}
      {!loading && !error && (
        <Card
          actions={
            <Button variant="gold" disabled={saving} onClick={handleSave}>
              {saving ? "Saving…" : "Save Settings"}
            </Button>
          }
        >
          <div className="space-y-4">
            {settings.map((s) => (
              <Field key={s.key} label={s.label} hint={s.key}>
                {s.type === "textarea" ? (
                  <textarea
                    className={inputCls}
                    rows={3}
                    value={s.value}
                    onChange={(e) => handleChange(s.key, e.target.value)}
                  />
                ) : s.type === "boolean" ? (
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-border text-navy focus:ring-2 focus:ring-navy/30"
                      checked={s.value === "true"}
                      onChange={() => handleToggle(s.key)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {s.value === "true" ? "Enabled" : "Disabled"}
                    </span>
                  </label>
                ) : s.type === "number" ? (
                  <input
                    type="number"
                    className={inputCls}
                    min={0}
                    step={1}
                    value={s.value}
                    onChange={(e) => handleChange(s.key, e.target.value)}
                  />
                ) : (
                  <input
                    type={s.type === "url" ? "url" : "text"}
                    className={inputCls}
                    value={s.value}
                    onChange={(e) => handleChange(s.key, e.target.value)}
                  />
                )}
              </Field>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Secret values (API keys, passwords) are never shown here. Only safe, public-facing settings are editable.
          </p>
        </Card>
      )}
    </AdminLayout>
  );
}
