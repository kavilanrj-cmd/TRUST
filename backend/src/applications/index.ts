// Application API routes for Neelakannu Educational Trust Platform
// Handles: Create application, Get own application, Get application by ID, Update application

import express, { Request, Response } from "express";
import prisma from "../utils/db";
import { notifyNewApplication } from "../admin/applications";
import { getApplicationDeadlineConfig, deadlineClosedMessage } from "../utils/applicationDeadline";

const router = express.Router();

// The exact set of required scholarship documents (order preserved).
// Used to compute per-document upload status for the student status view.
export const REQUIRED_DOCUMENTS: Array<{ key: string; label: string }> = [
  { key: "sslc", label: "SSLC" },
  { key: "hsc", label: "HSC" },
  { key: "currentSemesterResult", label: "Current Semester Result" },
  { key: "bonafide", label: "Bonafide Certificate" },
  { key: "idCard", label: "ID Card" },
  { key: "community", label: "Community Certificate" },
  { key: "income", label: "Income Certificate" },
  { key: "pan", label: "PAN" },
  { key: "aadhar", label: "Aadhar" },
  { key: "bankPassbook", label: "Bank Passbook (Student Account)" },
  { key: "disability", label: "Disability Certificate" },
  { key: "sports", label: "Sports Certificate" },
];

// Normalize a client-supplied date (YYYY-MM-DD or full ISO string, or empty)
// into a value Prisma can write to a DateTime column. Date-picker inputs send
// date-only strings ("2026-01-01") which the driver rejects, so we coerce them
// to a full ISO-8601 datetime (UTC midnight) before saving.
function toDateTime(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  const raw = String(value);
  // Already has a time component (full ISO-8601) or is a valid Date string.
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw) || !isNaN(Date.parse(raw))) {
    return new Date(raw).toISOString();
  }
  // Date-only "YYYY-MM-DD".
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (m) {
    return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).toISOString();
  }
  return undefined;
}

// The form saves drafts step-by-step, so required fields on later steps are not
// filled yet when the application is first created. Prisma rejects `undefined`
// for non-optional fields, so coerce empty/absent values to a safe placeholder.
function strOr(value: unknown, fallback = ""): string {
  if (value == null || value === "") return fallback;
  return String(value);
}

