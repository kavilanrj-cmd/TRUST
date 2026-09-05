// CMS website content management: draft/publish/preview/versioning/restore.
import { Router, Request, Response } from "express";
import prisma from "../utils/db";
import { authenticate, requirePermission, managementRoles } from "../utils/auth";
import { PERMISSIONS } from "../utils/roles";
import { CONTENT_REGISTRY, validateContentValue, defaultValueFor } from "../utils/contentRegistry";
import { auditContextFromRequest, logAudit } from "../utils/audit";

const router = Router();
const routerPublic = Router();

// Ensure SiteContent rows exist for all registry keys (seed on demand, non-destructive).
// Also updates existing rows that still have the old registry default values.
export async function seedSiteContentIfNeeded(): Promise<void> {
  try {
    const existing = await prisma.siteContent.findMany({ select: { key: true, value: true } });
    const existingMap = new Map(existing.map((c: any) => [c.key, c.value]));

    // Create missing keys
    const missingKeys = CONTENT_REGISTRY.filter((c) => !existingMap.has(c.key));
    if (missingKeys.length > 0) {
      await prisma.siteContent.createMany({
        data: missingKeys.map((c) => ({
          key: c.key,
          page: c.page,
          section: c.section,
          label: c.label,
          type: c.type === "image" ? "image" : c.type === "rich" ? "rich" : "text",
          value: c.defaultValue,
          draftValue: null,
          maxLength: c.maxLength ?? null,
          editable: c.editable,
        })),
      });
    }

    // Update existing keys that still have the OLD default value (from previous registry versions)
    // This fixes stale content in production without requiring manual DB updates
    const oldDefaults: Record<string, string> = {
      "about.title": "About Neelakannu Educational Trust",
      "about.phone": "94443 27336",
      "about.founder": "Prof. Dr. K. Chidambaram",
    };

    for (const [key, oldDefault] of Object.entries(oldDefaults)) {
      const currentValue = existingMap.get(key);
      const newDefault = CONTENT_REGISTRY.find((c) => c.key === key)?.defaultValue;
      if (currentValue === oldDefault && newDefault && newDefault !== oldDefault) {
        await prisma.siteContent.update({
          where: { key },
          data: { value: newDefault },
        });
      }
    }
  } catch (e) {
    console.error("Seed site content failed (non-fatal):", e);
  }
}

// Build the published content map (value or default), merging with registry.
export async function getPublishedContentMap(): Promise<Record<string, string>> {
  const rows = await prisma.siteContent.findMany({ select: { key: true, value: true } });
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value ?? defaultValueFor(r.key);
  for (const c of CONTENT_REGISTRY) {
    if (!(c.key in map)) map[c.key] = c.defaultValue;
  }
  return map;
}

