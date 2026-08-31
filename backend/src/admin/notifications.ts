// Admin notification center.
import { Router, Request, Response } from "express";
import prisma from "../utils/db";
import { authenticate, requirePermission } from "../utils/auth";
import { PERMISSIONS } from "../utils/roles";

const router = Router();

// GET /api/admin/notifications — current user's notifications
router.get(
  "/notifications",
  authenticate,
  requirePermission(PERMISSIONS.notifications_view),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).authUser.id;
      const limit = Math.min(parseInt((req.query.limit as string) || "50"), 100);
      const [list, unreadCount, total] = await prisma.$transaction([
        prisma.adminNotification.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: limit,
        }),
        prisma.adminNotification.count({ where: { userId, read: false } }),
        prisma.adminNotification.count({ where: { userId } }),
      ]);
      return res.json({ notifications: list, unreadCount, total });
    } catch (error) {
      console.error("Admin notifications error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/admin/notifications/count — unread count for the top bar
router.get(
  "/notifications/count",
  authenticate,
  requirePermission(PERMISSIONS.notifications_view),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).authUser.id;
      const unreadCount = await prisma.adminNotification.count({ where: { userId, read: false } });
      return res.json({ unreadCount });
    } catch (error) {
      console.error("Admin notification count error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /api/admin/notifications/:id/read
router.patch(
  "/notifications/:id/read",
  authenticate,
  requirePermission(PERMISSIONS.notifications_view),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).authUser.id;
      const n = await prisma.adminNotification.findFirst({ where: { id, userId } });
      if (!n) return res.status(404).json({ error: "Notification not found" });
      await prisma.adminNotification.update({ where: { id }, data: { read: true } });
      return res.json({ message: "Marked as read" });
    } catch (error) {
      console.error("Admin mark read error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /api/admin/notifications/read-all
router.patch(
  "/notifications/read-all",
  authenticate,
  requirePermission(PERMISSIONS.notifications_view),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).authUser.id;
      await prisma.adminNotification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });
      return res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Admin mark all read error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
