// Admin document verification + secure (authenticated) document access.
import { Router, Request, Response } from "express";
import path from "path";
import fs from "fs";
import prisma from "../utils/db";
import { authenticate, requirePermission } from "../utils/auth";
import { PERMISSIONS } from "../utils/roles";
import { auditContextFromRequest, logAudit } from "../utils/audit";
import { storageKeyToAbsolutePath } from "../utils/storage";

const router = Router();

const MIME_LOOKUP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

// GET /api/admin/documents/:id/access — secure download (admin only)
router.get(
  "/:id/access",
  authenticate,
  requirePermission(PERMISSIONS.documents_download),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const doc = await prisma.applicationDocument.findUnique({
        where: { id },
        include: { application: { include: { student: { select: { name: true } } } } },
      });
      if (!doc) return res.status(404).json({ error: "Document not found" });

      let absPath: string;
      try {
        absPath = storageKeyToAbsolutePath(doc.storageKey);
      } catch {
        return res.status(400).json({ error: "Invalid document path" });
      }
      if (!fs.existsSync(absPath)) {
        return res.status(404).json({ error: "File no longer exists" });
      }

      logAudit(auditContextFromRequest(req), "document.downloaded", "ApplicationDocument", id);

      const ext = path.extname(doc.originalFilename || doc.storageKey).toLowerCase();
      const mime = MIME_LOOKUP[ext] || doc.fileType || "application/octet-stream";
      res.setHeader("Content-Type", mime);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${doc.originalFilename || path.basename(doc.storageKey)}"`
      );
      fs.createReadStream(absPath).pipe(res);
    } catch (error) {
      console.error("Admin document access error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /api/admin/documents/:id/verify — mark verified / rejected / request re-upload
router.patch(
  "/:id/verify",
  authenticate,
  requirePermission(PERMISSIONS.documents_verify),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, note } = req.body;
      const valid = ["VERIFIED", "REJECTED", "RE_UPLOAD_REQUESTED", "PENDING"];
      if (!status || !valid.includes(status)) {
        return res.status(400).json({ error: "Invalid verification status" });
      }
      if ((status === "REJECTED" || status === "RE_UPLOAD_REQUESTED") && !note) {
        return res.status(400).json({ error: "A reason is required for this action" });
      }
      const doc = await prisma.applicationDocument.findUnique({ where: { id } });
      if (!doc) return res.status(404).json({ error: "Document not found" });

      const user = (req as any).authUser;
      const updated = await prisma.applicationDocument.update({
        where: { id },
        data: {
          verificationStatus: status,
          verificationNote: note || null,
          verifiedById: user.id,
          verifiedAt: new Date(),
        },
      });

      // application activity timeline
      await prisma.applicationActivity.create({
        data: {
          applicationId: doc.applicationId,
          actorId: user.id,
          actorName: user.name || user.email,
          action: "document." + status.toLowerCase(),
          metadata: { documentId: doc.id, note },
        },
      });
      logAudit(auditContextFromRequest(req), "document.verify", "ApplicationDocument", id, { status });

      return res.json({ message: "Document updated", document: updated });
    } catch (error) {
      console.error("Admin document verify error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
