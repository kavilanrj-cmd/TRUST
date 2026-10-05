// Application API routes for NEELAKANNU EDUCATIONAL TRUST Platform
// Handles: Create application, Get own application, Get application by ID, Update application

import express, { Request, Response } from "express";
import crypto from "crypto";
import prisma from "../utils/db";
import { notifyNewApplication } from "../admin/applications";
import { getApplicationDeadlineConfig, deadlineClosedMessage } from "../utils/applicationDeadline";
import { evaluateEditability, editRejectedResponse } from "../utils/editWindow";

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
  { key: "deathCertificate", label: "Death Certificate of Parent" },
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

// The two recommenders, flattened into the single RecommenderDetails row. Values
// are trimmed so a stray space never blocks the "required" check, and mobile
// numbers keep any leading zero the applicant typed (never coerced to a number).
//
// Recommender 1 is required (name, designation/relationship, mobile); recommender 2
// is optional, so its three columns are stored as empty strings when unused.
//
// The designation values arrive as `recommender1Designation` / `recommender2Designation`
// to match the applicant-facing field ("What is he/she?"). The legacy
// `recommender1Roll` / `recommender2Roll` keys are still accepted so an already
// deployed frontend cannot silently drop the value during a rollout.
function recommenderFields(input: unknown) {
  const r = (input ?? {}) as Record<string, unknown>;
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = String(r[key] ?? "").trim();
      if (value) return value;
    }
    return "";
  };
  return {
    recommender1Name: pick("recommender1Name"),
    recommender1Designation: pick("recommender1Designation", "recommender1Roll"),
    recommender1Mobile: pick("recommender1Mobile"),
    recommender2Name: pick("recommender2Name"),
    recommender2Designation: pick("recommender2Designation", "recommender2Roll"),
    recommender2Mobile: pick("recommender2Mobile"),
  };
}

