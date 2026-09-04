// Document routes for Neelakannu Educational Trust Platform
// Handles: document metadata recording, listing, deletion
// Documents are associated with a student's application. The document "type"
// (e.g. sslc, hsc, currentSemesterMarksheet, bonafide, ...) is stored as a free
// string so any required document type can be attached without schema changes.

import express, { Request, Response } from "express";
import prisma from "../utils/db";
import { ROLES } from "../utils/roles";
import {
  documentUpload,
  safeFileName,
  saveDocumentBuffer,
  deleteDocumentObject,
  getDocumentBucket,
  getDocumentBuffer,
} from "../utils/storage";

const router = express.Router();

const STAFF_ROLES: string[] = [ROLES.FOUNDER, ROLES.ADMIN, ROLES.REVIEWER];

// Allowed MIME types for scholarship documents
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.word-processingml.document",
];

// Maximum file size in bytes (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

// POST /api/applications/:applicationId/documents
// Record document metadata (SSLC, HSC, currentSemesterMarksheet, etc.) for a draft application.
router.post("/:applicationId/documents", async (req: Request, res: Response) => {
  try {
    const applicationId = req.params.applicationId;

    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const application = await prisma.application.findFirst({
      where: { applicationId, studentId: userId },
    });

    if (!application) {
      return res.status(404).json({ error: "Application not found or access denied" });
    }

    if (application.status !== "DRAFT") {
      return res.status(403).json({ error: "Documents can only be uploaded for draft applications" });
    }

    const {
      documentType,
      originalFilename,
      fileType,
      fileSize,
      storageKey,
      storageProvider = "local",
    } = req.body;

    if (!documentType || !originalFilename || !fileType || !fileSize || !storageKey) {
      return res.status(400).json({ error: "Missing required document fields" });
    }

    if (!isAllowedMimeType(fileType)) {
      return res.status(400).json({
        error: "Invalid file type. Allowed types: jpeg, png, gif, pdf, doc, docx",
      });
    }

    if (Number(fileSize) > MAX_FILE_SIZE) {
      return res.status(400).json({
        error: `File too large. Maximum size: ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB`,
      });
    }

    // Replace an existing record of the same document type (re-upload).
    const existing = await prisma.applicationDocument.findFirst({
      where: { applicationId: application.id, documentType },
    });

    if (existing) {
      const updated = await prisma.applicationDocument.update({
        where: { id: existing.id },
        data: {
          storageKey,
          storageProvider,
          originalFilename,
          fileType,
          fileSize: Number(fileSize),
          uploadedBy: userId,
        },
      });
      return res.json({ message: "Document replaced successfully", document: updated });
    }

    const document = await prisma.applicationDocument.create({
      data: {
        application: { connect: { id: application.id } },
        documentType,
        storageKey,
        storageProvider,
        originalFilename,
        fileType,
        fileSize: Number(fileSize),
        uploadedBy: userId,
      },
    });

    return res.status(201).json({ message: "Document uploaded successfully", document });
  } catch (error) {
    console.error("Record document metadata error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/applications/:applicationId/upload
// Multipart upload of a single application document. Stores the binary file on
// disk (or configured storage) and records its metadata against the application.
router.post("/:applicationId/upload", documentUpload.single("file"), async (req: Request, res: Response) => {
  try {
    const applicationId = req.params.applicationId;
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    const application = await prisma.application.findFirst({
      where: { applicationId, studentId: userId },
    });
    if (!application) {
      return res.status(404).json({ error: "Application not found or access denied" });
    }
    if (application.status !== "DRAFT") {
      return res.status(403).json({ error: "Documents can only be uploaded for draft applications" });
    }

    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const documentType = (req.body?.documentType as string) || "";
    if (!documentType) {
      return res.status(400).json({ error: "documentType is required" });
    }

    // Persist the uploaded buffer to the configured storage backend (S3 in
    // production, local disk in development) and record its updated metadata.
    const { storageKey, storageProvider } = await saveDocumentBuffer(
      file.buffer,
      file.mimetype,
      getDocumentBucket()
    );

    // Replace an existing record of the same document type (re-upload):
    // delete the previous object from storage, then store the new one.
    const existing = await prisma.applicationDocument.findFirst({
      where: { applicationId: application.id, documentType },
    });
    if (existing && existing.storageKey && existing.storageKey !== storageKey) {
      await deleteDocumentObject(existing.storageKey, existing.storageProvider).catch(() => {});
    }

    const documentData = {
      storageKey,
      storageProvider,
      originalFilename: safeFileName(file.originalname),
      fileType: file.mimetype,
      fileSize: file.size,
      uploadedBy: userId,
    };

    let document;
    if (existing) {
      document = await prisma.applicationDocument.update({ where: { id: existing.id }, data: documentData });
      return res.json({ message: "Document replaced successfully", document });
    }

    document = await prisma.applicationDocument.create({
      data: {
        application: { connect: { id: application.id } },
        documentType,
        ...documentData,
      },
    });

    return res.status(201).json({ message: "Document uploaded successfully", document });
  } catch (error) {
    console.error("Upload document error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/applications/:applicationId/documents
router.get("/:applicationId/documents", async (req: Request, res: Response) => {
  try {
    const applicationId = req.params.applicationId;
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const application = await prisma.application.findFirst({
      where: { applicationId, studentId: userId },
    });

    if (!application) {
      return res.status(404).json({ error: "Application not found or access denied" });
    }

    const documents = await prisma.applicationDocument.findMany({
      where: { applicationId: application.id },
      orderBy: { uploadedAt: "desc" },
    });

    return res.json({ documents });
  } catch (error) {
    console.error("Get documents error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/applications/:applicationId/documents/:documentId/file
// Securely stream a single document's bytes from the configured storage backend.
// Access is restricted to the application owner (student/guest) or admin staff.
router.get("/:applicationId/documents/:documentId/file", async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).authUser as { id: string; userId: string; role?: string } | undefined;
    const userId = authUser?.userId || authUser?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { applicationId, documentId } = req.params;

    const application = await prisma.application.findFirst({
      where: { applicationId },
    });
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    const isOwner = application.studentId === userId;
    const isStaff = !!authUser?.role && STAFF_ROLES.includes(authUser.role as string);
    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: "Access denied" });
    }

    const document = await prisma.applicationDocument.findFirst({
      where: { id: documentId, applicationId: application.id },
    });
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const { data, contentType } = await getDocumentBuffer(document.storageKey, document.storageProvider);
    res.setHeader("Content-Type", contentType || "application/octet-stream");
    res.setHeader("Content-Disposition", `filename="${safeFileName(document.originalFilename)}"`);
    res.setHeader("Cache-Control", "private, no-store");
    return res.send(data);
  } catch (error) {
    console.error("Get document file error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/applications/:applicationId/documents/:documentId
router.delete("/:applicationId/documents/:documentId", async (req: Request, res: Response) => {
  try {
    const applicationId = req.params.applicationId;
    const documentId = req.params.documentId;
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const application = await prisma.application.findFirst({
      where: { applicationId, studentId: userId },
    });

    if (!application) {
      return res.status(404).json({ error: "Application not found or access denied" });
    }

    if (application.status !== "DRAFT") {
      return res.status(403).json({ error: "Documents can only be deleted from draft applications" });
    }

    const document = await prisma.applicationDocument.findFirst({
      where: { id: documentId, applicationId: application.id },
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Remove the binary object from storage (S3/local) before deleting metadata.
    if (document.storageKey) {
      await deleteDocumentObject(document.storageKey, document.storageProvider).catch(() => {});
    }
    await prisma.applicationDocument.delete({ where: { id: documentId } });

    return res.json({ message: "Document removed successfully" });
  } catch (error) {
    console.error("Delete document error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
