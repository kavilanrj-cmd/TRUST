"use client";

import { useCallback, useMemo, useRef, useState } from "react";

const REQUIRED_DOCUMENTS = [
  { key: "sslc", label: "SSLC" },
  { key: "hsc", label: "HSC" },
  { key: "bonafide", label: "Bonafide Certificate" },
  { key: "idCard", label: "ID Card" },
  { key: "community", label: "Community Certificate" },
  { key: "income", label: "Income Certificate" },
  { key: "pan", label: "PAN" },
  { key: "aadhar", label: "Aadhar" },
  { key: "bankPassbook", label: "Bank Passbook (Student Account)" },
  { key: "disability", label: "Disability Certificate" },
  { key: "sports", label: "Sports Certificate" },
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

export function DocumentUpload() {
  const [files, setFiles] = useState<Record<string, DocFile | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleChange = useCallback((key: string, file: File | null) => {
    setErrors((prev) => ({ ...prev, [key]: "" }));
    if (!file) {
      setFiles((prev) => ({ ...prev, [key]: null }));
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
    setFiles((prev) => ({
      ...prev,
      [key]: { name: file.name, size: file.size, type: file.type },
    }));
  }, []);

  const uploadedCount = useMemo(
    () => Object.values(files).filter(Boolean).length,
    [files]
  );

  return (
    <div className="p-6 rounded-lg border border-border bg-card">
      <h3 className="text-xl font-medium mb-1">F. Documents Required</h3>
      <p className="text-sm text-muted-foreground mb-2">
        Please keep soft copies of all required documents ready before uploading. Allowed types:
        jpeg, png, gif, pdf, doc, docx.
      </p>
      <p className="text-sm text-muted-foreground mb-4">
        {uploadedCount} of {REQUIRED_DOCUMENTS.length} documents uploaded.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {REQUIRED_DOCUMENTS.map((doc) => {
          const file = files[doc.key];
          const error = errors[doc.key];
          return (
            <div
              key={doc.key}
              className="rounded-lg border border-gray-200 bg-gray-50 p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{doc.label}</span>
                {file && (
                  <span className="inline-flex items-center gap-1 text-xs text-success">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Uploaded
                  </span>
                )}
              </div>

              <input
                ref={(el) => {
                  inputRefs.current[doc.key] = el;
                }}
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
                onChange={(e) => handleChange(doc.key, e.target.files?.[0] ?? null)}
                className="mt-2 block w-full text-sm text-muted-foreground file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
              />

              {file && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {file.name} · {(file.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              )}
              {!file && !error && (
                <p className="mt-1.5 text-xs text-muted-foreground">No file selected</p>
              )}
              {error && (
                <p className="mt-1.5 text-xs text-destructive">{error}</p>
              )}
            </div>
          );
        })}
      </div>

      {uploadedCount > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Selected documents will be uploaded with your application before submission.
        </p>
      )}
    </div>
  );
}
