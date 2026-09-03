// Admin contact message management: list/search, view, mark read, delete.
import { Router, Request, Response } from "express";
import prisma from "../utils/db";
import { authenticate, requirePermission } from "../utils/auth";
import { PERMISSIONS } from "../utils/roles";
import { auditContextFromRequest, logAudit } from "../utils/audit";

const router = Router();

// GET /api/admin/contact-messages — list with optional filters + pagination
router.get(
  "/contact-messages",
  authenticate,
  requirePermission(PERMISSIONS.contact_manage),
  async (req: Request, res: Response) => {
    try {
      const { search, read, page = "1", limit = "15" } = req.query as any;
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = Math.min(parseInt(limit, 10) || 15, 100);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};
      if (read === "true") where.isRead = true;
      else if (read === "false") where.isRead = false;
      if (search) {
        const s = String(search);
        where.OR = [
          { name: { contains: s, mode: "insensitive" } },
          { email: { contains: s, mode: "insensitive" } },
          { subject: { contains: s, mode: "insensitive" } },
          { message: { contains: s, mode: "insensitive" } },
        ];
      }

      const [messages, total, unread] = await prisma.$transaction([
        prisma.contactMessage.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limitNum,
        }),
        prisma.contactMessage.count({ where }),
        prisma.contactMessage.count({ where: { isRead: false } }),
      ]);

      return res.json({
        messages,
        unread,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      });
    } catch (error) {
      console.error("Admin contact list error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/admin/contact-messages/:id — single message (marks read)
router.get(
  "/contact-messages/:id",
  authenticate,
  requirePermission(PERMISSIONS.contact_manage),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      let message = await prisma.contactMessage.findUnique({ where: { id } });
      if (!message) return res.status(404).json({ error: "Message not found" });

      if (!message.isRead) {
        message = await prisma.contactMessage.update({ where: { id }, data: { isRead: true } });
      }
      return res.json({ message });
    } catch (error) {
      console.error("Admin contact detail error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /api/admin/contact-messages/:id/read
router.patch(
  "/contact-messages/:id/read",
  authenticate,
  requirePermission(PERMISSIONS.contact_manage),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { read } = req.body;
      const message = await prisma.contactMessage.findUnique({ where: { id } });
      if (!message) return res.status(404).json({ error: "Message not found" });
      const updated = await prisma.contactMessage.update({
        where: { id },
        data: { isRead: read === true || read === undefined ? true : !!read },
      });
      return res.json({ message: updated });
    } catch (error) {
      console.error("Admin contact mark read error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DELETE /api/admin/contact-messages/:id
router.delete(
  "/contact-messages/:id",
  authenticate,
  requirePermission(PERMISSIONS.contact_manage),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const message = await prisma.contactMessage.findUnique({ where: { id } });
      if (!message) return res.status(404).json({ error: "Message not found" });
      await prisma.contactMessage.delete({ where: { id } });
      logAudit(auditContextFromRequest(req), "contact.deleted", "ContactMessage", id);
      return res.json({ message: "Message deleted" });
    } catch (error) {
      console.error("Admin contact delete error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
