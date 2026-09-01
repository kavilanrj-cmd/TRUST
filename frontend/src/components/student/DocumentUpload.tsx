"use client";

import { useCallback, useMemo, useRef, useState } from "react";

const REQUIRED_DOCUMENTS = [
  { key: "sslc", label: "SSLC", desc: "Upload your SSLC certificate" },
  { key: "hsc", label: "HSC", desc: "Upload your HSC certificate" },
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

type DocFile = { name: string; size: number; type: string };

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

export function DocumentUpload({ onCountChange }: { onCountChange?: (count: number) => void }) {
  const [files, setFiles] = useState<Record<string, DocFile | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleChange = useCallback(
    (key: string, file: File | null) => {
      setErrors((prev) => ({ ...prev, [key]: "" }));
      if (!file) {
        setFiles((prev) => {
          const next = { ...prev, [key]: null };
          onCountChange?.(Object.values(next).filter(Boolean).length);
          return next;
        });
        return;
      }
      const err = errorMessageFor(file);
      if (err) {
        setErrors((prev) => ({ ...prev, [key]: err }));
        setFiles((prev) => ({ ...prev, [key]: null }));
        if (inputRefs.current[key]) {
          inputRefs.current[key]!.value = "";
        }
        return;
      }
      setFiles((prev) => {
        const next = {
          ...prev,
          [key]: { name: file.name, size: file.size, type: file.type },
        };
        onCountChange?.(Object.values(next).filter(Boolean).length);
        return next;
      });
    },
    [onCountChange]
  );

  const removeFile = useCallback(
    (key: string) => {
      setFiles((prev) => {
        const next = { ...prev, [key]: null };
        onCountChange?.(Object.values(next).filter(Boolean).length);
        return next;
      });
      setErrors((prev) => ({ ...prev, [key]: "" }));
      if (inputRefs.current[key]) {
        inputRefs.current[key]!.value = "";
      }
    },
    [onCountChange]
  );

  const uploadedCount = useMemo(
    () => Object.values(files).filter(Boolean).length,
    [files]
  );

  return (
    <div>
      <div className="mb-5 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-base font-semibold text-navy">Upload Required Documents</h3>
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
                    <span className="text-sm font-semibold text-navy">{doc.label}</span>
                    {file && (
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
                    <div className="mt-3 rounded-lg border border-border bg-white px-3 py-2">
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
                          className="text-xs font-medium text-navy underline underline-offset-2 hover:text-navy-700"
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
                    <label className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-navy hover:border-navy/40 hover:bg-muted">
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
          Selected documents will be uploaded with your application before submission.
        </p>
      )}
    </div>
  );
}
