// Admin application management: list/detail/status/notes/activity/export.
import { Router, Request, Response } from "express";
import prisma from "../utils/db";
import { authenticate, requirePermission } from "../utils/auth";
import { PERMISSIONS } from "../utils/roles";
import { auditContextFromRequest, logAudit, notifyAllStaff } from "../utils/audit";
import { sendEmail } from "../email";

const router = Router();

const VALID_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "DOCUMENT_VERIFICATION",
  "APPROVED",
  "REJECTED",
  "WAITLISTED",
  "WITHDRAWN",
  "CORRECTION_REQUESTED",
];

// Allowed transitions for each status.
const TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SUBMITTED", "WITHDRAWN"],
  SUBMITTED: ["UNDER_REVIEW", "REJECTED", "WITHDRAWN", "CORRECTION_REQUESTED"],
  UNDER_REVIEW: ["DOCUMENT_VERIFICATION", "APPROVED", "REJECTED", "WAITLISTED", "CORRECTION_REQUESTED", "WITHDRAWN"],
  DOCUMENT_VERIFICATION: ["APPROVED", "REJECTED", "WAITLISTED", "CORRECTION_REQUESTED", "UNDER_REVIEW", "WITHDRAWN"],
  APPROVED: ["REJECTED", "WITHDRAWN"], // long-lived; final but reversible by founder
  REJECTED: ["UNDER_REVIEW", "APPROVED", "WITHDRAWN"],
  WAITLISTED: ["APPROVED", "REJECTED", "WITHDRAWN"],
  WITHDRAWN: [],
  CORRECTION_REQUESTED: ["SUBMITTED", "UNDER_REVIEW", "DRAFT", "WITHDRAWN"],
};

const applicationInclude = {
  student: { select: { id: true, name: true, email: true, phone: true, emailVerified: true } },
  scholarshipProgram: true,
  personalDetails: true,
  address: true,
  parentGuardian: true,
  academicDetails: true,
  financialDetails: true,
  applicationDocuments: true,
  payments: true,
  receipts: { take: 5 },
  notes: { orderBy: { createdAt: "desc" } },
  _count: { select: { applicationDocuments: true } },
} as const;

