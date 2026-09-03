// Admin announcement/news management: create, edit, publish/unpublish, schedule.
import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../utils/db";
import { authenticate, requirePermission } from "../utils/auth";
import { PERMISSIONS } from "../utils/roles";
import { auditContextFromRequest, logAudit } from "../utils/audit";

const router = Router();

const announcementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  category: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  scheduledFor: z.string().optional().nullable().refine((v) => !v || !isNaN(Date.parse(v)), { message: "Invalid date" }),
});

// GET /api/admin/announcements
router.get(
  "/announcements",
  authenticate,
  requirePermission(PERMISSIONS.announcements_manage),
  async (req: Request, res: Response) => {
    try {
      const { includeInactive = "true" } = req.query;
      const where = includeInactive === "false" ? { isActive: true } : {};
      const announcements = await prisma.announcement.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });
      return res.json({ announcements });
    } catch (error) {
      console.error("Admin announcements list error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/admin/announcements
router.post(
  "/announcements",
  authenticate,
  requirePermission(PERMISSIONS.announcements_manage),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).authUser;
      const parsed = announcementSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      }
      const data = parsed.data;
      const announcement = await prisma.announcement.create({
        data: {
          title: data.title,
          content: data.content,
          category: data.category || null,
          imageUrl: data.imageUrl || null,
          isActive: data.isActive ?? true,
          scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
          ...(data.scheduledFor ? {} : { publishedAt: data.isActive === false ? null : new Date() }),
          createdBy: user.id,
        },
      });
      logAudit(auditContextFromRequest(req), "announcement.created", "Announcement", announcement.id, { title: announcement.title });
      return res.status(201).json({ message: "Announcement created", announcement });
    } catch (error) {
      console.error("Admin create announcement error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /api/admin/announcements/:id
router.patch(
  "/announcements/:id",
  authenticate,
  requirePermission(PERMISSIONS.announcements_manage),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const exists = await prisma.announcement.findUnique({ where: { id } });
      if (!exists) return res.status(404).json({ error: "Announcement not found" });
      const parsed = announcementSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      }
      const data = parsed.data;
      const announcement = await prisma.announcement.update({
        where: { id },
        data: {
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.content !== undefined ? { content: data.content } : {}),
          ...(data.category !== undefined ? { category: data.category } : {}),
          ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
          ...(data.scheduledFor !== undefined ? { scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null } : {}),
          ...(data.isActive ? { publishedAt: new Date() } : {}),
        },
      });
      logAudit(auditContextFromRequest(req), "announcement.updated", "Announcement", id, { title: announcement.title });
      return res.json({ message: "Announcement updated", announcement });
    } catch (error) {
      console.error("Admin update announcement error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /api/admin/announcements/:id/toggle
router.patch(
  "/announcements/:id/toggle",
  authenticate,
  requirePermission(PERMISSIONS.announcements_manage),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const exists = await prisma.announcement.findUnique({ where: { id } });
      if (!exists) return res.status(404).json({ error: "Announcement not found" });
      const announcement = await prisma.announcement.update({
        where: { id },
        data: {
          isActive: !exists.isActive,
          ...(!exists.isActive ? { publishedAt: new Date() } : {}),
        },
      });
      logAudit(auditContextFromRequest(req), "announcement.toggled", "Announcement", id, { isActive: announcement.isActive });
      return res.json({ message: "Announcement updated", announcement });
    } catch (error) {
      console.error("Admin toggle announcement error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DELETE /api/admin/announcements/:id
router.delete(
  "/announcements/:id",
  authenticate,
  requirePermission(PERMISSIONS.announcements_manage),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const exists = await prisma.announcement.findUnique({ where: { id } });
      if (!exists) return res.status(404).json({ error: "Announcement not found" });
      await prisma.announcement.delete({ where: { id } });
      logAudit(auditContextFromRequest(req), "announcement.deleted", "Announcement", id);
      return res.json({ message: "Announcement deleted" });
    } catch (error) {
      console.error("Admin delete announcement error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
