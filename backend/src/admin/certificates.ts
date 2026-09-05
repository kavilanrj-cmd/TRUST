// Admin certification document management.
// Certificates are stored in the existing storage backend (S3 in production,
// local disk in dev); only metadata lives in the database. Draft/unpublished
// certificates are never visible on the public site. Replacements store the
// new file first, then delete the old object; deletions remove the DB row
// first (and only then best-effort the storage object) so no orphaned pointer
// can ever resolve to a missing file.
import { Router, Request, Response } from "express";
import multer from "multer";
import prisma from "../utils/db";
import { authenticate, requirePermission } from "../utils/auth";
import { PERMISSIONS } from "../utils/roles";
import { auditContextFromRequest, logAudit } from "../utils/audit";
import {
  getDocumentBuffer,
  deleteDocumentObject,
  safeFileName,
  saveDocumentBuffer,
  getDocumentBucket,
} from "../utils/storage";

const router = Router();

const CERTIFICATE_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_CERT_SIZE = 20 * 1024 * 1024; // 20MB

const certificateUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_CERT_SIZE, files: 1 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb) => {
    if (CERTIFICATE_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Allowed: PDF, JPG, PNG, WEBP"));
    }
  },
});

const certSelect = {
  id: true,
  title: true,
  fileType: true,
  fileSize: true,
  originalFileName: true,
  isPublished: true,
  createdAt: true,
  updatedAt: true,
} as const;

// GET /api/admin/certificates — list all certificates (published and draft).
router.get(
  "/certificates",
  authenticate,
  requirePermission(PERMISSIONS.media_manage),
  async (_req: Request, res: Response) => {
    try {
      const certificates = await prisma.certificate.findMany({
        select: certSelect,
        orderBy: { createdAt: "desc" },
      });
      return res.json({ certificates });
    } catch (error) {
      console.error("Admin list certificates error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/admin/certificates/:id/file — secure preview/download.
router.get(
  "/certificates/:id/file",
  authenticate,
  requirePermission(PERMISSIONS.media_manage),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const certificate = await prisma.certificate.findUnique({
        where: { id },
      });
      if (!certificate) {
        return res.status(404).json({ error: "Certificate not found" });
      }
      const { data } = await getDocumentBuffer(
        certificate.storageKey,
        certificate.storageProvider
      );
      const mime = certificate.fileType || "application/octet-stream";
      const filename = certificate.originalFileName || certificate.title || "certificate";
      const disposition = req.query.download === "1" ? "attachment" : "inline";
      res.setHeader("Content-Type", mime);
      res.setHeader("Content-Disposition", `${disposition}; filename="${filename}"`);
      res.setHeader("Cache-Control", "private, no-store");
      return res.send(data);
    } catch (error) {
      console.error("Admin serve certificate error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/admin/certificates — create a certificate (multipart: file + title).
router.post(
  "/certificates",
  authenticate,
  requirePermission(PERMISSIONS.media_manage),
  certificateUpload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ error: "A certificate file is required" });
      }
      const title = String(req.body?.title || "").trim();
      if (!title) {
        return res.status(400).json({ error: "Certificate title is required" });
      }

      const authUser = (req as any).authUser as { id?: string } | undefined;
      const { storageKey, storageProvider } = await saveDocumentBuffer(
        file.buffer,
        file.mimetype,
        getDocumentBucket(),
        "certificates"
      );

      const certificate = await prisma.certificate.create({
        data: {
          title,
          storageKey,
          storageProvider,
          originalFileName: safeFileName(file.originalname) || title,
          fileType: file.mimetype,
          fileSize: file.size,
          createdById: authUser?.id || null,
        },
      });

      logAudit(auditContextFromRequest(req), "certificate.created", "Certificate", certificate.id, {
        title,
      });

      return res.status(201).json({ message: "Certificate uploaded", certificate });
    } catch (error: any) {
      console.error("Admin create certificate error:", error);
      return res.status(400).json({ error: error.message || "Certificate upload failed" });
    }
  }
);

// PATCH /api/admin/certificates/:id — edit title / publish toggle, and optionally
// replace the file. For multipart requests a new file replaces the old one
// (new object stored first, old object deleted only after the DB row is updated).
router.patch(
  "/certificates/:id",
  authenticate,
  requirePermission(PERMISSIONS.media_manage),
  certificateUpload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const existing = await prisma.certificate.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: "Certificate not found" });
      }

      const title = req.body?.title != null ? String(req.body.title).trim() : undefined;
      if (title === undefined || title === "") {
        return res.status(400).json({ error: "Certificate title is required" });
      }
      const isPublished =
        req.body?.isPublished === undefined
          ? undefined
          : String(req.body.isPublished) === "true";

      const file = (req as any).file;
      if (file) {
        const bucket = getDocumentBucket();
        const { storageKey, storageProvider } = await saveDocumentBuffer(
          file.buffer,
          file.mimetype,
          bucket,
          "certificates"
        );

        const updated = await prisma.certificate.update({
          where: { id },
          data: {
            title: title ?? existing.title,
            storageKey,
            storageProvider,
            originalFileName: safeFileName(file.originalname) || existing.originalFileName,
            fileType: file.mimetype,
            fileSize: file.size,
          },
        });

        // Only now (new object stored + row updated) remove the old file.
        await deleteDocumentObject(
          existing.storageKey,
          existing.storageProvider
        ).catch(() => {});

        logAudit(auditContextFromRequest(req), "certificate.updated", "Certificate", id, {
          title: updated.title,
          fileReplaced: true,
        });
        return res.json({ message: "Certificate updated", certificate: updated });
      }

      const updated = await prisma.certificate.update({
        where: { id },
        data: {
          ...(title !== undefined ? { title } : {}),
          ...(isPublished !== undefined ? { isPublished } : {}),
        },
      });

      logAudit(auditContextFromRequest(req), "certificate.updated", "Certificate", id, {
        title: updated.title,
        isPublished: updated.isPublished,
      });

      return res.json({ message: "Certificate updated", certificate: updated });
    } catch (error: any) {
      console.error("Admin update certificate error:", error);
      return res.status(400).json({ error: error.message || "Certificate update failed" });
    }
  }
);

// DELETE /api/admin/certificates/:id — remove the DB row, then best-effort the
// storage object. The admin UI confirms before calling this endpoint.
router.delete(
  "/certificates/:id",
  authenticate,
  requirePermission(PERMISSIONS.media_manage),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const existing = await prisma.certificate.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: "Certificate not found" });
      }

      await prisma.certificate.delete({ where: { id } });
      await deleteDocumentObject(existing.storageKey, existing.storageProvider).catch(() => {});

      logAudit(auditContextFromRequest(req), "certificate.deleted", "Certificate", id, {
        title: existing.title,
      });

      return res.json({ message: "Certificate deleted" });
    } catch (error) {
      console.error("Admin delete certificate error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;