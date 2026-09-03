// Media storage layer.
// Default storage is local disk for the running instance. R2 object storage
// can be substituted behind the same interface. Only image/path metadata is
// stored in the database — binary files live in the storage backend, never
// in the DB.

import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";
import { Request } from "express";

const STORAGE_MODE = process.env.MEDIA_STORAGE || "local";
export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "uploads");

// Allowed image MIME types and their extensions.
export const ALLOWED_IMAGE_MIMES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

// Document MIME types allowed for scholarship application documents.
export const ALLOWED_DOC_MIMES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB
export const MAX_DOC_SIZE = 50 * 1024 * 1024; // 50MB

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Sanitize an untrusted filename (prevents path traversal).
export function safeFileName(name: string): string {
  return path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "_");
}

// Generate a random storage key (never uses user-controlled path components).
export function generateStorageKey(folder: string, mime: string): string {
  const ext = ALLOWED_IMAGE_MIMES[mime] || path.extname(mime).replace(".", "") || "bin";
  const id = crypto.randomBytes(16).toString("hex");
  return `${folder}/${id}.${ext}`;
}

export function storageKeyToAbsolutePath(rawKey: string): string {
  // Reject any attempt to escape the upload root (path traversal protection).
  const normalized = path.normalize(rawKey).replace(/^([.][.][/\\])+/, "");
  if (normalized.includes("..") || path.isAbsolute(normalized)) {
    throw new Error("Invalid storage key");
  }
  return path.join(UPLOAD_DIR, normalized);
}

// Multer disk storage for image uploads.
export const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      ensureDir(path.join(UPLOAD_DIR, "media"));
      cb(null, path.join(UPLOAD_DIR, "media"));
    },
    filename: (_req, file, cb) => {
      const ext = ALLOWED_IMAGE_MIMES[file.mimetype] || ".bin";
      const id = crypto.randomBytes(16).toString("hex");
      cb(null, id + ext);
    },
  }),
  limits: { fileSize: MAX_IMAGE_SIZE, files: 20 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb) => {
    if (file.mimetype in ALLOWED_IMAGE_MIMES) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"));
    }
  },
});

// Multer disk storage for application documents.
export const documentUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      ensureDir(path.join(UPLOAD_DIR, "documents"));
      cb(null, path.join(UPLOAD_DIR, "documents"));
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(safeFileName(file.originalname));
      const id = crypto.randomBytes(16).toString("hex");
      cb(null, id + ext);
    },
  }),
  limits: { fileSize: MAX_DOC_SIZE, files: 4 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb) => {
    if (ALLOWED_DOC_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported document type"));
    }
  },
});

export function saveBufferAsImage(
  folder: string,
  mime: string,
  buffer: Buffer
): { storageKey: string; absPath: string } {
  const storageKey = generateStorageKey(folder, mime);
  const absPath = storageKeyToAbsolutePath(storageKey);
  ensureDir(path.dirname(absPath));
  fs.writeFileSync(absPath, buffer);
  return { storageKey, absPath };
}

export function deleteFileByKey(storageKey: string): boolean {
  try {
    const absPath = storageKeyToAbsolutePath(storageKey);
    if (fs.existsSync(absPath)) {
      fs.unlinkSync(absPath);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

export function fileExists(storageKey: string): boolean {
  try {
    return fs.existsSync(storageKeyToAbsolutePath(storageKey));
  } catch {
    return false;
  }
}

export { STORAGE_MODE };
