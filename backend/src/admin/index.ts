// Admin routes for Neelakannu Educational Trust Platform
// Handles: Admin login, dashboard, applications management

import express, { Request, Response } from "express";
import prisma from "../utils/db";
import jwt from "jsonwebtoken";

const router = express.Router();

// Admin configuration
const ADMIN_SECRET = process.env.ADMIN_SECRET || "neelakannu-admin-secret-2026";

// Admin login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (user.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Check password - in production, use proper password hashing
    // For now, accept any password for the admin account
    const passwordMatch = password === "admin123"; // TODO: proper auth

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      ADMIN_SECRET,
      { expiresIn: "24h" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Verify admin middleware
const adminAuth = (req: Request, res: Response, next: Function) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, ADMIN_SECRET) as { userId: string; role: string };

    if (decoded.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Admin dashboard - stats and overview
router.get("/dashboard", adminAuth, async (req: Request, res: Response) => {
  try {
    // Get application counts by status
    const [
      totalApplications,
      draftApplications,
      submittedApplications,
      underReviewApplications,
      approvedApplications,
      rejectedApplications,
      waitlistedApplications,
      correctionRequestedApplications,
      successfulPayments,
      failedPayments,
    ] = await prisma.$transaction([
      prisma.application.count(),
      prisma.application.count({ where: { status: "DRAFT" } }),
      prisma.application.count({ where: { status: "SUBMITTED" } }),
      prisma.application.count({ where: { status: "UNDER_REVIEW" } }),
      prisma.application.count({ where: { status: "APPROVED" } }),
      prisma.application.count({ where: { status: "REJECTED" } }),
      prisma.application.count({ where: { status: "WAITLISTED" } }),
      prisma.application.count({ where: { status: "CORRECTION_REQUESTED" } }),
      prisma.payment.count({ where: { status: "SUCCESS" } }),
      prisma.payment.count({ where: { status: "FAILED" } }),
    ]);

    // Get recent applications with full details
    const recentApplications = await prisma.application.findMany({
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        scholarshipProgram: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return res.json({
      stats: {
        totalApplications,
        draftApplications,
        submittedApplications,
        underReviewApplications,
        approvedApplications,
        rejectedApplications,
        waitlistedApplications,
        correctionRequestedApplications,
        successfulPayments,
        failedPayments,
      },
      recentApplications,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get all applications with filtering and pagination
router.get("/applications", adminAuth, async (req: Request, res: Response) => {
  try {
    const {
      status,
      paymentStatus,
      search,
      page = "1",
      limit = "10",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause for filtering
    const where: any = {};

    if (status) {
      where.status = status as string;
    }

    if (paymentStatus) {
      where.payment = {
        some: { status: paymentStatus as string },
      };
    }

    if (search) {
      where.OR = [
        { applicationId: { contains: search as string } },
        { personalDetails: { some: { fullName: { contains: search as string } } } },
        { student: { email: { contains: search as string } } },
      ];
    }

    // Get applications with filters
    const [applications, total] = await prisma.$transaction([
      prisma.application.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          scholarshipProgram: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.application.count({ where }),
    ]);

    return res.json({
      applications,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("Admin applications list error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get single application detail
router.get("/applications/:id", adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            emailVerified: true,
            createdAt: true,
          },
        },
        scholarshipProgram: {
          select: {
            id: true,
            name: true,
            description: true,
            educationLevels: true,
            minimumMarks: true,
            minimumCGPA: true,
            maximumFamilyIncome: true,
            applicationDeadline: true,
            isActive: true,
          },
        },
        personalDetails: true,
        address: true,
        parentGuardian: true,
        academicDetails: true,
        financialDetails: true,
        payment: true,
        documents: true,
      },
    });

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    return res.json({ application });
  } catch (error) {
    console.error("Admin application detail error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Update application status
router.patch("/applications/:id/status", adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    // Validate status
    const validStatuses = [
      "DRAFT",
      "SUBMITTED",
      "UNDER_REVIEW",
      "APPROVED",
      "REJECTED",
      "WAITLISTED",
      "CORRECTION_REQUESTED",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    // Get the current application
    const application = await prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Invalid status transitions
    // DRAFT -> only to SUBMITTED (via submit endpoint) or stay DRAFT
    // SUBMITTED -> UNDER_REVIEW, REJECTED, WAITLISTED, CORRECTION_REQUESTED
    // UNDER_REVIEW -> APPROVED, REJECTED, WAITLISTED, CORRECTION_REQUESTED
    // APPROVED -> cannot change (final status)
    // REJECTED -> cannot change (final status)
    // WAITLISTED -> cannot change (final status)
    // CORRECTION_REQUESTED -> can go back to DRAFT or UNDER_REVIEW

    const statusTransitions: Record<string, string[]> = {
      DRAFT: ["DRAFT"], // Can only stay in DRAFT
      SUBMITTED: ["UNDER_REVIEW", "REJECTED", "WAITLISTED", "CORRECTION_REQUESTED"],
      UNDER_REVIEW: ["APPROVED", "REJECTED", "WAITLISTED", "CORRECTION_REQUESTED"],
      APPROVED: [], // Final status
      REJECTED: [], // Final status
      WAITLISTED: [], // Final status
      CORRECTION_REQUESTED: ["DRAFT", "UNDER_REVIEW"],
    };

    const allowedTransitions = statusTransitions[application.status] || [];

    if (allowedTransitions.length > 0 && !allowedTransitions.includes(status)) {
      return res.status(400).json({
        error: `Invalid status transition from ${application.status} to ${status}`,
      });
    }

    // For REJECTED, WAITLISTED, CORRECTION_REQUESTED, note is required
    if (
      (status === "REJECTED" || status === "WAITLISTED" || status === "CORRECTION_REQUESTED") &&
      !note
    ) {
      return res.status(400).json({ error: "Reason/note is required for this status change" });
    }

    // Record the status change
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        status,
        ...(note && { correctionNote: note }), // Store correction note
        updatedAt: new Date(),
      },
    });

    // TODO: Send email notification to student about status change
    // await sendStatusChangeEmail(application.student.email, application, status, note);

    return res.json({
      message: "Application status updated successfully",
      application: updatedApplication,
    });
  } catch (error) {
    console.error("Update application status error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Export applications as CSV
router.get("/applications/export", adminAuth, async (req: Request, res: Response) => {
  try {
    const {
      status,
      paymentStatus,
      search,
    } = req.query;

    // Build where clause for filtering
    const where: any = {};

    if (status) {
      where.status = status as string;
    }

    if (paymentStatus) {
      where.payment = {
        some: { status: paymentStatus as string },
      };
    }

    if (search) {
      where.OR = [
        { applicationId: { contains: search as string } },
        { student: { email: { contains: search as string } } },
      ];
    }

    // Get applications with filters
    const applications = await prisma.application.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        scholarshipProgram: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Generate CSV content
    const csvRows = [
      "Application ID,Student Name,Email,Scholarship,Status,Payment Status,Submitted Date",
    ];

    applications.forEach((app: { applicationId: string; student: { name: string; email: string } | null; scholarshipProgram: { name: string } | null; payment: { status: string }[] | null; submittedAt: string | null }) => {
      const appId = app.applicationId;
      const studentName = app.student?.name || "";
      const studentEmail = app.student?.email || "";
      const scholarshipName = app.scholarshipProgram?.name || "";
      const appStatus = (app as any).status;
      const payment = app.payment?.[app.payment.length - 1];
      const paymentStatus = payment ? payment.status : "N/A";
      const submittedDate = app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : "N/A";

      // Escape CSV values (basic escaping for commas and quotes)
      const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

      csvRows.push([
        escapeCsv(appId),
        escapeCsv(studentName),
        escapeCsv(studentEmail),
        escapeCsv(scholarshipName),
        escapeCsv(appStatus),
        escapeCsv(paymentStatus),
        escapeCsv(submittedDate),
      ].join(","));
    });

    // Set headers for CSV download
    res.header("Content-Type", "text/csv; charset=utf-8");
    res.header("Content-Disposition", `attachment; filename="applications-export-${new Date().toISOString().split("T")[0]}.csv"`);

    res.send(csvRows.join("\n"));
  } catch (error) {
    console.error("Admin CSV export error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;