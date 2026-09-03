// Audit log viewer (founder/admin).
import { Router, Request, Response } from "express";
import prisma from "../utils/db";
import { authenticate, requirePermission } from "../utils/auth";
import { PERMISSIONS } from "../utils/roles";

const router = Router();

// GET /api/admin/audit-logs — search/filter + pagination
router.get(
  "/audit-logs",
  authenticate,
  requirePermission(PERMISSIONS.audit_view),
  async (req: Request, res: Response) => {
    try {
      const { action, actor, targetType, from, to, page = "1", limit = "20" } = req.query;
      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 20, 100);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};
      if (action) where.action = { contains: action as string, mode: "insensitive" };
      if (actor) where.actorName = { contains: actor as string, mode: "insensitive" };
      if (targetType) where.targetType = targetType as string;
      if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(from as string);
        if (to) {
          const d = new Date(to as string);
          d.setHours(23, 59, 59, 999);
          where.createdAt.lte = d;
        }
      }

      const [logs, total] = await prisma.$transaction([
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limitNum,
        }),
        prisma.auditLog.count({ where }),
      ]);

      return res.json({ logs, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
    } catch (error) {
      console.error("Admin audit logs error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
