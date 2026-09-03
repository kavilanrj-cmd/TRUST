// Admin user management (founder only for user admin).
import { Router, Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import prisma from "../utils/db";
import { authenticate, requirePermission, managementRoles } from "../utils/auth";
import { PERMISSIONS, sanitizePermissionList, getPermissions } from "../utils/roles";
import { auditContextFromRequest, logAudit } from "../utils/audit";

const router = Router();

const ROLE_SET = ["FOUNDER", "ADMIN", "REVIEWER"];

const createUserSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  role: z.enum(["FOUNDER", "ADMIN", "REVIEWER"]),
  permissions: z.array(z.string()).optional().default([]),
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  role: z.enum(["FOUNDER", "ADMIN", "REVIEWER"]).optional(),
  isActive: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
  resetPassword: z.string().min(8).max(200).optional(),
});

// GET /api/admin/users
router.get(
  "/users",
  authenticate,
  requirePermission(PERMISSIONS.users_manage),
  async (_req: Request, res: Response) => {
    try {
      const users = await prisma.user.findMany({
        where: { role: { in: ROLE_SET } },
        select: {
          id: true, name: true, email: true, role: true, isActive: true,
          isFounderProtected: true, permissions: true, lastLoginAt: true,
          createdAt: true, createdById: true,
        },
        orderBy: { createdAt: "asc" },
      });
      return res.json({ users });
    } catch (error) {
      console.error("Admin users list error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/admin/users — create a staff account
router.post(
  "/users",
  authenticate,
  requirePermission(PERMISSIONS.users_manage),
  async (req: Request, res: Response) => {
    try {
      const parsed = createUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      }
      const data = parsed.data;
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing) return res.status(409).json({ error: "A user with this email already exists" });

      // Only founder can create other founders.
      if (data.role === "FOUNDER") {
        return res.status(403).json({ error: "Only the founder account can be a founder" });
      }

      const hashed = await bcrypt.hash(data.password, 10);
      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashed,
          role: data.role as "ADMIN" | "REVIEWER",
          emailVerified: new Date(),
          permissions: data.role === "ADMIN" ? sanitizePermissionList(data.permissions) : null,
          createdById: (req as any).authUser.id,
        },
        select: { id: true, name: true, email: true, role: true, isActive: true },
      });
      logAudit(auditContextFromRequest(req), "user.created", "User", user.id, { role: user.role, email: user.email });
      return res.status(201).json({ message: "User created", user });
    } catch (error) {
      console.error("Admin create user error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /api/admin/users/:id
router.patch(
  "/users/:id",
  authenticate,
  requirePermission(PERMISSIONS.users_manage),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const parsed = updateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      }
      const data = parsed.data;
      const target = await prisma.user.findUnique({ where: { id } });
      if (!target) return res.status(404).json({ error: "User not found" });

      const actor = (req as any).authUser;

      // Last-founder protection: never deactivate or demote the last active founder.
      if (target.isFounderProtected || (target.role === "FOUNDER" && target.isActive)) {
        const activeFounders = await prisma.user.count({
          where: { role: "FOUNDER", isActive: true },
        });
        if (target.isFounderProtected) {
          if (data.isActive === false || (data.role && data.role !== "FOUNDER")) {
            return res.status(403).json({ error: "The protected founder account cannot be deactivated or demoted" });
          }
        } else if (activeFounders <= 1) {
          if (data.isActive === false || (data.role && data.role !== "FOUNDER")) {
            return res.status(403).json({ error: "Cannot deactivate or demote the last active founder" });
          }
        }
      }

      // Only a founder can change another user's role to/from FOUNDER.
      if (data.role) {
        if (data.role === "FOUNDER" && actor.role !== "FOUNDER") {
          return res.status(403).json({ error: "Only the founder can grant founder role" });
        }
        if (target.role === "FOUNDER" && data.role !== "FOUNDER" && actor.role !== "FOUNDER") {
          return res.status(403).json({ error: "Only the founder can change a founder's role" });
        }
      }

      if (data.role === "FOUNDER" && actor.role !== "FOUNDER") {
        return res.status(403).json({ error: "Only the founder can create/promote founders" });
      }

      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.role) updateData.role = data.role;
      if (data.permissions) {
        // Only grant permissions the actor themselves holds (privilege escalation guard),
        // and never founder-only permissions to non-founders.
        const actorPerms = getPermissions(actor);
        const safe = sanitizePermissionList(data.permissions).filter((p) => actorPerms.includes(p));
        if (target.role !== "ADMIN") updateData.permissions = null;
        else updateData.permissions = safe;
      }
      if (data.resetPassword) {
        updateData.password = await bcrypt.hash(data.resetPassword, 10);
      }

      const updated = await prisma.user.update({
        where: { id },
        data: updateData,
        select: { id: true, name: true, email: true, role: true, isActive: true, permissions: true },
      });

      logAudit(auditContextFromRequest(req), "user.updated", "User", id, {
        fields: Object.keys(updateData),
      });
      return res.json({ message: "User updated", user: updated });
    } catch (error) {
      console.error("Admin update user error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