// GET /api/admin/applications  (list with filters, sort, pagination)
router.get(
  "/applications",
  authenticate,
  requirePermission(PERMISSIONS.applications_view),
  async (req: Request, res: Response) => {
    try {
      const {
        status, scholarshipId, educationLevel, district, state,
        from, to, search, sort = "desc", page = "1", limit = "10",
        paymentStatus,
      } = req.query;

      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 10, 100);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};

      if (paymentStatus === "paid") {
        where.payments = { some: { status: { in: ["SUCCESS", "VERIFIED"] } } };
      } else if (paymentStatus === "unpaid") {
        where.payments = { none: { status: { in: ["SUCCESS", "VERIFIED"] } } };
      }
      if (status) {
        const list = (status as string).split(",");
        where.status = { in: list };
      }
      if (scholarshipId) where.scholarshipProgramId = scholarshipId;
      if (educationLevel) {
        where.academicDetails = { educationLevel: educationLevel as string };
      }
      if (district) {
        where.address = { ...(where.address || {}), district: district as string };
      }
      if (state) {
        where.address = { ...(where.address || {}), state: state as string };
      }
      if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(from as string);
        if (to) {
          const toDate = new Date(to as string);
          toDate.setHours(23, 59, 59, 999);
          where.createdAt.lte = toDate;
        }
      }
      if (search) {
        const s = search as string;
        where.OR = [
          { applicationId: { contains: s, mode: "insensitive" } },
          { student: { email: { contains: s, mode: "insensitive" } } },
          { student: { name: { contains: s, mode: "insensitive" } } },
          { personalDetails: { fullName: { contains: s, mode: "insensitive" } } },
          { personalDetails: { phone: { contains: s } } },
        ];
      }

      const orderBy =
        sort === "asc" ? { createdAt: "asc" as const } : { createdAt: "desc" as const };

      const [applications, total] = await prisma.$transaction([
        prisma.application.findMany({
          where,
          include: {
            student: { select: { id: true, name: true, email: true } },
            scholarshipProgram: { select: { id: true, name: true } },
            personalDetails: { select: { fullName: true, phone: true } },
            payments: { select: { status: true, amount: true } },
            _count: { select: { applicationDocuments: true } },
          },
          orderBy,
          skip,
          take: limitNum,
        }),
        prisma.application.count({ where }),
      ]);

      return res.json({ applications, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
    } catch (error) {
      console.error("Admin applications list error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/admin/applications/export (CSV, respects filters)
router.get(
  "/applications/export",
  authenticate,
  requirePermission(PERMISSIONS.applications_export),
  async (req: Request, res: Response) => {
    try {
      const { status, scholarshipId, search } = req.query;
      const where: any = {};
      if (status) where.status = status;
      if (scholarshipId) where.scholarshipProgramId = scholarshipId;
      if (search) {
        const s = search as string;
        where.OR = [
          { applicationId: { contains: s, mode: "insensitive" } },
          { student: { email: { contains: s, mode: "insensitive" } } },
          { personalDetails: { fullName: { contains: s, mode: "insensitive" } } },
        ];
      }

      const apps = await prisma.application.findMany({
        where,
        include: {
          student: { select: { name: true, email: true } },
          scholarshipProgram: { select: { name: true } },
          personalDetails: { select: { fullName: true, phone: true, gender: true } },
          address: { select: { city: true, district: true, state: true } },
          academicDetails: { select: { educationLevel: true, course: true, schoolCollege: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const escape = (v: unknown) => {
        const s = v === null || v === undefined ? "" : String(v);
        return `"${s.replace(/"/g, '""')}"`;
      };
      const header = [
        "Application ID", "Student Name", "Email", "Phone", "Gender",
        "Scholarship", "Status", "Education Level", "Course",
        "Institution", "City", "District", "State", "Submitted At",
      ].join(",");
      const rows = apps.map((a: any) =>
        [
          a.applicationId,
          a.personalDetails?.fullName || a.student?.name || "",
          a.student?.email || "",
          a.personalDetails?.phone || "",
          a.personalDetails?.gender || "",
          a.scholarshipProgram?.name || "",
          a.status,
          a.academicDetails?.educationLevel || "",
          a.academicDetails?.course || "",
          a.academicDetails?.schoolCollege || "",
          a.address?.city || "",
          a.address?.district || "",
          a.address?.state || "",
          a.submittedAt || a.createdAt,
        ].map(escape).join(",")
      );

      res.header("Content-Type", "text/csv; charset=utf-8");
      res.header("Content-Disposition", `attachment; filename="applications-${new Date().toISOString().split("T")[0]}.csv"`);
      return res.send([header, ...rows].join("\n"));
    } catch (error) {
      console.error("Admin applications export error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/admin/applications/:id  (full detail)
router.get(
  "/applications/:id",
  authenticate,
  requirePermission(PERMISSIONS.applications_view),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const application = await prisma.application.findUnique({
        where: { id },
        include: applicationInclude,
      });
      if (!application) return res.status(404).json({ error: "Application not found" });

      const activities = await prisma.applicationActivity.findMany({
        where: { applicationId: id },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      // record a light audit that the application was viewed
      logAudit(auditContextFromRequest(req), "application.viewed", "Application", id);

      return res.json({ application, activities });
    } catch (error) {
      console.error("Admin application detail error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /api/admin/applications/:id/status
router.patch(
  "/applications/:id/status",
  authenticate,
  requirePermission(PERMISSIONS.applications_status),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, note, reason, message, missingDocuments, rejectionReasons } = req.body;

      if (!status) return res.status(400).json({ error: "Status is required" });
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }

      const application = await prisma.application.findUnique({ where: { id } });
      if (!application) return res.status(404).json({ error: "Application not found" });

      const allowed = TRANSITIONS[application.status] || [];
      if (allowed.length && !allowed.includes(status)) {
        return res.status(400).json({
          error: `Invalid transition from ${application.status} to ${status}`,
        });
      }

      if ((status === "REJECTED" || status === "CORRECTION_REQUESTED" || status === "WITHDRAWN") && !note && !reason) {
        return res.status(400).json({ error: "A reason is required for this status change" });
      }

      const reasonText = reason || note || message || null;

      // Decision metadata: persisted when an application is accepted (APPROVED) or rejected.
      const isDecision = status === "APPROVED" || status === "REJECTED";
      const user = (req as any).authUser;
      const cleanMissing = Array.isArray(missingDocuments)
        ? missingDocuments.filter((d: unknown) => typeof d === "string" && d.trim())
        : undefined;
      const cleanReasons = Array.isArray(rejectionReasons)
        ? rejectionReasons.filter((d: unknown) => typeof d === "string" && d.trim())
        : undefined;

      const updated = await prisma.application.update({
        where: { id },
        data: {
          status,
          ...(reasonText ? { correctionNote: reasonText } : {}),
          ...(status === "SUBMITTED" && !application.submittedAt ? { submittedAt: new Date() } : {}),
          ...(isDecision
            ? {
                reviewedById: user.id,
                reviewedByName: user.name || user.email || null,
                reviewedAt: new Date(),
                ...(message ? { decisionMessage: message } : {}),
              }
            : {}),
          ...(status === "REJECTED"
            ? {
                rejectionReasons: cleanReasons ? cleanReasons : undefined,
                missingDocuments: cleanMissing ? cleanMissing : undefined,
              }
            : {}),
        },
      });

      // activity entry
      await prisma.applicationActivity.create({
        data: {
          applicationId: id,
          actorId: user.id,
          actorName: user.name || user.email,
          action: "status_changed",
          metadata: {
            from: application.status,
            to: status,
            note: reasonText,
            ...(status === "REJECTED" ? { rejectionReasons: cleanReasons, missingDocuments: cleanMissing } : {}),
          },
        },
      });

      // audit
      logAudit(auditContextFromRequest(req), "application.status_changed", "Application", id, {
        from: application.status, to: status,
      });

      // notify student by email on decisive statuses
      try {
        const full = await prisma.application.findUnique({
          where: { id },
          include: { student: true, scholarshipProgram: { select: { name: true } } },
        });
        if (full) {
          const studentName = full.student.name || "Applicant";
          const email = full.student.email;
          const appId = full.applicationId;
          const sName = full.scholarshipProgram.name;
          if (status === "APPROVED") await sendEmail("application-approved", { email, name: studentName, applicationId: appId, scholarshipName: sName });
          else if (status === "REJECTED") await sendEmail("application-rejected", { email, name: studentName, applicationId: appId, scholarshipName: sName });
          else if (status === "WAITLISTED") await sendEmail("application-waitlisted", { email, name: studentName, applicationId: appId, scholarshipName: sName });
          else if (status === "UNDER_REVIEW") await sendEmail("under-review", { email, name: studentName, applicationId: appId, scholarshipName: sName });
          else if (status === "CORRECTION_REQUESTED") await sendEmail("correction-requested", { email, name: studentName, applicationId: appId, correctionMessage: reasonText || "", loginUrl: process.env.FRONTEND_URL || "" });
        }
      } catch (e) {
        console.error("Status email failed (non-fatal):", e);
      }

      return res.json({ message: "Application status updated successfully", application: updated });
    } catch (error) {
      console.error("Admin update status error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/admin/applications/:id/notes
router.post(
  "/applications/:id/notes",
  authenticate,
  requirePermission(PERMISSIONS.applications_notes),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { content, isInternal = true } = req.body;
      if (!content || typeof content !== "string" || !content.trim()) {
        return res.status(400).json({ error: "Note content is required" });
      }
      const application = await prisma.application.findUnique({ where: { id } });
      if (!application) return res.status(404).json({ error: "Application not found" });
      const user = (req as any).authUser;
      const note = await prisma.applicationNote.create({
        data: {
          applicationId: id,
          authorId: user.id,
          content: content.trim(),
          isInternal: !!isInternal,
        },
      });
      await prisma.applicationActivity.create({
        data: {
          applicationId: id,
          actorId: user.id,
          actorName: user.name || user.email,
          action: isInternal ? "admin_note_added" : "note_added",
          metadata: { noteId: note.id },
        },
      });
      logAudit(auditContextFromRequest(req), "application.note_added", "Application", id);
      return res.status(201).json({ message: "Note added", note });
    } catch (error) {
      console.error("Admin add note error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/admin/applications/:id/documents (secure document access list already public; upload handled elsewhere)

// Notify staff when a new application is submitted (called by public submit route).
export async function notifyNewApplication(submit: {
  applicationId: string; applicationUrlId: string; applicantName: string;
}) {
  await notifyAllStaff({
    type: "new_application",
    title: "New application submitted",
    message: `${submit.applicantName} submitted application ${submit.applicationId}`,
    link: `/admin/applications/${submit.applicationUrlId}`,
  });
}

// GET /api/admin/students - list students with application info
router.get(
  "/students",
  authenticate,
  requirePermission(PERMISSIONS.applications_view),
  async (req: Request, res: Response) => {
    try {
      const {
        search, status, page = "1", limit = "15", sort = "desc",
      } = req.query;

      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 15, 100);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause for User (students)
      const userWhere: any = { role: "STUDENT" };
      if (search) {
        const s = search as string;
        userWhere.OR = [
          { name: { contains: s, mode: "insensitive" } },
          { email: { contains: s, mode: "insensitive" } },
        ];
      }

      // If filtering by application status, we need to join with Application
      let applicationWhere: any = {};
      if (status) {
        applicationWhere.status = status;
      }

      // Get students with their applications
      const [students, total] = await prisma.$transaction([
        prisma.user.findMany({
          where: userWhere,
          include: {
            applications: {
              where: applicationWhere,
              include: {
                scholarshipProgram: { select: { id: true, name: true } },
                personalDetails: { select: { fullName: true } },
              },
              orderBy: { createdAt: "desc" },
              take: 1, // Get the latest application
            },
          },
          orderBy: { createdAt: sort === "asc" ? "asc" : "desc" },
          skip,
          take: limitNum,
        }),
        prisma.user.count({ where: userWhere }),
      ]);

      // Format response
      const formattedStudents = students.map((student: any) => {
        const app = student.applications[0];
        return {
          id: student.id,
          name: student.name,
          email: student.email,
          emailVerified: student.emailVerified,
          createdAt: student.createdAt,
          application: app ? {
            id: app.id,
            applicationId: app.applicationId,
            status: app.status,
            scholarshipProgram: app.scholarshipProgram,
            personalDetails: app.personalDetails,
            submittedAt: app.submittedAt,
            createdAt: app.createdAt,
          } : null,
        };
      });

      return res.json({ students: formattedStudents, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
    } catch (error) {
      console.error("Admin students list error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/admin/students/:id - get student detail with application
router.get(
  "/students/:id",
  authenticate,
  requirePermission(PERMISSIONS.applications_view),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const student = await prisma.user.findUnique({
        where: { id },
        include: {
          applications: {
            include: {
              scholarshipProgram: true,
              personalDetails: true,
              address: true,
              parentGuardian: true,
              academicDetails: true,
              financialDetails: true,
              applicationDocuments: true,
              payments: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
      if (!student || student.role !== "STUDENT") {
        return res.status(404).json({ error: "Student not found" });
      }
      return res.json({ student });
    } catch (error) {
      console.error("Admin student detail error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
