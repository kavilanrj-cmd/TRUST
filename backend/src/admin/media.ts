// Admin media library: upload, list, search, usage tracking, delete, secure serving.
import { Router, Request, Response } from "express";
import path from "path";
import fs from "fs";
import prisma from "../utils/db";
import { authenticate, requirePermission } from "../utils/auth";
import { PERMISSIONS } from "../utils/roles";
import { auditContextFromRequest, logAudit } from "../utils/audit";
import {
  imageUpload, generateStorageKey, storageKeyToAbsolutePath,
  ALLOWED_IMAGE_MIMES, deleteFileByKey,
} from "../utils/storage";

const router = Router();

// Determine where an image storageKey is referenced by website content.
export async function findImageUsage(storageKey: string): Promise<Array<{ type: string; ref: string }>> {
  const usage: Array<{ type: string; ref: string }> = [];
  const content = await prisma.siteContent.findMany({ where: { value: { contains: storageKey } } });
  for (const c of content) usage.push({ type: "content", ref: c.key });
  const announcements = await prisma.announcement.findMany({ where: { imageUrl: { contains: storageKey } } });
  for (const a of announcements) usage.push({ type: "announcement", ref: a.title });
  return usage;
}

// GET /api/admin/media  (list with search/filter + usage)
router.get(
  "/media",
  authenticate,
  requirePermission(PERMISSIONS.media_manage),
  async (req: Request, res: Response) => {
    try {
      const { search, type } = req.query;
      const where: any = {};
      if (search) {
        where.OR = [
          { originalName: { contains: search as string, mode: "insensitive" } },
          { filename: { contains: search as string, mode: "insensitive" } },
        ];
      }
      if (type) where.mimeType = type as string;

      const media = await prisma.mediaAsset.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { uploadedBy: { select: { name: true, email: true } } },
      });

      const result = await Promise.all(
        media.map(async (m: any) => ({
          ...m,
          usageCount: (await findImageUsage(m.storageKey)).length,
        }))
      );
      return res.json({ media: result, total: result.length });
    } catch (error) {
      console.error("Admin media list error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/admin/media  (upload)
router.post(
  "/media",
  authenticate,
  requirePermission(PERMISSIONS.media_manage),
  imageUpload.array("files", 20),
  async (req: Request, res: Response) => {
    try {
      const files = (req.files || []) as Express.Multer.File[];
      if (files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }
      const user = (req as any).authUser;
      const created: any[] = [];
      for (const file of files) {
        // Reuse the on-disk filename as the storage key to keep paths stable.
        const storageKey = `media/${file.filename}`;
        const asset = await prisma.mediaAsset.create({
          data: {
            filename: file.filename,
            originalName: file.originalname,
            storageKey,
            mimeType: file.mimetype,
            size: file.size,
            uploadedById: user.id,
          },
        });
        created.push(asset);
      }
      logAudit(auditContextFromRequest(req), "media.uploaded", "MediaAsset", created[0]?.id, { count: created.length });
      return res.status(201).json({ message: "Uploaded", media: created });
    } catch (error: any) {
      console.error("Admin media upload error:", error);
      return res.status(400).json({ error: error.message || "Upload failed" });
    }
  }
);

// GET /api/admin/media/serve/:filename  (secure authenticated image serving)
router.get(
  "/media/serve/:filename",
  authenticate,
  requirePermission(PERMISSIONS.media_manage),
  async (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      const storageKey = `media/${filename}`;
      // Only serve filenames we have on record.
      const asset = await prisma.mediaAsset.findFirst({ where: { storageKey } });
      let absPath = storageKeyToAbsolutePath(storageKey);
      if (!asset && !fs.existsSync(absPath)) {
        return res.status(404).json({ error: "Not found" });
      }
      const mime = asset?.mimeType || "application/octet-stream";
      res.setHeader("Content-Type", mime);
      res.setHeader("Cache-Control", "private, max-age=3600");
      fs.createReadStream(absPath).pipe(res);
    } catch (error) {
      console.error("Admin media serve error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DELETE /api/admin/media/:id — only if not referenced
router.delete(
  "/media/:id",
  authenticate,
  requirePermission(PERMISSIONS.media_manage),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const asset = await prisma.mediaAsset.findUnique({ where: { id } });
      if (!asset) return res.status(404).json({ error: "Media not found" });

      const usage = await findImageUsage(asset.storageKey);
      if (usage.length > 0) {
        return res.status(409).json({
          error: "Image is currently used on the website. Replace the reference before deleting.",
          usage,
        });
      }
      deleteFileByKey(asset.storageKey);
      await prisma.mediaAsset.delete({ where: { id } });
      logAudit(auditContextFromRequest(req), "media.deleted", "MediaAsset", id);
      return res.json({ message: "Media deleted" });
    } catch (error) {
      console.error("Admin media delete error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /api/admin/media/:id — update alt text / metadata
router.patch(
  "/media/:id",
  authenticate,
  requirePermission(PERMISSIONS.media_manage),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { altText } = req.body;
      const asset = await prisma.mediaAsset.findUnique({ where: { id } });
      if (!asset) return res.status(404).json({ error: "Media not found" });
      const updated = await prisma.mediaAsset.update({
        where: { id },
        data: { altText: altText ?? null },
      });
      return res.json({ media: updated });
    } catch (error) {
      console.error("Admin media update error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export { ALLOWED_IMAGE_MIMES, generateStorageKey };
export default router;