// PUBLIC — GET /api/content/published  (no auth; used by the public website)
routerPublic.get("/published", async (_req: Request, res: Response) => {
  try {
    const content = await getPublishedContentMap();
    return res.json({ content });
  } catch (error) {
    console.error("Published content error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ===== Admin endpoints =====

// GET /api/admin/website/content — full registry with values + drafts
router.get(
  "/website/content",
  authenticate,
  requirePermission(PERMISSIONS.website_edit),
  async (_req: Request, res: Response) => {
    try {
      await seedSiteContentIfNeeded();
      const rows = await prisma.siteContent.findMany({
        where: { editable: true },
        orderBy: { page: "asc" },
      });
      const byKey: Record<string, any> = {};
      for (const r of rows) byKey[r.key] = r;

      const fields = CONTENT_REGISTRY.map((def) => {
        const row = byKey[def.key];
        return {
          key: def.key,
          page: def.page,
          section: def.section,
          type: def.type,
          label: def.label,
          help: def.help,
          editable: def.editable,
          maxLength: def.maxLength,
          value: row ? row.value : def.defaultValue,
          draftValue: row ? row.draftValue : null,
          lastPublishedAt: row ? row.lastPublishedAt : null,
        };
      });
      return res.json({ fields, registry: CONTENT_REGISTRY });
    } catch (error) {
      console.error("Admin website content error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/admin/website/preview — draft values only (preview as unpublished)
router.get(
  "/website/preview",
  authenticate,
  requirePermission(PERMISSIONS.website_preview),
  async (_req: Request, res: Response) => {
    try {
      await seedSiteContentIfNeeded();
      const rows = await prisma.siteContent.findMany({
        where: { editable: true, draftValue: { not: null } },
      });
      const drafts: Record<string, string> = {};
      for (const r of rows) drafts[r.key] = r.draftValue as string;
      return res.json({ draft: drafts });
    } catch (error) {
      console.error("Admin website preview error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /api/admin/website/content — save draft value(s). Never publishes.
router.patch(
  "/website/content",
  authenticate,
  requirePermission(PERMISSIONS.website_edit),
  async (req: Request, res: Response) => {
    try {
      await seedSiteContentIfNeeded();
      const { updates } = req.body as {
        updates: Array<{ key: string; value: string }>;
      };
      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ error: "No updates provided" });
      }
      const user = (req as any).authUser;
      const applied: { key: string; value: string }[] = [];
      const errors: { key: string; error: string }[] = [];

      for (const u of updates) {
        const err = validateContentValue(u.key, u.value);
        if (err) {
          errors.push({ key: u.key, error: err });
          continue;
        }
        await prisma.siteContent.upsert({
          where: { key: u.key },
          create: {
            key: u.key,
            page: "home",
            type: "text",
            editable: true,
            value: defaultValueFor(u.key),
            draftValue: u.value,
          },
          update: { draftValue: u.value, updatedById: user.id },
        });
        applied.push({ key: u.key, value: u.value });
      }

      if (applied.length) {
        logAudit(auditContextFromRequest(req), "website.content_edited_draft", "SiteContent", undefined, {
          keys: applied.map((a) => a.key),
        });
      }
      if (errors.length) {
        return res.status(400).json({ error: "Some values could not be saved", errors });
      }
      return res.json({ message: "Draft saved", applied });
    } catch (error) {
      console.error("Admin save website content error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/admin/website/publish — promote drafts to published, create version snapshots.
router.post(
  "/website/publish",
  authenticate,
  requirePermission(PERMISSIONS.website_publish),
  async (req: Request, res: Response) => {
    try {
      await seedSiteContentIfNeeded();
      const user = (req as any).authUser;
      const changed = await prisma.siteContent.findMany({
        where: { editable: true, draftValue: { not: null } },
      });
      if (changed.length === 0) {
        return res.status(400).json({ error: "No draft changes to publish" });
      }

      const changedKeys = new Set(changed.map((c: any) => c.key));

      // Create immutable version snapshots for each changed item.
      for (const c of changed) {
        const prev = c.value;
        const next = c.draftValue as string;
        const lastVersion = await prisma.contentVersion.findFirst({
          where: { siteContentId: c.id },
          orderBy: { versionNumber: "desc" },
          select: { versionNumber: true },
        });
        await prisma.contentVersion.create({
          data: {
            siteContentId: c.id,
            versionNumber: (lastVersion?.versionNumber || 0) + 1,
            value: next,
            changedById: user.id,
            editedByName: user.name || user.email,
            summary: prev === null ? `Published initial content` : `Published change to ${c.key}`,
          },
        });
      }

      // Promote drafts to published (per-row loop below; updateMany can't compute
      // value = draftValue across rows reliably).
      for (const c of changed) {
        await prisma.siteContent.update({
          where: { id: c.id },
          data: {
            value: c.draftValue as string,
            draftValue: null,
            lastPublishedAt: new Date(),
            publishedBy: user.name || user.email,
            updatedById: user.id,
          },
        });
      }

      logAudit(auditContextFromRequest(req), "website.published", "SiteContent", undefined, {
        keys: Array.from(changedKeys),
        count: changed.length,
      });

      return res.json({
        message: `Published ${changed.length} change(s)`,
        published: Array.from(changedKeys),
      });
    } catch (error) {
      console.error("Admin publish website error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/admin/website/content/:key/versions — version history for a field
router.get(
  "/website/content/:key/versions",
  authenticate,
  requirePermission(PERMISSIONS.website_history),
  async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const content = await prisma.siteContent.findUnique({ where: { key } });
      if (!content) return res.status(404).json({ error: "Content key not found" });
      const versions = await prisma.contentVersion.findMany({
        where: { siteContentId: content.id },
        orderBy: { versionNumber: "desc" },
        take: 50,
      });
      return res.json({ versions, current: content.value });
    } catch (error) {
      console.error("Admin content versions error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/admin/website/content/:key/restore — restore a version (creates NEW version)
router.post(
  "/website/content/:key/restore",
  authenticate,
  requirePermission(PERMISSIONS.website_publish),
  async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const { versionId } = req.body;
      const content = await prisma.siteContent.findUnique({ where: { key } });
      if (!content) return res.status(404).json({ error: "Content key not found" });
      const version = await prisma.contentVersion.findUnique({ where: { id: versionId } });
      if (!version) return res.status(404).json({ error: "Version not found" });

      // Restore sets the draft to the historical value (does not destroy history).
      await prisma.siteContent.update({
        where: { id: content.id },
        data: { draftValue: version.value, updatedById: (req as any).authUser.id },
      });
      logAudit(auditContextFromRequest(req), "website.version_restored", "SiteContent", content.id, { key, version: version.versionNumber });
      return res.json({
        message: "Version restored as draft. Publish to make it live.",
        draftValue: version.value,
      });
    } catch (error) {
      console.error("Admin content restore error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export { routerPublic };
export default router;
