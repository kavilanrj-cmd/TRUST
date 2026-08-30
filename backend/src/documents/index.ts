// Document routes for Neelakannu Educational Trust Platform
// Handles: Document upload URL generation, document listing, document deletion

import express, { Request, Response } from "express";
import prisma from "../utils/db";
import path from "path";

const router = express.Router();

// Allowed MIME types for scholarship documents
// These can be configured per scholarship program
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.word-processingml.document",
];

// Maximum file size in bytes (50MB configurable limit)
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Allowed file extensions
const ALLOWED_EXTENSIONS: string[] = [
  ".pdf",
  ".doc",
  ".docx",
  ".jpg",
  ".jpeg",
  ".png",
];

// Check if MIME type is allowed
function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

// Generate a secure upload path (returns storage key without extension)
function generateUploadPath(applicationId: string, documentType: string): string {
  const safeDocumentType = documentType.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  return `${applicationId}/${safeDocumentType}`;
}

// POST /api/applications/:id/documents/upload-url
// Generate a secure upload URL for a document
router.post(
  "/:applicationId/documents/upload-url",
  async (req: Request, res: Response) => {
    try {
      const applicationId = req.params.applicationId;

      // Check authentication
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Verify application ownership
      const application = await prisma.application.findFirst({
        where: {
          applicationId,
          studentId: userId,
        },
      });

      if (!application) {
        return res.status(404).json({ error: "Application not found or access denied" });
      }

      // Check application status - only drafts can have documents uploaded
      if (application.status !== "DRAFT") {
        return res.status(403).json({
          error: "Documents can only be uploaded for draft applications",
        });
      }

      const { documentType } = req.body;

      if (!documentType) {
        return res.status(400).json({ error: "Document type is required" });
      }

      // Generate timestamp and secure upload path
      const timestamp = Date.now();
      const storageKey = generateUploadPath(
        applicationId as string,
        documentType as string
      );

      // Record document metadata (pending actual upload)
      const document = await prisma.applicationDocument.create({
        data: {
          application: { connect: { applicationId } },
          applicationId,
          documentType,
          fileName: `${documentType}-${timestamp}.pdf`,
          mimeType: "application/pdf", // Will be updated after upload
          fileSize: 0, // Will be updated after upload
          storageKey,
          status: "uploading",
        },
        include: {
          application: true,
        },
      });

      return res.json({
        uploadUrl: `https://${process.env.R2_BUCKET_NAME || "example"}.r2.cloudflare.com/${storageKey}?`,
        document,
        message: "Upload URL generated successfully",
      });
    } catch (error) {
      console.error("Generate upload URL error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/applications/:id/documents
// Record document metadata after upload
router.post(
  "/:applicationId/documents",
  async (req: Request, res: Response) => {
    try {
      const applicationId = req.params.applicationId;

      // Check authentication
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Verify application ownership
      const application = await prisma.application.findFirst({
        where: {
          applicationId,
          studentId: userId,
        },
      });

      if (!application) {
        return res.status(404).json({ error: "Application not found or access denied" });
      }

      const {
        documentType,
        fileName,
        mimeType,
        fileSize,
        storageKey,
      } = req.body;

      if (!documentType || !fileName || !mimeType || !fileSize || !storageKey) {
        return res.status(400).json({ error: "Missing required document fields" });
      }

      // Validate MIME type
      if (!isAllowedMimeType(mimeType)) {
        return res.status(400).json({
          error: "Invalid file type. Allowed types: jpeg, png, pdf, doc, docx",
        });
      }

      // Validate file size
      if (fileSize > MAX_FILE_SIZE) {
        return res.status(400).json({
          error: `File too large. Maximum size: ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB`,
        });
      }

      // Check document count limit (max 4 documents per application)
      const documentCount = await prisma.applicationDocument.count({
        where: { applicationId },
      });

      if (documentCount >= 4) {
        return res.status(400).json({
          error: "Maximum of 4 documents allowed per application",
        });
      }

      // Check for duplicate document type
      const existingDocument = await prisma.applicationDocument.findFirst({
        where: {
          applicationId: applicationId,
          documentType: documentType as string,
        },
      });

      if (existingDocument) {
        // Update existing document
        const updatedDocument = await prisma.applicationDocument.update({
          where: { id: existingDocument.id },
          data: {
            fileName,
            mimeType,
            fileSize,
            storageKey,
            status: "uploaded",
            updatedAt: new Date(),
          },
        });

        return res.json({
          message: "Document replaced successfully",
          document: updatedDocument,
        });
      }

      // Create new document record
      const document = await prisma.applicationDocument.create({
        data: {
          application: { connect: { applicationId } },
          applicationId,
          documentType,
          fileName,
          mimeType,
          fileSize,
          storageKey,
          status: "uploaded",
        },
        include: {
          application: true,
        },
      });

      return res.status(201).json({
        message: "Document uploaded successfully",
        document,
      });
    } catch (error) {
      console.error("Record document metadata error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/applications/:id/documents
// Get all documents for an application
router.get(
  "/:applicationId/documents",
  async (req: Request, res: Response) => {
    try {
      const applicationId = req.params.applicationId;

      // Check authentication
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Verify application ownership
      const application = await prisma.application.findFirst({
        where: {
          applicationId,
          studentId: userId,
        },
      });

      if (!application) {
        return res.status(404).json({ error: "Application not found or access denied" });
      }

      const documents = await prisma.applicationDocument.findMany({
        where: { applicationId },
        orderBy: { uploadedAt: "desc" },
      });

      return res.json({ documents });
    } catch (error) {
      console.error("Get documents error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DELETE /api/applications/:id/documents/:documentId
// Delete a document from application
router.delete(
  "/:applicationId/documents/:documentId",
  async (req: Request, res: Response) => {
    try {
      const applicationId = req.params.applicationId;
      const documentId = req.params.documentId;

      // Check authentication
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Verify application ownership
      const application = await prisma.application.findFirst({
        where: {
          applicationId,
          studentId: userId,
        },
      });

      if (!application) {
        return res.status(404).json({ error: "Application not found or access denied" });
      }

      // Only allow deletion for draft applications
      if (application.status !== "DRAFT") {
        return res.status(403).json({
          error: "Documents can only be deleted from draft applications",
        });
      }

      // Find and delete the document
      const document = await prisma.applicationDocument.findFirst({
        where: {
          id: documentId,
          applicationId,
        },
      });

      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Mark as deleted in database
      const deletedDocument = await prisma.applicationDocument.update({
        where: { id: documentId },
        data: {
          status: "deleted",
          fileName: `${document.fileName} (deleted)`,
        },
      });

      return res.json({
        message: "Document removed successfully",
        document: deletedDocument,
      });
    } catch (error) {
      console.error("Delete document error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;