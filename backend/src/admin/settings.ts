// Website settings management: safe configurable values only.
import { Router, Request, Response } from "express";
import fs from "fs";
import prisma from "../utils/db";
import { authenticate, requirePermission } from "../utils/auth";
import { PERMISSIONS } from "../utils/roles";
import { auditContextFromRequest, logAudit } from "../utils/audit";
import { imageUpload, getDocumentBucket, saveDocumentBuffer } from "../utils/storage";
import { UPI_QR_KEY, UPI_QR_MIME_KEY, UPI_QR_PROVIDER_KEY } from "../utils/applicationFee";

const router = Router();

// Only these keys are editable via the UI. Values are never secrets.
export const SAFE_SETTINGS: Record<string, { label: string; type: string }> = {
  "site.trustName": { label: "Trust Name", type: "text" },
  "site.tagline": { label: "Tagline", type: "text" },
  "site.contactEmail": { label: "Contact Email", type: "text" },
  "site.contactPhone": { label: "Contact Phone", type: "text" },
  "site.address": { label: "Address", type: "textarea" },
  "site.foundedYear": { label: "Founded Year", type: "text" },
  "site.facebook": { label: "Facebook URL", type: "url" },
  "site.instagram": { label: "Instagram URL", type: "url" },
  "site.twitter": { label: "Twitter/X URL", type: "url" },
  "app.applicationFeeNotice": { label: "Application Fee Notice", type: "textarea" },
  "app.applicationFee": { label: "Application Fee (₹)", type: "number" },
  "app.applicationFeeEnabled": { label: "Enable Application Fee", type: "boolean" },
  "app.upiQrUrl": { label: "UPI QR Image URL", type: "text" },
  "app.upiVpa": { label: "UPI ID / VPA (e.g. trust@upi)", type: "text" },
  "app.upiInstructions": { label: "UPI Scan & Pay Instructions", type: "textarea" },
  "app.paymentMethod": { label: "Payment Method", type: "text" },
  "app.upiQrKey": { label: "UPI QR Storage Key", type: "text" },
  "app.upiQrMime": { label: "UPI QR MIME", type: "text" },
  "app.upiQrProvider": { label: "UPI QR Provider", type: "text" },
  "app.applicationDeadline": { label: "Scholarship Application Deadline (datetime)", type: "datetime" },
  "app.supportEmail": { label: "Support Email", type: "text" },
};

const SAFE_KEYS = Object.keys(SAFE_SETTINGS);

// GET /api/admin/settings — list safe settings (never return isSecret values)
router.get(
  "/settings",
  authenticate,
  requirePermission(PERMISSIONS.settings_manage),
  async (_req: Request, res: Response) => {
    try {
      const rows = await prisma.websiteSetting.findMany({
        where: { key: { in: SAFE_KEYS } },
      });
      const map: Record<string, string> = {};
      for (const r of rows) {
        if (!r.isSecret) map[r.key] = r.value || "";
      }
      const settings = SAFE_KEYS.map((key) => ({
        key,
        label: SAFE_SETTINGS[key].label,
        type: SAFE_SETTINGS[key].type,
        value: map[key] || "",
      }));
      return res.json({ settings });
    } catch (error) {
      console.error("Admin settings error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /api/admin/settings — update safe settings only
router.patch(
  "/settings",
  authenticate,
  requirePermission(PERMISSIONS.settings_manage),
  async (req: Request, res: Response) => {
    try {
      const { updates } = req.body as { updates: Array<{ key: string; value: string }> };
      if (!Array.isArray(updates)) return res.status(400).json({ error: "Invalid payload" });
      const user = (req as any).authUser;
      const allowed = new Set(SAFE_KEYS);
      let changed = 0;
      for (const u of updates) {
        if (!allowed.has(u.key)) continue; // never allow arbitrary keys
        await prisma.websiteSetting.upsert({
          where: { key: u.key },
          create: {
            key: u.key,
            value: String(u.value),
            label: SAFE_SETTINGS[u.key].label,
            type: SAFE_SETTINGS[u.key].type,
            updatedById: user.id,
          },
          update: { value: String(u.value), updatedById: user.id, updatedAt: new Date() },
        });
        changed++;
      }
      logAudit(auditContextFromRequest(req), "settings.updated", undefined, undefined, { keys: updates.map((u) => u.key) });
      return res.json({ message: `Updated ${changed} setting(s)` });
    } catch (error) {
      console.error("Admin update settings error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/admin/settings/upi-qr
// Upload a new UPI QR image. Persists the binary to the configured storage
// backend (S3 in production, local disk in dev) and records the storageKey +
// mime + provider as WebsiteSetting rows that the authenticated QR endpoint
// (/api/payments/upi-qr) serves. Only authenticated staff can replace the QR.
router.post(
  "/settings/upi-qr",
  authenticate,
  requirePermission(PERMISSIONS.settings_manage),
  imageUpload.single("qr"),
  async (req: Request, res: Response) => {
    try {
      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      // imageUpload uses multer disk-storage, so the bytes live at file.path
      // (file.buffer is undefined for disk storage). Read them into memory so
      // they can be persisted via saveDocumentBuffer to S3/local storage.
      const buffer = fs.readFileSync(file.path);
      const { storageKey, storageProvider } = await saveDocumentBuffer(
        buffer,
        file.mimetype,
        getDocumentBucket(),
        "upi-qr"
      );

      const mime = file.mimetype;
      const provider = storageProvider;

      const setRow = async (key: string, value: string, label: string, type: string) => {
        await prisma.websiteSetting.upsert({
          where: { key },
          create: { key, value, label, type },
          update: { value, updatedAt: new Date() },
        });
      };

      await setRow(UPI_QR_KEY, storageKey, "UPI QR Storage Key", "text");
      await setRow(UPI_QR_MIME_KEY, mime, "UPI QR MIME", "text");
      await setRow(UPI_QR_PROVIDER_KEY, provider, "UPI QR Provider", "text");

      const user = (req as any).authUser;
      logAudit(auditContextFromRequest(req), "settings.upi_qr_upload", undefined, undefined, {
        storageKey,
      });

      return res.status(201).json({
        message: "UPI QR code uploaded successfully",
        qrUrl: "/api/payments/upi-qr",
      });
    } catch (error: any) {
      console.error("Admin UPI QR upload error:", error);
      return res.status(400).json({ error: error.message || "Upload failed" });
    }
  }
);

export default router;
