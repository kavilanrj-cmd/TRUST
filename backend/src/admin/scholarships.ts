// Admin scholarship management: create, edit, activate/deactivate.
import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../utils/db";
import { authenticate, requirePermission } from "../utils/auth";
import { PERMISSIONS } from "../utils/roles";
import { auditContextFromRequest, logAudit } from "../utils/audit";

const router = Router();

const EDUCATION_LEVELS = ["HIGH_SCHOOL", "DIPLOMA", "UNDERGRADUATE", "POSTGRADUATE"];

const requiredDocSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  maxFileSize: z.number().int().positive().default(5_242_880),
  allowedTypes: z.array(z.string()).default(["application/pdf", "image/jpeg", "image/png"]),
  isRequired: z.boolean().default(true),
});

const scholarshipSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  educationLevels: z.array(z.enum(["HIGH_SCHOOL", "DIPLOMA", "UNDERGRADUATE", "POSTGRADUATE"])).default([]),
  minimumMarks: z.number().min(0).optional().nullable(),
  minimumCGPA: z.number().min(0).optional().nullable(),
  maximumFamilyIncome: z.number().min(0).optional().nullable(),
  applicationFee: z.number().min(0),
  applicationDeadline: z.string().refine((v) => !isNaN(Date.parse(v)), {
    message: "Invalid date",
  }),
  isActive: z.boolean().default(true),
  requiredDocuments: z.array(requiredDocSchema).optional().default([]),
});

// GET /api/admin/scholarships
router.get(
  "/scholarships",
  authenticate,
  requirePermission(PERMISSIONS.scholarships_manage),
  async (req: Request, res: Response) => {
    try {
      const scholarships = await prisma.scholarshipProgram.findMany({
        include: { requiredDocuments: true, _count: { select: { applications: true } } },
        orderBy: { createdAt: "desc" },
      });
      return res.json({ scholarships });
    } catch (error) {
      console.error("Admin scholarships list error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/admin/scholarships/:id
router.get(
  "/scholarships/:id",
  authenticate,
  requirePermission(PERMISSIONS.scholarships_manage),
  async (req: Request, res: Response) => {
    try {
      const scholarship = await prisma.scholarshipProgram.findUnique({
        where: { id: req.params.id },
        include: { requiredDocuments: true, applications: { select: { id: true, applicationId: true, status: true, createdAt: true } } },
      });
      if (!scholarship) return res.status(404).json({ error: "Scholarship not found" });
      return res.json({ scholarship });
    } catch (error) {
      console.error("Admin scholarship detail error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/admin/scholarships
router.post(
  "/scholarships",
  authenticate,
  requirePermission(PERMISSIONS.scholarships_manage),
  async (req: Request, res: Response) => {
    try {
      const parsed = scholarshipSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      }
      const data = parsed.data;
      const scholarship = await prisma.scholarshipProgram.create({
        data: {
          name: data.name,
          description: data.description || null,
          educationLevels: data.educationLevels.length ? data.educationLevels : EDUCATION_LEVELS,
          minimumMarks: data.minimumMarks,
          minimumCGPA: data.minimumCGPA,
          maximumFamilyIncome: data.maximumFamilyIncome,
          applicationFee: data.applicationFee,
          applicationDeadline: new Date(data.applicationDeadline),
          isActive: data.isActive,
          requiredDocuments: {
            create: data.requiredDocuments.map((d) => ({
              name: d.name,
              description: d.description,
              maxFileSize: d.maxFileSize,
              allowedTypes: d.allowedTypes,
              isRequired: d.isRequired,
            })),
          },
        },
        include: { requiredDocuments: true },
      });
      logAudit(auditContextFromRequest(req), "scholarship.created", "ScholarshipProgram", scholarship.id, { name: scholarship.name });
      return res.status(201).json({ message: "Scholarship created", scholarship });
    } catch (error) {
      console.error("Admin create scholarship error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /api/admin/scholarships/:id
router.patch(
  "/scholarships/:id",
  authenticate,
  requirePermission(PERMISSIONS.scholarships_manage),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const exists = await prisma.scholarshipProgram.findUnique({ where: { id } });
      if (!exists) return res.status(404).json({ error: "Scholarship not found" });

      const parsed = scholarshipSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      }
      const data = parsed.data as z.infer<typeof scholarshipSchema>;

      const scholarship = await prisma.scholarshipProgram.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.educationLevels !== undefined ? { educationLevels: data.educationLevels } : {}),
          ...(data.minimumMarks !== undefined ? { minimumMarks: data.minimumMarks } : {}),
          ...(data.minimumCGPA !== undefined ? { minimumCGPA: data.minimumCGPA } : {}),
          ...(data.maximumFamilyIncome !== undefined ? { maximumFamilyIncome: data.maximumFamilyIncome } : {}),
          ...(data.applicationFee !== undefined ? { applicationFee: data.applicationFee } : {}),
          ...(data.applicationDeadline !== undefined ? { applicationDeadline: new Date(data.applicationDeadline) } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        },
        include: { requiredDocuments: true },
      });
      logAudit(auditContextFromRequest(req), "scholarship.updated", "ScholarshipProgram", id, { name: scholarship.name });
      return res.json({ message: "Scholarship updated", scholarship });
    } catch (error) {
      console.error("Admin update scholarship error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /api/admin/scholarships/:id/toggle
router.patch(
  "/scholarships/:id/toggle",
  authenticate,
  requirePermission(PERMISSIONS.scholarships_manage),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const exists = await prisma.scholarshipProgram.findUnique({ where: { id } });
      if (!exists) return res.status(404).json({ error: "Scholarship not found" });
      const scholarship = await prisma.scholarshipProgram.update({
        where: { id },
        data: { isActive: !exists.isActive },
      });
      logAudit(auditContextFromRequest(req), "scholarship.toggled", "ScholarshipProgram", id, { isActive: scholarship.isActive });
      return res.json({ message: "Scholarship updated", scholarship });
    } catch (error) {
      console.error("Admin toggle scholarship error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
