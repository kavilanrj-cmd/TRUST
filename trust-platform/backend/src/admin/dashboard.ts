// Admin dashboard: real statistics + charts data + recents.
import { Router, Request, Response } from "express";
import prisma from "../utils/db";
import { requirePermission, authenticate } from "../utils/auth";
import { PERMISSIONS } from "../utils/roles";

const router = Router();

// GET /api/admin/dashboard
router.get(
  "/dashboard",
  authenticate,
  requirePermission(PERMISSIONS.dashboard_view),
  async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        total,
        totalSubmissions,
        submitted,
        underReview,
        docVerification,
        approved,
        rejected,
        waitlisted,
        withdrawn,
        correction,
        drafts,
        activeScholarships,
        newToday,
        thisMonth,
        totalScholarships,
        staffCount,
        successPayments,
        totalStudents,
      ] = await prisma.$transaction([
        prisma.application.count(),
        prisma.application.count({ where: { status: { not: "DRAFT" } } }),
        prisma.application.count({ where: { status: "SUBMITTED" } }),
        prisma.application.count({ where: { status: "UNDER_REVIEW" } }),
        prisma.application.count({ where: { status: "DOCUMENT_VERIFICATION" } }),
        prisma.application.count({ where: { status: "APPROVED" } }),
        prisma.application.count({ where: { status: "REJECTED" } }),
        prisma.application.count({ where: { status: "WAITLISTED" } }),
        prisma.application.count({ where: { status: "WITHDRAWN" } }),
        prisma.application.count({ where: { status: "CORRECTION_REQUESTED" } }),
        prisma.application.count({ where: { status: "DRAFT" } }),
        prisma.scholarshipProgram.count({ where: { isActive: true } }),
        prisma.application.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.application.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.scholarshipProgram.count(),
        prisma.user.count({ where: { role: { in: ["FOUNDER", "ADMIN", "REVIEWER"] } } }),
        prisma.payment.count({ where: { status: "SUCCESS" } }),
        prisma.user.count({ where: { role: "STUDENT" } }),
      ]);

      // Applications over time (last 30 days)
      const last30 = await prisma.application.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
      });
      const byDay: Record<string, number> = {};
      for (let d = 0; d < 30; d++) {
        const dt = new Date(thirtyDaysAgo.getTime() + d * 24 * 60 * 60 * 1000);
        const key = dt.toISOString().split("T")[0];
        byDay[key] = 0;
      }
      for (const a of last30) {
        const key = new Date(a.createdAt).toISOString().split("T")[0];
        if (key in byDay) byDay[key] += 1;
      }
      const applicationsOverTime = Object.entries(byDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Status distribution
      const statusDistribution = [
        { status: "SUBMITTED", count: submitted },
        { status: "UNDER_REVIEW", count: underReview },
        { status: "DOCUMENT_VERIFICATION", count: docVerification },
        { status: "APPROVED", count: approved },
        { status: "REJECTED", count: rejected },
        { status: "WAITLISTED", count: waitlisted },
        { status: "WITHDRAWN", count: withdrawn },
        { status: "CORRECTION_REQUESTED", count: correction },
      ];

      // Scholarship-wise applications
      const scholarships = await prisma.scholarshipProgram.findMany({
        include: { _count: { select: { applications: true } } },
      });
      const scholarshipWise = scholarships.map((s: any) => ({
        name: s.name,
        count: s._count.applications,
      }));

      // Education-level distribution
      const academic = await prisma.academicDetails.groupBy({
        by: ["educationLevel"],
        _count: { _all: true },
      });
      const educationLevels = academic.map((a: any) => ({
        level: a.educationLevel,
        count: a._count._all,
      }));

      // Recent applications
      const recentApplications = await prisma.application.findMany({
        include: {
          student: { select: { id: true, name: true, email: true } },
          scholarshipProgram: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      });

      // Recent activity (from audit log + application activity)
      const recentActivity = await prisma.applicationActivity.findMany({
        include: { actor: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
      const auditActivity = await prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      // Upcoming scholarship deadlines
      const upcomingDeadlines = await prisma.scholarshipProgram.findMany({
        where: {
          applicationDeadline: { gte: now },
          isActive: true,
        },
        orderBy: { applicationDeadline: "asc" },
        take: 6,
        select: { id: true, name: true, applicationDeadline: true },
      });

      // Recent website changes (content versions)
      const recentWebsiteChanges = await prisma.contentVersion.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { siteContent: { select: { key: true } } },
      });

      // Unread notifications for current user
      const unreadCount = await prisma.adminNotification.count({
        where: { userId: (req as any).authUser.id, read: false },
      });
      const unreadNotifications = await prisma.adminNotification.findMany({
        where: { userId: (req as any).authUser.id, read: false },
        orderBy: { createdAt: "desc" },
        take: 6,
      });



      return res.json({
        stats: {
          totalApplications: total,
          totalSubmissions,
          pendingApplications: submitted,
          underReview,
          documentVerification: docVerification,
          approved,
          rejected,
          waitlisted,
          withdrawn,
          correctionRequested: correction,
          drafts,
          activeScholarships,
          newApplicationsToday: newToday,
          applicationsThisMonth: thisMonth,
          totalScholarships,
          staffCount,
          successfulPayments: successPayments,
          totalStudents,
        },
        charts: {
          applicationsOverTime,
          statusDistribution,
          scholarshipWise,
          educationLevels,
        },
        recentApplications,
        recentActivity,
        upcomingDeadlines,
        recentWebsiteChanges,
        notifications: { unreadCount, list: unreadNotifications },
        auditActivity,
      });
    } catch (error) {
      console.error("Admin dashboard error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
