// Media storage layer.
// Default storage is local disk (for local development). In production the
// backend runs on Vercel serverless where the local filesystem is read-only
// and ephemeral, so documents are stored in Amazon S3 instead. Only
// metadata (storageKey/provider/etc.) is stored in the database — binary
// files live in the storage backend, never in the DB.
//
// Storage mode is chosen via MEDIA_STORAGE:
//   "local" (default, dev)  -> writes to UPLOAD_DIR on disk
//   "s3"                    -> writes to the configured S3 bucket

import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";
import { Request } from "express";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

const STORAGE_MODE = (process.env.MEDIA_STORAGE || "local").toLowerCase();
export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "uploads");

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

// Lazy singleton S3 client (never reads credentials from source; uses env).
let s3Client: S3Client | null = null;
function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: getEnv("AWS_REGION"),
      credentials: {
        accessKeyId: getEnv("AWS_ACCESS_KEY_ID"),
        secretAccessKey: getEnv("AWS_SECRET_ACCESS_KEY"),
      },
    });
  }
  return s3Client;
}

export function getDocumentBucket(): string {
  return getEnv("AWS_BUCKET_NAME");
}

export function isS3Mode(): boolean {
  return STORAGE_MODE === "s3";
}

// Persist a document buffer to the current storage backend.
// Returns the object key and the provider name stored in the database.
// The folder prefix (default "documents") keeps unrelated object types
// (certificates, payment screenshots, etc.) separated in the storage backend.
export async function saveDocumentBuffer(
  buffer: Buffer,
  contentType: string,
  bucket: string,
  folder = "documents"
): Promise<{ storageKey: string; storageProvider: string }> {
  if (isS3Mode()) {
    const key = `${folder}/${crypto.randomBytes(16).toString("hex")}`;
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    return { storageKey: key, storageProvider: "s3" };
  }
  // Local disk (development only).
  const key = `${folder}/${crypto.randomBytes(16).toString("hex")}`;
  const absPath = storageKeyToAbsolutePath(key);
  ensureDir(path.dirname(absPath));
  fs.writeFileSync(absPath, buffer);
  return { storageKey: key, storageProvider: "local" };
}

export async function deleteDocumentObject(storageKey: string, storageProvider: string): Promise<void> {
  if ((storageProvider || "s3").toLowerCase() === "s3" || isS3Mode()) {
    if (storageKey) {
      await getS3Client().send(
        new DeleteObjectCommand({ Bucket: getDocumentBucket(), Key: storageKey })
      );
    }
    return;
  }
  deleteFileByKey(storageKey);
}

export async function objectExists(storageKey: string, storageProvider: string): Promise<boolean> {
  if ((storageProvider || "s3").toLowerCase() === "s3" || isS3Mode()) {
    try {
      await getS3Client().send(new HeadObjectCommand({ Bucket: getDocumentBucket(), Key: storageKey }));
      return true;
    } catch {
      return false;
    }
  }
  return fileExists(storageKey);
}

// Fetch a document's bytes from the current storage backend for secure serving.
export async function getDocumentBuffer(
  storageKey: string,
  storageProvider: string
): Promise<{ data: Buffer; contentType: string }> {
  if ((storageProvider || "s3").toLowerCase() === "s3" || isS3Mode()) {
    const resp = await getS3Client().send(
      new GetObjectCommand({ Bucket: getDocumentBucket(), Key: storageKey })
    );
    if (!resp.Body) {
      throw new Error("Document body is empty or unavailable");
    }
    const bytes = await resp.Body.transformToByteArray();
    return {
      data: Buffer.from(bytes),
      contentType: resp.ContentType || "application/octet-stream",
    };
  }
  const absPath = storageKeyToAbsolutePath(storageKey);
  const data = fs.readFileSync(absPath);
  return { data, contentType: "application/octet-stream" };
}

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

// Multer disk storage for image uploads. NOTE: unusable on serverless runtimes
// (Vercel read-only /tmp-equivalent: /var/task is read-only), so it is only used
// where a disk path is actually required. Prefer the memory-storage uploads
// below for anything that must persist to S3/local storage.
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

// Memory-storage UPI QR image upload. Keeps the bytes in memory (file.buffer) so
// the route can persist them to S3/local storage via saveDocumentBuffer — disk
// storage would try to mkdir on the read-only serverless filesystem. Accepts the
// same image types as imageUpload.
export const qrUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb) => {
    if (file.mimetype in ALLOWED_IMAGE_MIMES) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"));
    }
  },
});

// Multer storage for application documents. Uses memory storage so uploads
// never need to be written to a (read-only on Vercel) local disk; the route
// persists the buffer to S3 or local disk afterwards via saveDocumentBuffer.
export const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOC_SIZE, files: 4 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb) => {
    if (ALLOWED_DOC_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported document type"));
    }
  },
});

// Payment screenshot uploads (UPI payment proof). Accepts a tighter set of
// file types than general documents and shares the memory-storage approach so
// the binary is persisted to S3/local storage via saveDocumentBuffer.
export const SCREENSHOT_ALLOWED_MIMES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];

export const screenshotUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOC_SIZE, files: 1 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb) => {
    if (SCREENSHOT_ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Allowed: jpeg, png, pdf"));
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
