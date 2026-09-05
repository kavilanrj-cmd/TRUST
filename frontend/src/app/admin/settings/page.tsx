"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, Button, Field, Spinner, ErrorState, pageHeading, inputCls } from "@/components/admin/ui";
import { adminApi } from "@/lib/admin-api";
import { API_BASE_URL } from "@/lib/api";

interface Setting {
  key: string;
  label: string;
  type: string;
  value: string;
}

const PAYMENT_SETTING_KEYS = [
  "app.applicationFeeNotice",
  "app.applicationFee",
  "app.applicationFeeEnabled",
  "app.upiQrUrl",
  "app.upiVpa",
  "app.upiInstructions",
  "app.paymentMethod",
  "app.upiQrKey",
  "app.upiQrMime",
  "app.upiQrProvider",
];

// Convert a stored UTC ISO string into a value a <input type="datetime-local">
// accepts (browser-local "YYYY-MM-DDTHH:mm"). Empty/invalid -> "".
function toLocalInput(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Render a UTC ISO string as a long-form date in the India timezone.
function formatISTDeadline(value: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [qrUploading, setQrUploading] = useState(false);
  const [qrMsg, setQrMsg] = useState("");
  const [qrErr, setQrErr] = useState("");

  // Scholarship application deadline (dedicated section)
  const [deadlineDraft, setDeadlineDraft] = useState("");
  const [deadlineSaving, setDeadlineSaving] = useState(false);
  const [deadlineMsg, setDeadlineMsg] = useState("");
  const deadlineValue = settings.find((s) => s.key === "app.applicationDeadline")?.value || "";

  useEffect(() => {
    adminApi.settings
      .list()
      .then((d) => {
        const rows = d.settings || [];
        setSettings(rows);
        setDeadlineDraft(toLocalInput(rows.find((s: Setting) => s.key === "app.applicationDeadline")?.value || ""));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDeadlineSave = async () => {
    setDeadlineSaving(true);
    setDeadlineMsg("");
    try {
      const iso = deadlineDraft ? new Date(deadlineDraft).toISOString() : "";
      await adminApi.settings.update([{ key: "app.applicationDeadline", value: iso }]);
      setSettings((prev) =>
        prev.map((s) => (s.key === "app.applicationDeadline" ? { ...s, value: iso } : s))
      );
      setDeadlineMsg("Scholarship application deadline saved.");
    } catch (err: any) {
      setDeadlineMsg(err.message || "Failed to save deadline");
    } finally {
      setDeadlineSaving(false);
    }
  };

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

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setQrUploading(true);
    setQrMsg("");
    setQrErr("");
    try {
      const fd = new FormData();
      fd.append("qr", file);
      await adminApi.settings.uploadUpiQr(fd);
      setQrMsg("QR code uploaded. Students will now see this QR code on the payment step.");
      const rows = (await adminApi.settings.list()).settings || [];
      setSettings(rows);
    } catch (err: any) {
      setQrErr(err.message || "Upload failed");
    } finally {
      setQrUploading(false);
    }
  };

  const getSetting = (key: string) => settings.find((s) => s.key === key)?.value || "";
  const paymentSettings = settings.filter((s) => PAYMENT_SETTING_KEYS.includes(s.key));
  const upiQrConfigured = getSetting("app.upiQrKey") !== "";

  return (
    <AdminLayout>
      {pageHeading("Website Settings", "Configure public-facing site details. Secrets are not displayed here.")}

      {!loading && !error && (
        <div className="mb-6">
          <Card
            actions={
              <Button variant="gold" disabled={deadlineSaving} onClick={handleDeadlineSave}>
                {deadlineSaving ? "Saving…" : "Save Deadline"}
              </Button>
            }
          >
            <div className="mb-3">
              <h3 className="text-base font-semibold text-navy dark:text-white">
                Scholarship Application Deadline
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Set the last date and time students can start a new application. Applied in India time (Asia/Kolkata).
              </p>
            </div>

            <Field label="Last Date to Apply (date & time)" hint="app.applicationDeadline">
              <input
                type="datetime-local"
                className={inputCls}
                value={deadlineDraft}
                onChange={(e) => setDeadlineDraft(e.target.value)}
              />
            </Field>

            <div className="mt-3 rounded-lg border border-border bg-gray-50 p-3 text-sm dark:bg-[#131a2e]">
              <span className="font-medium text-navy dark:text-white">Current deadline: </span>
              <span className="text-muted-foreground">
                {deadlineValue ? formatISTDeadline(deadlineValue) : "Not configured"}
              </span>
            </div>

            {deadlineMsg && (
              <p
                className={`mt-3 text-xs ${
                  deadlineMsg === "Scholarship application deadline saved." ? "text-green-600" : "text-red-600"
                }`}
              >
                {deadlineMsg}
              </p>
            )}
          </Card>
        </div>
      )}

      {!loading && !error && (
        <div className="mb-6">
          <Card
            actions={
              <Button variant="gold" disabled={saving} onClick={handleSave}>
                {saving ? "Saving…" : "Save Payment Settings"}
              </Button>
            }
          >
            <div className="mb-3">
              <h3 className="text-base font-semibold text-navy dark:text-white">Payment Settings (UPI)</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Configure the application fee and the UPI options shown to students on the payment step. Upload the QR code that students scan to pay.
              </p>
            </div>

            <div className="space-y-4">
              {paymentSettings
                .filter((s) => s.key === "app.applicationFee" || s.key === "app.applicationFeeEnabled" || s.key === "app.applicationFeeNotice")
                .map((s) => (
                  <Field key={s.key} label={s.label} hint={s.key}>
                    {s.type === "boolean" ? (
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="h-5 w-5 rounded border-border text-navy focus:ring-2 focus:ring-navy/30 dark:text-white"
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
                      <textarea
                        className={inputCls}
                        rows={3}
                        value={s.value}
                        onChange={(e) => handleChange(s.key, e.target.value)}
                      />
                    )}
                  </Field>
                ))}

              <Field label="Payment Method" hint="app.paymentMethod">
                <select
                  className={inputCls}
                  value={getSetting("app.paymentMethod") || "manual_upi"}
                  onChange={(e) => handleChange("app.paymentMethod", e.target.value)}
                >
                  <option value="manual_upi">Manual UPI (scan &amp; pay + verification)</option>
                  <option value="razorpay">Razorpay (online gateway — future)</option>
                </select>
              </Field>

              <Field label="UPI ID / VPA" hint="app.upiVpa">
                <input
                  type="text"
                  className={inputCls}
                  value={getSetting("app.upiVpa")}
                  onChange={(e) => handleChange("app.upiVpa", e.target.value)}
                />
              </Field>

              <Field label="UPI Scan &amp; Pay Instructions" hint="app.upiInstructions">
                <textarea
                  className={inputCls}
                  rows={4}
                  value={getSetting("app.upiInstructions")}
                  onChange={(e) => handleChange("app.upiInstructions", e.target.value)}
                />
              </Field>

              <Field label="UPI QR Image URL (legacy fallback)" hint="app.upiQrUrl">
                <input
                  type="url"
                  className={inputCls}
                  value={getSetting("app.upiQrUrl")}
                  onChange={(e) => handleChange("app.upiQrUrl", e.target.value)}
                />
              </Field>

              <div className="rounded-lg border border-border p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-navy dark:text-white">UPI QR Code</h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {upiQrConfigured
                        ? "QR code uploaded — students scan this to pay. Uploading a new one replaces it."
                        : "No QR code uploaded yet. Students will see a notice until you upload one."}
                    </p>
                  </div>
                  <label className="cursor-pointer">
                    <span className="btn-gold inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60">
                      {qrUploading ? "Uploading…" : "Upload QR Code"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={qrUploading}
                      onChange={handleQrUpload}
                    />
                  </label>
                </div>

                {upiQrConfigured && (
                  <div className="inline-block rounded-lg border border-border bg-white p-3">
                    <img
                      src={`${API_BASE_URL}/api/payments/upi-qr`}
                      alt="UPI QR code preview"
                      className="h-40 w-40 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {qrMsg && <p className="mt-3 text-xs text-green-600">{qrMsg}</p>}
                {qrErr && <p className="mt-3 text-xs text-red-600">{qrErr}</p>}
              </div>
            </div>
          </Card>
        </div>
      )}

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
            {settings
              .filter((s) => s.key !== "app.applicationDeadline" && !PAYMENT_SETTING_KEYS.includes(s.key))
              .map((s) => (
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
                      className="h-5 w-5 rounded border-border text-navy focus:ring-2 focus:ring-navy/30 dark:text-white"
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
                ) : s.type === "datetime" ? (
                  <input
                    type="datetime-local"
                    className={inputCls}
                    value={toLocalInput(s.value)}
                    onChange={(e) => handleChange(s.key, new Date(e.target.value).toISOString())}
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
