// Public certificate downloads for the Neelakannu Educational Trust.
// Only PUBLISHED certificates are ever listed or downloadable. Draft and
// unpublished certificates are invisible to the public. Files are streamed
// through the secure backend (never served from a public bucket URL).
import { Router, Request, Response } from "express";
import path from "path";
import prisma from "../utils/db";
import { getDocumentBuffer } from "../utils/storage";

const router = Router();

// GET /api/certificates — list only published certificates (metadata only).
router.get("/", async (_req: Request, res: Response) => {
  try {
    const certificates = await prisma.certificate.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        fileType: true,
        fileSize: true,
        originalFileName: true,
        createdAt: true,
      },
    });
    return res.json({ certificates });
  } catch (error) {
    console.error("List certificates error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/certificates/:id/file — stream the certificate file only if it is
// published. ?download=1 forces an attachment response; otherwise images open
// inline. Content-Type and Content-Disposition are set from stored metadata.
router.get("/:id/file", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const certificate = await prisma.certificate.findFirst({
      where: { id, isPublished: true },
    });
    if (!certificate) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    const { data } = await getDocumentBuffer(
      certificate.storageKey,
      certificate.storageProvider
    );

    const mime =
      certificate.fileType ||
      "application/octet-stream";
    const filename =
      certificate.originalFileName || path.basename(certificate.storageKey);
    const disposition = req.query.download === "1" ? "attachment" : "inline";
    res.setHeader("Content-Type", mime);
    res.setHeader("Content-Disposition", `${disposition}; filename="${filename}"`);
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.send(data);
  } catch (error) {
    console.error("Serve certificate error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;