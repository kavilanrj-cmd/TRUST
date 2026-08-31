// Global admin search — categorized results.
import { Router, Request, Response } from "express";
import prisma from "../utils/db";
import { authenticate, requirePermission } from "../utils/auth";
import { PERMISSIONS } from "../utils/roles";

const router = Router();

// GET /api/admin/search?q=...
router.get(
  "/search",
  authenticate,
  requirePermission(PERMISSIONS.applications_view),
  async (req: Request, res: Response) => {
    try {
      const q = (req.query.q as string) || "";
      if (!q.trim()) {
        return res.json({ query: q, applications: [], scholarships: [], announcements: [], activity: [] });
      }
      const startsWith = q.trim();

      const [applications, scholarships, announcements, activity] = await Promise.all([
        prisma.application.findMany({
          where: {
            OR: [
              { applicationId: { contains: startsWith, mode: "insensitive" } },
              { student: { name: { contains: startsWith, mode: "insensitive" } } },
              { student: { email: { contains: startsWith, mode: "insensitive" } } },
              { personalDetails: { fullName: { contains: startsWith, mode: "insensitive" } } },
              { personalDetails: { phone: { contains: startsWith } } },
            ],
          },
          include: {
            student: { select: { name: true, email: true } },
            scholarshipProgram: { select: { name: true } },
          },
          take: 10,
        }),
        prisma.scholarshipProgram.findMany({
          where: { name: { contains: startsWith, mode: "insensitive" } },
          select: { id: true, name: true, isActive: true },
          take: 10,
        }),
        prisma.announcement.findMany({
          where: {
            OR: [
              { title: { contains: startsWith, mode: "insensitive" } },
              { content: { contains: startsWith, mode: "insensitive" } },
            ],
          },
          take: 10,
        }),
        prisma.auditLog.findMany({
          where: {
            OR: [
              { actorName: { contains: startsWith, mode: "insensitive" } },
              { action: { contains: startsWith, mode: "insensitive" } },
              { targetId: { contains: startsWith, mode: "insensitive" } },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

      return res.json({
        query: q,
        applications,
        scholarships,
        announcements,
        activity,
      });
    } catch (error) {
      console.error("Admin search error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