// Recommender 1 must be complete; recommender 2 may be entirely absent but must not
// be left half-entered, so a stored record is always internally consistent.
function recommenderCompleteness(rec: {
  recommender1Name?: string | null;
  recommender1Designation?: string | null;
  recommender1Mobile?: string | null;
  recommender2Name?: string | null;
  recommender2Designation?: string | null;
  recommender2Mobile?: string | null;
} | null) {
  const filled = (value: string | null | undefined) => !!(value || "").toString().trim();

  const recommender1Complete =
    !!rec &&
    filled(rec.recommender1Name) &&
    filled(rec.recommender1Designation) &&
    filled(rec.recommender1Mobile);

  const recommender2Any =
    filled(rec?.recommender2Name) ||
    filled(rec?.recommender2Designation) ||
    filled(rec?.recommender2Mobile);
  const recommender2Complete =
    !recommender2Any ||
    (filled(rec?.recommender2Name) &&
      filled(rec?.recommender2Designation) &&
      filled(rec?.recommender2Mobile));

  return { recommender1Complete, recommender2Complete };
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
          parent2Name: (parentGuardian as any).parent2Name || null,
          parent2Relationship: (parentGuardian as any).parent2Relationship || null,
          motherName: (parentGuardian as any).motherName || null,
        }
      } : undefined,
      academicDetails: academicDetails ? {
        create: {
          // Legacy combined column kept in sync for backwards compatibility.
          schoolCollege: strOr((academicDetails as any).schoolCollege) || null,
          schoolName: strOr((academicDetails as any).schoolName) || null,
          schoolAddress: strOr((academicDetails as any).schoolAddress) || null,
          collegeName: strOr((academicDetails as any).collegeName) || null,
          collegeAddress: strOr((academicDetails as any).collegeAddress) || null,
          academicType: strOr((academicDetails as any).academicType) || null,
          course: strOr((academicDetails as any).course),
          educationLevel: strOr((academicDetails as any).educationLevel, "UNDERGRADUATE"),
          academicYear: strOr((academicDetails as any).academicYear),
          // `yearOfStudy` is NOT NULL in the schema, so it must never be coerced
          // to null the way the optional columns above are. The wizard saves the
          // whole payload from every step, so this arrives as "" until the
          // Academic step is completed; sending null here made Prisma reject the
          // insert and the endpoint answered 500. Matches the sibling NOT NULL
          // columns (course, academicYear, marksPercentageCGPA) and both PATCH
          // branches, which already used the bare strOr form.
          yearOfStudy: strOr((academicDetails as any).yearOfStudy),
          className: strOr((academicDetails as any).className) || null,
          section: strOr((academicDetails as any).section) || null,
          semester: strOr((academicDetails as any).semester) || null,
          ugPg: strOr((academicDetails as any).ugPg) || null,
          marksPercentageCGPA: strOr((academicDetails as any).marksPercentageCGPA),
        }
      } : undefined,
      financialDetails: financialDetails ? {
        create: {
          familyIncome: numOr((financialDetails as any).familyIncome, 0),
          incomeSource: strOr((financialDetails as any).incomeSource),
          // Decimal column: accept a number/string, otherwise leave NULL so the
          // column stays nullable for applications created before this field.
          ...((financialDetails as any).scholarshipAmount !== undefined &&
          (financialDetails as any).scholarshipAmount !== null &&
          (financialDetails as any).scholarshipAmount !== ""
            ? { scholarshipAmount: numOr((financialDetails as any).scholarshipAmount, 0) }
            : {}),
        }
      } : undefined,
    };

    if (scholarshipProgramId) {
      applicationData.scholarshipProgram = { connect: { id: scholarshipProgramId } };
    }

    // Bank details are created as a nested 1:1 relation so the whole draft is
    // written atomically (no orphan/partial rows). The unique constraint on
    // applicationId guarantees a single BankDetails record per application.
    const bankDetailsInput = req.body.bankDetails;
    if (bankDetailsInput) {
      const bankData = bankDetailsInput as any;
      const bankFields = {
        accountHolderName: strOr(bankData.accountHolderName),
        accountNumber: strOr(bankData.accountNumber),
        bankName: strOr(bankData.bankName),
        branchName: strOr(bankData.branchName),
        ifscCode: strOr(bankData.ifscCode).toUpperCase(),
      };
      if (Object.values(bankFields).some((v) => v.length > 0)) {
        applicationData.bankDetails = { create: bankFields };
      }
    }

    // Recommenders follow the same 1:1 nested-create pattern as bank details, so
    // a draft created with recommender data is written atomically.
    const recommenderInput = req.body.recommenderDetails;
    if (recommenderInput) {
      applicationData.recommenderDetails = { create: recommenderFields(recommenderInput) };
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
        bankDetails: true,
        recommenderDetails: true,
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
    const user = (req as any).user;
    const userId = user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Reject guest users (temporary sessions) - they should not have persistent applications
    if (user?.email?.startsWith("guest-") && user?.email?.endsWith("@temp.local")) {
      return res.status(401).json({ error: "Authentication required. Please log in to access your application." });
    }

    const application = await prisma.application.findFirst({
      where: { studentId: userId },
      include: {
        personalDetails: true,
        address: true,
        parentGuardian: true,
        academicDetails: true,
        financialDetails: true,
        bankDetails: true,
        recommenderDetails: true,
        scholarshipProgram: true,
        applicationDocuments: true,
        payments: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!application) {
      // No row to evaluate, but the wizard still needs a verdict: the first save
      // creates a DRAFT, and DRAFT is unconditionally candidate-editable. Same
      // helper, same server clock, no new rule and nothing decided in the browser,
      // so "has not started yet" is no longer read as "locked".
      return res.status(404).json({
        error: "No application found. Start an application first.",
        application: null,
        editability: evaluateEditability({ status: "DRAFT", submittedAt: null }, new Date()),
      });
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
    // "No Parents" applicants (parent2Name set, not single parent) do not need an
    // Income Certificate, so exclude it from the required-document list.
    const isNoParents = !!application.parentGuardian?.parent2Name && !application.parentGuardian.isSingleParent;
    const effectiveRequired = REQUIRED_DOCUMENTS.filter((d) => (isNoParents && d.key === "income") ? false : true);
    const documents = effectiveRequired.map((d) => ({
      key: d.key,
      label: d.label,
      uploaded: uploadedKeys.has(d.key),
    }));

    const { applicationDocuments, payments, ...safeApplication } = application;

    // Evaluated on the server so the browser never has to decide the window. The
    // frontend renders these fields verbatim.
    const editability = evaluateEditability(application, new Date());

    return res.json({
      application: {
        ...safeApplication,
        submissionStatus: application.status,
        editability,
        paymentStatus,
        payment: latestPayment
          ? {
              id: latestPayment.id,
              status: latestPayment.status,
              method: latestPayment.paymentMethod,
              amount: latestPayment.amount,
              txnId: latestPayment.razorpayPaymentId,
              paymentDate: latestPayment.paymentDate,
              verifiedAt: latestPayment.verifiedAt,
              verificationNote: latestPayment.verificationNote,
              screenshot: latestPayment.paymentScreenshotKey
                ? {
                    name: latestPayment.paymentScreenshotName,
                    mime: latestPayment.paymentScreenshotMime,
                    uploadedAt: latestPayment.paymentScreenshotUploadedAt,
                  }
                : null,
            }
          : null,
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
    const user = (req as any).user;
    const userId = user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Reject guest users
    if (user?.email?.startsWith("guest-") && user?.email?.endsWith("@temp.local")) {
      return res.status(401).json({ error: "Authentication required. Please log in to view your application." });
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
        bankDetails: true,
        recommenderDetails: true,
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
    const user = (req as any).user;
    const userId = user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Reject guest users
    if (user?.email?.startsWith("guest-") && user?.email?.endsWith("@temp.local")) {
      return res.status(401).json({ error: "Authentication required. Please log in to save your application." });
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

    // Ownership was already proven above (id + studentId in one query). Now the
    // candidate edit window decides whether this application may still change:
    // drafts and CORRECTION_REQUESTED always, a submitted/reviewing application
    // for 7 days after `submittedAt`, and never once APPROVED/ACCEPTED. The
    // clock is the server's, and it is read from the stored row, so nothing the
    // client sends or changes can extend it.
    const editability = evaluateEditability(application, new Date());
    if (!editability.editable) {
      const rejected = editRejectedResponse(editability);
      return res.status(rejected.status).json(rejected.body);
    }

    const {
      personalDetails,
      address,
      parentGuardian,
      academicDetails,
      financialDetails,
      bankDetails,
      recommenderDetails,
      declarationAccepted,
    } = req.body;

    // Update personal details if provided.
    // Upsert rather than update() so a draft that predates one of these
    // sections (or was created without it) is repaired instead of throwing.
    if (personalDetails) {
      const dob = toDateTime((personalDetails as any).dateOfBirth);
      await prisma.personalDetails.upsert({
        where: { applicationId: id },
        update: {
          fullName: strOr((personalDetails as any).fullName),
          bankRecordName: (personalDetails as any).nameBankRecord ?? (personalDetails as any).bankRecordName ?? "",
          ...(dob !== undefined ? { dateOfBirth: dob } : {}),
          gender: strOr((personalDetails as any).gender),
          phone: strOr((personalDetails as any).phone),
        },
        create: {
          applicationId: id,
          fullName: strOr((personalDetails as any).fullName),
          bankRecordName: (personalDetails as any).nameBankRecord ?? (personalDetails as any).bankRecordName ?? "",
          dateOfBirth: dob ?? new Date().toISOString(),
          gender: strOr((personalDetails as any).gender),
          phone: strOr((personalDetails as any).phone),
        },
      });
    }

    // Update address if provided
    if (address) {
      await prisma.address.upsert({
        where: { applicationId: id },
        update: {
          street: strOr((address as any).street),
          doorNumber: (address as any).doorNumber ?? "",
          city: strOr((address as any).city),
          district: strOr((address as any).district),
          state: strOr((address as any).state),
          pinCode: strOr((address as any).pinCode),
        },
        create: {
          applicationId: id,
          street: strOr((address as any).street),
          doorNumber: (address as any).doorNumber ?? "",
          city: strOr((address as any).city),
          district: strOr((address as any).district),
          state: strOr((address as any).state),
          pinCode: strOr((address as any).pinCode),
        },
      });
    }

    // Update parent/guardian if provided
    if (parentGuardian) {
      await prisma.parentGuardian.upsert({
        where: { applicationId: id },
        update: {
          guardianName: strOr((parentGuardian as any).guardianName),
          relationship: strOr((parentGuardian as any).relationship),
          occupation: strOr((parentGuardian as any).occupation),
          contactNumber: strOr((parentGuardian as any).contactNumber),
          isSingleParent: (parentGuardian as any).isSingleParent ?? false,
          singleParentType: (parentGuardian as any).singleParentType || null,
          income: (parentGuardian as any).income != null ? numOr((parentGuardian as any).income) : undefined,
          parent2Name: (parentGuardian as any).parent2Name || null,
          parent2Relationship: (parentGuardian as any).parent2Relationship || null,
          motherName: (parentGuardian as any).motherName || null,
        },
        create: {
          applicationId: id,
          guardianName: strOr((parentGuardian as any).guardianName),
          relationship: strOr((parentGuardian as any).relationship),
          occupation: strOr((parentGuardian as any).occupation),
          contactNumber: strOr((parentGuardian as any).contactNumber),
          isSingleParent: (parentGuardian as any).isSingleParent ?? false,
          singleParentType: (parentGuardian as any).singleParentType || null,
          ...((parentGuardian as any).income != null
            ? { income: numOr((parentGuardian as any).income) }
            : {}),
          parent2Name: (parentGuardian as any).parent2Name || null,
          parent2Relationship: (parentGuardian as any).parent2Relationship || null,
          motherName: (parentGuardian as any).motherName || null,
        },
      });
    }

    // Update academic details if provided.
    // `schoolCollege` is the legacy combined column; it is intentionally kept in
    // sync for backwards compatibility and is never dropped, so older records
    // and any consumer still reading it continue to work.
    if (academicDetails) {
      await prisma.academicDetails.upsert({
        where: { applicationId: id },
        update: {
          ...((academicDetails as any).schoolCollege !== undefined
            ? { schoolCollege: (academicDetails as any).schoolCollege || null }
            : {}),
          ...((academicDetails as any).schoolName !== undefined
            ? { schoolName: (academicDetails as any).schoolName || null }
            : {}),
          ...((academicDetails as any).schoolAddress !== undefined
            ? { schoolAddress: (academicDetails as any).schoolAddress || null }
            : {}),
          ...((academicDetails as any).collegeName !== undefined
            ? { collegeName: (academicDetails as any).collegeName || null }
            : {}),
          ...((academicDetails as any).collegeAddress !== undefined
            ? { collegeAddress: (academicDetails as any).collegeAddress || null }
            : {}),
          ...((academicDetails as any).academicType !== undefined
            ? { academicType: (academicDetails as any).academicType || null }
            : {}),
          course: strOr((academicDetails as any).course),
          educationLevel: strOr((academicDetails as any).educationLevel, "UNDERGRADUATE"),
          academicYear: strOr((academicDetails as any).academicYear),
          ...((academicDetails as any).yearOfStudy !== undefined
            ? { yearOfStudy: strOr((academicDetails as any).yearOfStudy) }
            : {}),
          ...((academicDetails as any).className !== undefined
            ? { className: (academicDetails as any).className || null }
            : {}),
          ...((academicDetails as any).section !== undefined
            ? { section: (academicDetails as any).section || null }
            : {}),
          ...((academicDetails as any).semester !== undefined
            ? { semester: (academicDetails as any).semester || null }
            : {}),
          ...((academicDetails as any).ugPg !== undefined
            ? { ugPg: (academicDetails as any).ugPg || null }
            : {}),
          marksPercentageCGPA: (academicDetails as any).marksPercentageCGPA ?? "",
        },
        create: {
          applicationId: id,
          schoolCollege: (academicDetails as any).schoolCollege || null,
          schoolName: (academicDetails as any).schoolName || null,
          schoolAddress: (academicDetails as any).schoolAddress || null,
          collegeName: (academicDetails as any).collegeName || null,
          collegeAddress: (academicDetails as any).collegeAddress || null,
          academicType: (academicDetails as any).academicType || null,
          course: strOr((academicDetails as any).course),
          educationLevel: strOr((academicDetails as any).educationLevel, "UNDERGRADUATE"),
          academicYear: strOr((academicDetails as any).academicYear),
          yearOfStudy: strOr((academicDetails as any).yearOfStudy),
          className: (academicDetails as any).className || null,
          section: (academicDetails as any).section || null,
          semester: (academicDetails as any).semester || null,
          ugPg: (academicDetails as any).ugPg || null,
          marksPercentageCGPA: (academicDetails as any).marksPercentageCGPA ?? "",
        },
      });
    }

    // Update financial details if provided.
    // `null` is the explicit "No Parents" signal and clears any stored income.
    // An absent key means this is a partial update, so income is left alone.
    if (financialDetails) {
      const incomeValue = (financialDetails as any).familyIncome;
      const incomeSourceValue = (financialDetails as any).incomeSource;
      const scholarshipAmountValue = (financialDetails as any).scholarshipAmount;
      await prisma.financialDetails.upsert({
        where: { applicationId: id },
        update: {
          ...(incomeValue !== undefined && incomeValue !== null
            ? { familyIncome: numOr(incomeValue) }
            : {}),
          incomeSource: incomeSourceValue !== undefined ? strOr(incomeSourceValue) : undefined,
          ...(scholarshipAmountValue !== undefined && scholarshipAmountValue !== null
            ? { scholarshipAmount: numOr(scholarshipAmountValue) }
            : {}),
        },
        create: {
          applicationId: id,
          familyIncome: incomeValue !== undefined && incomeValue !== null ? numOr(incomeValue) : 0,
          incomeSource: incomeSourceValue !== undefined ? strOr(incomeSourceValue) : "",
          ...(scholarshipAmountValue !== undefined && scholarshipAmountValue !== null
            ? { scholarshipAmount: numOr(scholarshipAmountValue) }
            : {}),
        },
      });
    } else if (financialDetails === null) {
      // Only an explicit null clears income. A payload that simply omits
      // `financialDetails` is a partial update (e.g. persisting the applicant
      // declaration) and must leave the stored income untouched.
      await prisma.financialDetails.updateMany({
        where: { applicationId: id },
        data: { familyIncome: 0, incomeSource: "" },
      });
    }

    // Update bank details if provided.
    // BankDetails is a 1:1 relation with Application (unique applicationId),
    // so upsert keeps exactly one row per application and cannot create
    // duplicates. Ownership was already verified above via the studentId check.
    if (bankDetails) {
      const bankData = bankDetails as any;
      const bankFields = {
        accountHolderName: strOr(bankData.accountHolderName),
        accountNumber: strOr(bankData.accountNumber),
        bankName: strOr(bankData.bankName),
        branchName: strOr(bankData.branchName),
        ifscCode: strOr(bankData.ifscCode).toUpperCase(),
      };
      // Do not create a half-empty row from an untouched/blank step.
      const hasAnyBankValue = Object.values(bankFields).some((v) => v.length > 0);
      if (hasAnyBankValue) {
        await prisma.bankDetails.upsert({
          where: { applicationId: id },
          update: bankFields,
          create: { applicationId: id, ...bankFields },
        });
      }
    }

    // Recommender details are a 1:1 row like BankDetails, so upsert keeps
    // exactly one row per application. The step always sends all six fields, so
    // a recommender the applicant clears is cleared in the database too.
    if (recommenderDetails) {
      const recFields = recommenderFields(recommenderDetails);
      const hasAnyRecommenderValue = Object.values(recFields).some((v) => v.length > 0);
      if (hasAnyRecommenderValue) {
        await prisma.recommenderDetails.upsert({
          where: { applicationId: id },
          update: recFields,
          create: { applicationId: id, ...recFields },
        });
      }
    }

    // Applicant Declaration acceptance is stored on the application itself so
    // the state survives a reload and can be enforced at submission time.
    // Only an explicit boolean is honoured; an absent key leaves the existing
    // value untouched so unrelated saves cannot clear the agreement.
    if (declarationAccepted !== undefined) {
      const accepted = declarationAccepted === true;
      await prisma.application.update({
        where: { id },
        data: {
          declarationAccepted: accepted,
          declarationAcceptedAt: accepted ? new Date() : null,
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
        bankDetails: true,
        recommenderDetails: true,
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
    const user = (req as any).user;
    const userId = user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Reject guest users
    if (user?.email?.startsWith("guest-") && user?.email?.endsWith("@temp.local")) {
      return res.status(401).json({ error: "Authentication required. Please log in to submit your application." });
    }

    // Verify application belongs to this student
    const application = await prisma.application.findFirst({
      where: {
        id,
        studentId: userId,
      },
      include: {
        scholarshipProgram: true,
        personalDetails: true,
        address: true,
        parentGuardian: true,
        academicDetails: true,
        financialDetails: true,
        bankDetails: true,
        recommenderDetails: true,
      },
    });

    if (!application) {
      return res.status(404).json({ error: "Application not found or access denied" });
    }

    // Check application is in draft status, was sent back for correction, or is
    // a submitted application whose payment was rejected and is being
    // re-submitted with corrected details.
    if (application.status !== "DRAFT" && application.status !== "CORRECTION_REQUESTED") {
      const latestPayment = await prisma.payment.findFirst({
        where: { applicationId: application.id },
        orderBy: { createdAt: "desc" },
      });
      const resubmittingRejectedPayment =
        application.status === "SUBMITTED" &&
        latestPayment &&
        ["REJECTED", "NOT_SUBMITTED"].includes(latestPayment.status);
      if (!resubmittingRejectedPayment) {
        return res.status(400).json({ error: "Application has already been submitted or is not in draft status" });
      }
    }

    // The Applicant Declaration is mandatory. This is enforced here, not only in
    // the browser, so a crafted request cannot submit without agreeing.
    if (!application.declarationAccepted) {
      return res.status(400).json({
        error: "Please agree to the applicant declaration before submitting your application.",
        code: "DECLARATION_REQUIRED",
      });
    }

    // Check scholarship is active (only when a scholarship program is associated)
    if (application.scholarshipProgram && !application.scholarshipProgram.isActive) {
      return res.status(400).json({ error: "Scholarship program is not currently active" });
    }

    // --- Payment validation ---
    const { getApplicationFeeConfig } = await import("../utils/applicationFee");
    const feeConfig = await getApplicationFeeConfig();
    const existingPayment = await prisma.payment.findFirst({
      where: { applicationId: application.id },
      orderBy: { createdAt: "desc" },
    });

    if (feeConfig.enabled && feeConfig.amount > 0) {
      if (feeConfig.paymentMethod === "manual_upi") {
        const paymentVerified = ["SUCCESS", "VERIFIED"].includes(existingPayment?.status || "");

        if (!paymentVerified) {
          const body = (req.body || {}) as { transactionId?: string; paymentConfirmed?: boolean };
          const submittedTxn = String(body.transactionId || "").trim();
          const currentTxn = String(existingPayment?.razorpayPaymentId || "").trim();
          const txn = submittedTxn || currentTxn;

          // The admin must have configured the UPI QR / payment details before
          // any manual payment can be submitted.
          if (!feeConfig.upi?.qrConfigured && !feeConfig.upi?.qrUrl && !feeConfig.upi?.vpa) {
            return res.status(400).json({
              error: "The payment QR code has not been configured yet. Please contact the trust office.",
              code: "UPI_QR_NOT_CONFIGURED",
            });
          }

          // The applicant must attach a screenshot of the successful payment.
          if (!existingPayment?.paymentScreenshotKey) {
            return res.status(400).json({
              error: "Please upload your payment screenshot first.",
              code: "PAYMENT_SCREENSHOT_REQUIRED",
            });
          }

          if (!txn) {
            return res.status(400).json({
              error: "Please enter your UPI transaction reference (UTR) before submitting. Complete the payment step first.",
              code: "UTR_REQUIRED",
            });
          }

          if (txn.length < 6 || txn.length > 64) {
            return res.status(400).json({
              error: "The UPI transaction reference (UTR) you entered is invalid. Please check and try again.",
              code: "UTR_INVALID",
            });
          }

          if (body.paymentConfirmed !== true) {
            return res.status(400).json({
              error: "Please confirm that you have completed the payment before submitting.",
              code: "PAYMENT_CONFIRMATION_REQUIRED",
            });
          }

          const paymentData: Record<string, unknown> = {
            razorpayPaymentId: txn,
            paymentMethod: "MANUAL_UPI",
            status: "PENDING_VERIFICATION",
            amount: feeConfig.amount,
            currency: "INR",
            verifiedById: null,
            verifiedAt: null,
            verificationNote: null,
          };

          if (existingPayment) {
            await prisma.payment.update({ where: { id: existingPayment.id }, data: paymentData });
          } else {
            const upiRef = `upi_${crypto.randomUUID()}`;
            await prisma.payment.create({
              data: {
                applicationId: application.id,
                razorpayOrderId: upiRef,
                ...paymentData,
              },
            });
          }
        }
      } else if (feeConfig.paymentMethod === "razorpay") {
        // Future Razorpay path: require a captured successful payment.
        if (!existingPayment || existingPayment.status !== "SUCCESS") {
          return res.status(400).json({ error: "Payment must be completed before submitting application" });
        }
      }
    }

    // Check required fields are complete
    const hasPersonalDetails = application.personalDetails ? true : false;
    const hasAddress = application.address ? true : false;
    const hasParentGuardian = application.parentGuardian ? true : false;
    const hasAcademicDetails = application.academicDetails ? true : false;
    const isNoParents = !!application.parentGuardian?.parent2Name && !application.parentGuardian?.isSingleParent;
    const hasFinancialDetails = application.financialDetails ? true : false;

    if (!hasPersonalDetails || !hasAddress || !hasParentGuardian || !hasAcademicDetails) {
      return res.status(400).json({ error: "All required fields must be completed before submitting" });
    }
    // Financial details are required for all applicants except "No Parents" (No Parents does not declare income).
    if (!isNoParents && !hasFinancialDetails) {
      return res.status(400).json({ error: "All required fields must be completed before submitting" });
    }

    // Bank details are required so the approved scholarship can be disbursed.
    // Existing applications created before bank details were introduced are
    // prompted to complete the step rather than failing with a server error.
    const bank = application.bankDetails;
    const bankComplete =
      !!bank &&
      !!(bank.accountHolderName || "").trim() &&
      !!(bank.accountNumber || "").trim() &&
      !!(bank.bankName || "").trim() &&
      !!(bank.branchName || "").trim() &&
      !!(bank.ifscCode || "").trim();
    if (!bankComplete) {
      return res.status(400).json({
        error: "Please complete your bank details before submitting.",
        code: "BANK_DETAILS_REQUIRED",
      });
    }

    // Recommender 1 (name, designation/relationship, mobile) is required.
    // Recommender 2 is optional: it may be left completely empty, but a partially
    // entered second recommender must be finished so no invalid record is stored.
    const { recommender1Complete, recommender2Complete } = recommenderCompleteness(
      application.recommenderDetails
    );
    if (!recommender1Complete) {
      return res.status(400).json({
        error:
          "Please enter your first recommender's name, what he/she is and mobile number before submitting.",
        code: "RECOMMENDER_DETAILS_REQUIRED",
      });
    }
    if (!recommender2Complete) {
      return res.status(400).json({
        error:
          "Your second recommender is incomplete. Please fill in all three fields or leave them empty.",
        code: "RECOMMENDER_DETAILS_INCOMPLETE",
      });
    }

    // The applicant must state the scholarship amount they are requesting.
    // This is distinct from the admin-configured application fee.
    const requestedAmount = application.financialDetails?.scholarshipAmount;
    if (requestedAmount == null || !(Number(requestedAmount) > 0)) {
      return res.status(400).json({
        error: "Please enter the scholarship amount you are requesting before submitting.",
        code: "SCHOLARSHIP_AMOUNT_REQUIRED",
      });
    }

    // Check required documents exist (ApplicationDocument.applicationId is a FK to Application.id)
    const documentCount = await prisma.applicationDocument.count({
      where: { applicationId: application.id },
    });

    if (documentCount === 0) {
      return res.status(400).json({ error: "At least one required document must be uploaded before submitting" });
    }

    // Check for Death Certificate of Parent when Single Parent = Yes
    const isSingleParent = application.parentGuardian?.isSingleParent;
    if (isSingleParent) {
      const deathCertificateExists = await prisma.applicationDocument.findFirst({
        where: { applicationId: application.id, documentType: "deathCertificate" },
      });
      if (!deathCertificateExists) {
        return res.status(400).json({ error: "Death Certificate of Parent is required for single parent applicants" });
      }
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