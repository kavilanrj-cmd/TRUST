// Website settings management: safe configurable values only.
import { Router, Request, Response } from "express";
import prisma from "../utils/db";
import { authenticate, requirePermission } from "../utils/auth";
import { PERMISSIONS } from "../utils/roles";
import { auditContextFromRequest, logAudit } from "../utils/audit";

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
  "app.upiQrUrl": { label: "UPI QR Image URL", type: "url" },
  "app.upiVpa": { label: "UPI ID / VPA (e.g. trust@upi)", type: "text" },
  "app.upiInstructions": { label: "UPI Scan & Pay Instructions", type: "textarea" },
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

export default router;
