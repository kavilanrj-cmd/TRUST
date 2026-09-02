"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

const REQUIRED_DOCUMENTS = [
  { key: "sslc", label: "SSLC", desc: "Upload your SSLC certificate" },
  { key: "hsc", label: "HSC", desc: "Upload your HSC certificate" },
  { key: "currentSemesterMarksheet", label: "Current Semester Marksheet", desc: "Upload your current semester marksheet" },
  { key: "bonafide", label: "Bonafide Certificate", desc: "Upload a bonafide certificate from your institution" },
  { key: "idCard", label: "ID Card", desc: "Upload a copy of your ID card" },
  { key: "community", label: "Community Certificate", desc: "Upload your community certificate" },
  { key: "income", label: "Income Certificate", desc: "Upload your family income certificate" },
  { key: "pan", label: "PAN", desc: "Upload a copy of your PAN card" },
  { key: "aadhar", label: "Aadhar", desc: "Upload a copy of your Aadhar card" },
  { key: "bankPassbook", label: "Bank Passbook (Student Account)", desc: "Upload a copy of your bank passbook" },
  { key: "disability", label: "Disability Certificate", desc: "Upload a disability certificate if applicable" },
  { key: "sports", label: "Sports Certificate", desc: "Upload a sports certificate if applicable" },
];

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB for images

type DocState = { name: string; size: number; type: string; uploading: boolean; uploaded: boolean };

function errorMessageFor(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Invalid file type. Allowed types: jpeg, png, gif, pdf, doc, docx.";
  }
  const isImage = file.type.startsWith("image/");
  const limit = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;
  if (file.size > limit) {
    return `File too large. ${isImage ? "Images" : "Documents"} must be under ${Math.round(
      limit / (1024 * 1024)
    )}MB.`;
  }
  return null;
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

const ICONS: Record<string, string> = {
  sslc: "🎓",
  hsc: "📘",
  currentSemesterMarksheet: "📋",
  bonafide: "🏫",
  idCard: "🪪",
  community: "🗂️",
  income: "📈",
  pan: "💳",
  aadhar: "🪪",
  bankPassbook: "🏦",
  disability: "♿",
  sports: "🏆",
};

export function DocumentUpload({
  applicationId,
  onCountChange,
}: {
  applicationId: string | null;
  onCountChange?: (count: number) => void;
}) {
  const [files, setFiles] = useState<Record<string, DocState | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const updateCount = useCallback(
    (next: Record<string, DocState | null>) => {
      onCountChange?.(Object.values(next).filter(Boolean).length);
    },
    [onCountChange]
  );

  const uploadFile = useCallback(
    async (key: string, file: File) => {
      if (!applicationId) return;
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("documentType", key);
        const res = await fetch(
          `${API_BASE_URL}/api/applications/${applicationId}/upload`,
          {
            method: "POST",
            credentials: "include",
            body: fd,
          }
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Upload failed");
        }
        setFiles((prev) => {
          const cur = prev[key];
          const next = {
            ...prev,
            [key]: cur ? { ...cur, uploading: false, uploaded: true } : cur,
          };
          updateCount(next);
          return next;
        });
      } catch (err) {
        setErrors((prev) => ({
          ...prev,
          [key]: err instanceof Error ? err.message : "Upload failed. Please try again.",
        }));
        setFiles((prev) => {
          const cur = prev[key];
          const next = {
            ...prev,
            [key]: cur ? { ...cur, uploading: false } : cur,
          };
          updateCount(next);
          return next;
        });
      }
    },
    [applicationId, updateCount]
  );

  const handleChange = useCallback(
    (key: string, file: File | null) => {
      setErrors((prev) => ({ ...prev, [key]: "" }));
      if (!file) {
        setFiles((prev) => {
          const next = { ...prev, [key]: null };
          updateCount(next);
          return next;
        });
        return;
      }
      const err = errorMessageFor(file);
      if (err) {
        setErrors((prev) => ({ ...prev, [key]: err }));
        setFiles((prev) => {
          const next = { ...prev, [key]: null };
          updateCount(next);
          return next;
        });
        if (inputRefs.current[key]) {
          inputRefs.current[key]!.value = "";
        }
        return;
      }
      setFiles((prev) => {
        const next = {
          ...prev,
          [key]: { name: file.name, size: file.size, type: file.type, uploading: true, uploaded: false },
        };
        updateCount(next);
        return next;
      });
      void uploadFile(key, file);
    },
    [uploadFile, updateCount]
  );

  const removeFile = useCallback(
    (key: string) => {
      setFiles((prev) => {
        const next = { ...prev, [key]: null };
        updateCount(next);
        return next;
      });
      setErrors((prev) => ({ ...prev, [key]: "" }));
      if (inputRefs.current[key]) {
        inputRefs.current[key]!.value = "";
      }
    },
    [updateCount]
  );

  const uploadedCount = useMemo(
    () => Object.values(files).filter(Boolean).length,
    [files]
  );

  return (
    <div>
      <div className="mb-5 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-base font-semibold text-navy dark:text-white">Upload Required Documents</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload clear and readable copies of the required documents.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold-soft px-3 py-1 text-xs font-semibold text-navy-800">
          <span aria-hidden="true">📄</span>
          {uploadedCount} of {REQUIRED_DOCUMENTS.length} uploaded
        </span>
      </div>

      <p className="mb-5 text-xs text-muted-foreground">
        Allowed file types: jpeg, png, gif, pdf, doc, docx. Images up to 8MB, other documents up to 50MB.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {REQUIRED_DOCUMENTS.map((doc) => {
          const file = files[doc.key];
          const error = errors[doc.key];
          return (
            <div
              key={doc.key}
              className={`rounded-xl border p-4 transition ${
                file
                  ? "border-success/40 bg-success/5"
                  : error
                    ? "border-destructive/40 bg-destructive/5"
                    : "border-border bg-surface-muted"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl ${
                    file ? "bg-success/15" : "bg-navy-50"
                  }`}
                  aria-hidden="true"
                >
                  {ICONS[doc.key] || "📄"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-navy dark:text-white">{doc.label}</span>
                    {file && file.uploading && (
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">
                        Uploading…
                      </span>
                    )}
                    {file && file.uploaded && (
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-success">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Uploaded
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{doc.desc}</p>

                  {file ? (
                    <div className="mt-3 rounded-lg border border-border bg-white dark:bg-[#131a2e] px-3 py-2">
                      <p className="truncate text-xs font-medium text-foreground" title={file.name}>
                        {file.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {file.type || "Unknown type"} · {formatFileSize(file.size)}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => inputRefs.current[doc.key]?.click()}
                          className="text-xs font-medium text-navy underline underline-offset-2 hover:text-navy-700 dark:text-gold dark:hover:text-gold"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFile(doc.key)}
                          className="text-xs font-medium text-destructive underline underline-offset-2 hover:text-destructive/80"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-white dark:bg-[#131a2e] px-3 py-2 text-xs font-medium text-navy dark:text-white hover:border-navy/40 hover:bg-muted">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Choose File
                    </label>
                  )}

                  <input
                    ref={(el) => {
                      inputRefs.current[doc.key] = el;
                    }}
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
                    onChange={(e) => handleChange(doc.key, e.target.files?.[0] ?? null)}
                    className="sr-only"
                    aria-label={`Upload ${doc.label}`}
                  />

                  {error && (
                    <p className="mt-2 text-xs text-destructive" role="alert">
                      {error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {uploadedCount > 0 && (
        <p className="mt-4 text-xs text-muted-foreground">
          Documents are uploaded securely to your application as you select them.
        </p>
      )}
    </div>
  );
}
