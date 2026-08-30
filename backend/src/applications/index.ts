// Application API routes for Neelakannu Educational Trust Platform
// Handles: Create application, Get own application, Get application by ID, Update application

import express, { Request, Response } from "express";
import prisma from "../utils/db";

const router = express.Router();

// Create a new application (or draft)
router.post("/", async (req: Request, res: Response) => {
  try {
    // Check authentication - user should be attached to req by auth middleware
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const {
      scholarshipProgramId,
      personalDetails,
      address,
      parentGuardian,
      academicDetails,
      financialDetails,
    } = req.body;

    if (!scholarshipProgramId) {
      return res.status(400).json({ error: "Scholarship program ID is required" });
    }

    // Check if scholarship program exists and is active
    const scholarshipProgram = await prisma.scholarshipProgram.findUnique({
      where: { id: scholarshipProgramId },
    });

    if (!scholarshipProgram) {
      return res.status(404).json({ error: "Scholarship program not found" });
    }

    if (!scholarshipProgram.isActive) {
      return res.status(400).json({ error: "Scholarship program is not currently active" });
    }

    // Check if student already has an application for this scholarship
    const existingApplication = await prisma.application.findFirst({
      where: {
        studentId: userId,
        scholarshipProgramId,
      },
    });

    if (existingApplication) {
      return res.status(409).json({ 
        error: "You already have an application for this scholarship",
        applicationId: existingApplication.applicationId,
      });
    }

    // Generate application ID
    const applicationId = `NET-2026-${String(Math.floor(Math.random() * 900000) + 100000).padStart(6, '0')}`;

    // Create application with draft status
    const application = await prisma.application.create({
      data: {
        applicationId,
        status: "DRAFT",
        student: { connect: { id: userId } },
        scholarshipProgram: { connect: { id: scholarshipProgramId } },
        personalDetails: personalDetails ? {
          create: {
            fullName: (personalDetails as any).fullName,
            dateOfBirth: (personalDetails as any).dateOfBirth,
            gender: (personalDetails as any).gender,
            phone: (personalDetails as any).phone,
          }
        } : undefined,
        address: address ? {
          create: {
            street: (address as any).street,
            city: (address as any).city,
            district: (address as any).district,
            state: (address as any).state,
            pinCode: (address as any).pinCode,
          }
        } : undefined,
        parentGuardian: parentGuardian ? {
          create: {
            guardianName: (parentGuardian as any).guardianName,
            relationship: (parentGuardian as any).relationship,
            occupation: (parentGuardian as any).occupation,
            contactNumber: (parentGuardian as any).contactNumber,
            income: (parentGuardian as any).income,
          }
        } : undefined,
        academicDetails: academicDetails ? {
          create: {
            schoolCollege: (academicDetails as any).schoolCollege,
            course: (academicDetails as any).course,
            educationLevel: (academicDetails as any).educationLevel,
            academicYear: (academicDetails as any).academicYear,
            yearOfStudy: (academicDetails as any).yearOfStudy,
            marksPercentageCGPA: (academicDetails as any).marksPercentageCGPA,
          }
        } : undefined,
        financialDetails: financialDetails ? {
          create: {
            familyIncome: (financialDetails as any).familyIncome,
            incomeSource: (financialDetails as any).incomeSource,
          }
        } : undefined,
      },
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
      },
    });

    if (!application) {
      return res.status(404).json({ error: "No application found. Start an application first." });
    }

    return res.json({
      application,
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
      await prisma.personalDetails.update({
        where: { applicationId: id },
        data: {
          fullName: (personalDetails as any).fullName,
          dateOfBirth: (personalDetails as any).dateOfBirth,
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
          course: (academicDetails as any).course,
          educationLevel: (academicDetails as any).educationLevel,
          academicYear: (academicDetails as any).academicYear,
          yearOfStudy: (academicDetails as any).yearOfStudy,
          marksPercentageCGPA: (academicDetails as any).marksPercentageCGPA,
        },
      });
    }

    // Update financial details if provided
    if (financialDetails) {
      await prisma.financialDetails.update({
        where: { applicationId: id },
        data: {
          familyIncome: (financialDetails as any).familyIncome,
          incomeSource: (financialDetails as any).incomeSource,
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

    // Check scholarship is active
    if (!application.scholarshipProgram.isActive) {
      return res.status(400).json({ error: "Scholarship program is not currently active" });
    }

    // Check payment is successful
    const payment = await prisma.payment.findFirst({
      where: { applicationId: application.applicationId },
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

    // Check required documents exist (max 4, at least some required documents)
    const documentCount = await prisma.applicationDocument.count({
      where: { applicationId: application.applicationId },
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