// Scholarship API routes for Neelakannu Educational Trust Platform
// Handles: Get scholarships, Get scholarship by ID, Eligibility check

import express, { Request, Response } from "express";
import prisma from "../utils/db";

const router = express.Router();

// Get all scholarships (public)
router.get("/", async (req: Request, res: Response) => {
  try {
    const scholarships = await prisma.scholarshipProgram.findMany({
      where: { isActive: true },
      include: {
        requiredDocuments: true,
      },
    });

// Format response - only include configurable fields
    const formattedScholarships = scholarships.map(
      (scholarship: { id: string; name: string; description: string; educationLevels: any[]; minimumMarks: number | null; minimumCGPA: number | null; maximumFamilyIncome: number | null; applicationFee: number; applicationDeadline: Date | null; isActive: boolean; requiredDocuments: any[] }) => ({
        id: scholarship.id,
        name: scholarship.name,
        description: scholarship.description,
        educationLevels: scholarship.educationLevels,
        minimumMarks: scholarship.minimumMarks,
        minimumCGPA: scholarship.minimumCGPA,
        maximumFamilyIncome: scholarship.maximumFamilyIncome,
        applicationFee: scholarship.applicationFee,
        applicationDeadline: scholarship.applicationDeadline,
        isActive: scholarship.isActive,
        requiredDocuments: scholarship.requiredDocuments.map(
          (doc: { id: string; name: string; description?: string; maxFileSize: number; allowedTypes: string[]; isRequired: boolean }) => ({
            id: doc.id,
            name: doc.name,
            description: doc.description,
            maxFileSize: doc.maxFileSize,
            allowedTypes: doc.allowedTypes,
            isRequired: doc.isRequired,
          })
        ),
      })
    );
  } catch (error) {
    console.error("Get scholarships error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get a single scholarship by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const scholarship = await prisma.scholarshipProgram.findUnique({
      where: { id },
      include: {
        requiredDocuments: true,
      },
    });

    if (!scholarship) {
      return res.status(404).json({ error: "Scholarship not found" });
    }

    // Check if scholarship is active
    if (!scholarship.isActive) {
      return res.status(404).json({ error: "Scholarship is not currently active" });
    }

    const formattedScholarship = {
      id: scholarship.id,
      name: scholarship.name,
      description: scholarship.description,
      educationLevels: scholarship.educationLevels,
      minimumMarks: scholarship.minimumMarks,
      minimumCGPA: scholarship.minimumCGPA,
      maximumFamilyIncome: scholarship.maximumFamilyIncome,
      applicationFee: scholarship.applicationFee,
      applicationDeadline: scholarship.applicationDeadline,
      isActive: scholarship.isActive,
      requiredDocuments: scholarship.requiredDocuments.map(
          (doc: { id: string; name: string; description?: string; maxFileSize: number; allowedTypes: string[]; isRequired: boolean }) => ({
        id: doc.id,
        name: doc.name,
        description: doc.description,
        maxFileSize: doc.maxFileSize,
        allowedTypes: doc.allowedTypes,
        isRequired: doc.isRequired,
      })),
    };

    return res.json(formattedScholarship);
  } catch (error) {
    console.error("Get scholarship error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Check eligibility for a scholarship
router.post("/eligibility-check", async (req: Request, res: Response) => {
  try {
    const { scholarshipId, educationLevel, marks, familyIncome } = req.body;

    // Validate input
    if (!scholarshipId) {
      return res.status(400).json({ error: "Scholarship ID is required" });
    }

    if (!educationLevel) {
      return res.status(400).json({ error: "Education level is required" });
    }

    if (marks === undefined || marks === null) {
      return res.status(400).json({ error: "Marks/CGPA is required" });
    }

    if (familyIncome === undefined || familyIncome === null) {
      return res.status(400).json({ error: "Family income is required" });
    }

    // Find the scholarship
    const scholarship = await prisma.scholarshipProgram.findUnique({
      where: { id: scholarshipId },
      include: {
        requiredDocuments: true,
      },
    });

    if (!scholarship) {
      return res.status(404).json({ error: "Scholarship not found" });
    }

    if (!scholarship.isActive) {
      return res.status(400).json({ error: "Scholarship is not currently active" });
    }

    // Apply eligibility rules
    let isEligible = true;
    let reason: string | null = null;

    // Check education level
    if (scholarship.educationLevels && scholarship.educationLevels.length > 0) {
      const allowedLevels = scholarship.educationLevels.map(
        (l: { toString: () => string }) => l.toString()
      );
      if (!allowedLevels.includes(educationLevel)) {
        isEligible = false;
        reason = `Education level "${educationLevel}" is not eligible for this scholarship. Allowed levels: ${allowedLevels.join(", ")}`;
      }
    }

    // Check minimum marks
    if (isEligible && scholarship.minimumMarks && marks < scholarship.minimumMarks) {
      isEligible = false;
      reason = `Minimum marks requirement not met. You obtained ${marks}, but the minimum required is ${scholarship.minimumMarks}.`;
    }

    // Check minimum CGPA
    if (isEligible && scholarship.minimumCGPA && marks < scholarship.minimumCGPA) {
      isEligible = false;
      reason = `Minimum CGPA requirement not met. You have ${marks}, but the minimum required is ${scholarship.minimumCGPA}.`;
    }

    // Check maximum family income
    if (isEligible && scholarship.maximumFamilyIncome && familyIncome > scholarship.maximumFamilyIncome) {
      isEligible = false;
      reason = `Family income exceeds the permitted limit. Your income: ${familyIncome}, maximum allowed: ${scholarship.maximumFamilyIncome}.`;
    }

    return res.json({
      eligible: isEligible,
      scholarshipId: scholarship.id,
      scholarshipName: scholarship.name,
      reason: reason,
    });
  } catch (error) {
    console.error("Eligibility check error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;