function numOr(value: unknown, fallback = 0): number {
  if (value == null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

// Create a new application (or draft)
router.post("/", async (req: Request, res: Response) => {
  try {
    // Check authentication - user should be attached to req by auth middleware
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Enforce the scholarship application deadline for NEW applications.
    // Timezone-independent: compares the server's current UTC time against the
    // configured deadline. Once closed, no user can start a new application via
    // the API, even if the frontend is bypassed.
    const deadline = await getApplicationDeadlineConfig();
    if (deadline.deadline && new Date(deadline.deadline).getTime() < Date.now()) {
      return res.status(403).json({
        error: deadlineClosedMessage(new Date(deadline.deadline)),
        deadlineClosed: true,
      });
    }

    const {
      scholarshipProgramId,
      personalDetails,
      address,
      parentGuardian,
      academicDetails,
      financialDetails,
    } = req.body;

    // Scholarship program is optional. If provided, validate it exists and is active.
    if (scholarshipProgramId) {
      const scholarshipProgram = await prisma.scholarshipProgram.findUnique({
        where: { id: scholarshipProgramId },
      });

      if (!scholarshipProgram) {
        return res.status(404).json({ error: "Scholarship program not found" });
      }

      if (!scholarshipProgram.isActive) {
        return res.status(400).json({ error: "Scholarship program is not currently active" });
      }
    }

    // A student can only have one application.
    const existingApplication = await prisma.application.findFirst({
      where: {
        studentId: userId,
      },
    });

    if (existingApplication) {
      return res.status(409).json({
        error: "You already have an application",
        applicationId: existingApplication.applicationId,
      });
    }

    // Generate application ID
    const applicationId = `NET-2026-${String(Math.floor(Math.random() * 900000) + 100000).padStart(6, '0')}`;

    const applicationData: any = {
      applicationId,
      status: "DRAFT",
      student: { connect: { id: userId } },
      personalDetails: personalDetails ? {
        create: {
          fullName: strOr((personalDetails as any).fullName),
          bankRecordName: strOr((personalDetails as any).nameBankRecord ?? (personalDetails as any).bankRecordName, ""),
          dateOfBirth: toDateTime((personalDetails as any).dateOfBirth),
          gender: strOr((personalDetails as any).gender),
          phone: strOr((personalDetails as any).phone),
        }
      } : undefined,
      address: address ? {
        create: {
          street: strOr((address as any).street),
          doorNumber: strOr((address as any).doorNumber, ""),
          city: strOr((address as any).city),
          district: strOr((address as any).district),
          state: strOr((address as any).state),
          pinCode: strOr((address as any).pinCode),
        }
      } : undefined,
      parentGuardian: parentGuardian ? {
        create: {
          guardianName: strOr((parentGuardian as any).guardianName),
          relationship: strOr((parentGuardian as any).relationship),
          occupation: strOr((parentGuardian as any).occupation),
          contactNumber: strOr((parentGuardian as any).contactNumber),
          isSingleParent: (parentGuardian as any).isSingleParent ?? false,
          singleParentType: (parentGuardian as any).singleParentType || null,
          income: (parentGuardian as any).income != null ? numOr((parentGuardian as any).income) : undefined,
        }
      } : undefined,
      academicDetails: academicDetails ? {
        create: {
          schoolCollege: strOr((academicDetails as any).schoolCollege),
          academicType: strOr((academicDetails as any).academicType, ""),
          course: strOr((academicDetails as any).course),
          educationLevel: strOr((academicDetails as any).educationLevel, "UNDERGRADUATE"),
          academicYear: strOr((academicDetails as any).academicYear),
          yearOfStudy: strOr((academicDetails as any).yearOfStudy, ""),
          className: strOr((academicDetails as any).className, ""),
          section: strOr((academicDetails as any).section, ""),
          semester: strOr((academicDetails as any).semester, ""),
          ugPg: strOr((academicDetails as any).ugPg, ""),
          marksPercentageCGPA: strOr((academicDetails as any).marksPercentageCGPA, ""),
        }
      } : undefined,
      financialDetails: financialDetails ? {
        create: {
          familyIncome: numOr((financialDetails as any).familyIncome, 0),
          incomeSource: strOr((financialDetails as any).incomeSource),
        }
      } : undefined,
    };

    if (scholarshipProgramId) {
      applicationData.scholarshipProgram = { connect: { id: scholarshipProgramId } };
    }

    // Create application with draft status
    const application = await prisma.application.create({
      data: applicationData,
      include: {
        personalDetails: true,
        address: true,
        parentGuardian: true,
        academicDetails: true,
        financialDetails: true,
      },
    });

    return res.status(201).json({
      message: "Application draft created successfully",
      application,
    });
  } catch (error) {
    console.error("Create application error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get current student's application
router.get("/me", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const application = await prisma.application.findFirst({
      where: { studentId: userId },
      include: {
        personalDetails: true,
        address: true,
        parentGuardian: true,
        academicDetails: true,
        financialDetails: true,
        scholarshipProgram: true,
        applicationDocuments: true,
        payments: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!application) {
      return res.status(404).json({ error: "No application found. Start an application first." });
    }

    // Compute payment status from the most recent payment.
    const latestPayment = application.payments?.[0] || null;
    const paymentStatus = latestPayment
      ? latestPayment.status
      : "NO_PAYMENT";

    // Compute upload status for each required document (based on whether a row
    // exists for that documentType). A student only sees their own application.
    const docRows = (application.applicationDocuments || []) as Array<{ documentType: string | null }>;
    const uploadedKeys = new Set(docRows.map((d) => d.documentType).filter((t): t is string => !!t));
    const documents = REQUIRED_DOCUMENTS.map((d) => ({
      key: d.key,
      label: d.label,
      uploaded: uploadedKeys.has(d.key),
    }));

    const { applicationDocuments, payments, ...safeApplication } = application;

    return res.json({
      application: {
        ...safeApplication,
        submissionStatus: application.status,
        paymentStatus,
        documents,
        decision: {
          reviewedAt: application.reviewedAt,
          reviewedByName: application.reviewedByName,
          decisionMessage: application.decisionMessage,
          missingDocuments: application.missingDocuments,
          rejectionReasons: application.rejectionReasons,
          correctionNote: application.correctionNote,
        },
      },
    });
  } catch (error) {
    console.error("Get own application error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get application by ID (student can only get their own)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const application = await prisma.application.findFirst({
      where: {
        id,
        studentId: userId, // Student can only access their own
      },
      include: {
        personalDetails: true,
        address: true,
        parentGuardian: true,
        academicDetails: true,
        financialDetails: true,
        scholarshipProgram: true,
      },
    });

    if (!application) {
      return res.status(404).json({ error: "Application not found or access denied" });
    }

    return res.json({
      application,
    });
  } catch (error) {
    console.error("Get application error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Update application (save draft)
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify application belongs to this student
    const application = await prisma.application.findFirst({
      where: {
        id,
        studentId: userId,
      },
    });

    if (!application) {
      return res.status(404).json({ error: "Application not found or access denied" });
    }

    // Prevent modification of submitted applications
    if (application.status !== "DRAFT") {
      return res.status(403).json({ error: "Cannot modify submitted applications" });
    }

    const {
      personalDetails,
      address,
      parentGuardian,
      academicDetails,
      financialDetails,
    } = req.body;

    // Update personal details if provided
    if (personalDetails) {
      const dob = toDateTime((personalDetails as any).dateOfBirth);
      await prisma.personalDetails.update({
        where: { applicationId: id },
        data: {
          fullName: (personalDetails as any).fullName,
          bankRecordName: (personalDetails as any).nameBankRecord ?? (personalDetails as any).bankRecordName,
          ...(dob !== undefined ? { dateOfBirth: dob } : {}),
          gender: (personalDetails as any).gender,
          phone: (personalDetails as any).phone,
        },
      });
    }

    // Update address if provided
    if (address) {
      await prisma.address.update({
        where: { applicationId: id },
        data: {
          street: (address as any).street,
          doorNumber: (address as any).doorNumber,
          city: (address as any).city,
          district: (address as any).district,
          state: (address as any).state,
          pinCode: (address as any).pinCode,
        },
      });
    }

    // Update parent/guardian if provided
    if (parentGuardian) {
      await prisma.parentGuardian.update({
        where: { applicationId: id },
        data: {
          guardianName: (parentGuardian as any).guardianName,
          relationship: (parentGuardian as any).relationship,
          occupation: (parentGuardian as any).occupation,
          contactNumber: (parentGuardian as any).contactNumber,
          isSingleParent: (parentGuardian as any).isSingleParent,
          singleParentType: (parentGuardian as any).singleParentType || null,
          income: (parentGuardian as any).income,
        },
      });
    }

    // Update academic details if provided
    if (academicDetails) {
      await prisma.academicDetails.update({
        where: { applicationId: id },
        data: {
          schoolCollege: (academicDetails as any).schoolCollege,
          academicType: (academicDetails as any).academicType,
          course: (academicDetails as any).course,
          educationLevel: (academicDetails as any).educationLevel,
          academicYear: (academicDetails as any).academicYear,
          yearOfStudy: (academicDetails as any).yearOfStudy,
          className: (academicDetails as any).className,
          section: (academicDetails as any).section,
          semester: (academicDetails as any).semester,
          ugPg: (academicDetails as any).ugPg,
          marksPercentageCGPA: (academicDetails as any).marksPercentageCGPA,
        },
      });
    }

    // Update financial details if provided
    if (financialDetails) {
      await prisma.financialDetails.update({
        where: { applicationId: id },
        data: {
          ...((financialDetails as any).familyIncome !== undefined && (financialDetails as any).familyIncome !== null
            ? { familyIncome: numOr((financialDetails as any).familyIncome) }
            : {}),
          incomeSource: (financialDetails as any).incomeSource !== undefined ? strOr((financialDetails as any).incomeSource) : undefined,
        },
      });
    }

    // Fetch updated application
    const updatedApplication = await prisma.application.findFirst({
      where: { id },
      include: {
        personalDetails: true,
        address: true,
        parentGuardian: true,
        academicDetails: true,
        financialDetails: true,
        scholarshipProgram: true,
      },
    });

    return res.json({
      message: "Application updated successfully",
      application: updatedApplication,
    });
  } catch (error) {
    console.error("Update application error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Submit application
router.post("/:id/submit", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify application belongs to this student
    const application = await prisma.application.findFirst({
      where: {
        id,
        studentId: userId,
      },
      include: {
        scholarshipProgram: true,
      },
    });

    if (!application) {
      return res.status(404).json({ error: "Application not found or access denied" });
    }

    // Check application is still in draft status
    if (application.status !== "DRAFT") {
      return res.status(400).json({ error: "Application has already been submitted or is not in draft status" });
    }

    // Check scholarship is active (only when a scholarship program is associated)
    if (application.scholarshipProgram && !application.scholarshipProgram.isActive) {
      return res.status(400).json({ error: "Scholarship program is not currently active" });
    }

    // Check payment is successful (Payment.applicationId is a FK to Application.id)
    const payment = await prisma.payment.findFirst({
      where: { applicationId: application.id },
    });

    if (!payment || payment.status !== "SUCCESS") {
      return res.status(400).json({ error: "Payment must be completed before submitting application" });
    }

    // Check required fields are complete
    const hasPersonalDetails = application.personalDetails ? true : false;
    const hasAddress = application.address ? true : false;
    const hasParentGuardian = application.parentGuardian ? true : false;
    const hasAcademicDetails = application.academicDetails ? true : false;
    const hasFinancialDetails = application.financialDetails ? true : false;

    if (!hasPersonalDetails || !hasAddress || !hasParentGuardian || !hasAcademicDetails || !hasFinancialDetails) {
      return res.status(400).json({ error: "All required fields must be completed before submitting" });
    }

    // Check required documents exist (ApplicationDocument.applicationId is a FK to Application.id)
    const documentCount = await prisma.applicationDocument.count({
      where: { applicationId: application.id },
    });

    if (documentCount === 0) {
      return res.status(400).json({ error: "At least one required document must be uploaded before submitting" });
    }

    // Generate/application ID (ensure unique)
    const applicationId = application.applicationId;

    // Update application status to SUBMITTED
    const submittedApplication = await prisma.application.update({
      where: { id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    // Notify admin staff about the new submission (non-fatal).
    try {
      const pd = await prisma.personalDetails.findUnique({ where: { applicationId: id } });
      await notifyNewApplication({
        applicationId: application.applicationId,
        applicationUrlId: application.id,
        applicantName: pd?.fullName || "An applicant",
      });
    } catch (e) {
      console.error("New-application notify failed (non-fatal):", e);
    }

    return res.json({
      message: "Application submitted successfully",
      applicationId: applicationId,
      application: submittedApplication,
    });
  } catch (error) {
    console.error("Submit application error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;