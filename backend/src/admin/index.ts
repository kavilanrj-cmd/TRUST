// Admin API entry point: auth (login/logout/me) + mounts all admin sub-routers.
import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../utils/db";
import {
  signAdminToken, cookieOptions, ADMIN_COOKIE,
  loadUser,
} from "../utils/auth";
import { auditContextFromRequest, logAudit } from "../utils/audit";
import { getPermissions } from "../utils/roles";

import dashboardRouter from "./dashboard";
import applicationsRouter from "./applications";
import documentsRouter from "./documents";
import scholarshipsRouter from "./scholarships";
import announcementsRouter from "./announcements";
import websiteRouter, { routerPublic } from "./website";
import mediaRouter from "./media";
import usersRouter from "./users";
import settingsRouter from "./settings";
import auditRouter from "./audit";
import notificationsRouter from "./notifications";
import searchRouter from "./search";
import contactRouter from "./contact";
import paymentsRouter from "./payments";

const router = Router();
const staffRoles = ["FOUNDER", "ADMIN", "REVIEWER"];

// Bootstrap: if no staff accounts exist, create a founder from env (development initial setup).
export async function bootstrapFounder(): Promise<void> {
  console.log("🔄 Bootstrap founder: starting...");
  try {
    // Ensure database is connected
    await prisma.$connect();
    console.log("🔄 Bootstrap founder: database connected");
    const staffCount = await prisma.user.count({ where: { role: { in: staffRoles } } });
    console.log("🔄 Bootstrap founder: staff count =", staffCount);
    if (staffCount === 0) {
      const email = process.env.FOUNDER_EMAIL;
      const password = process.env.FOUNDER_PASSWORD;
      console.log("🔄 Bootstrap founder: email =", email, "password set =", !!password);
      if (email && password) {
        const hashed = await bcrypt.hash(password, 10);
        await prisma.user.create({
          data: {
            name: "Founder",
            email,
            password: hashed,
            role: "FOUNDER",
            emailVerified: true,
            isFounderProtected: true,
          },
        });
        console.log("✅ Bootstrap founder account created from environment variables");
      } else {
        console.warn("⚠️  No staff accounts and no FOUNDER_EMAIL/FOUNDER_PASSWORD set. Admin login unavailable.");
      }
    } else {
      console.log("🔄 Bootstrap founder: staff already exists, skipping creation");
    }
  } catch (e) {
    console.error("Bootstrap founder failed (non-fatal):", e);
  }
}

// POST /api/admin/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log("🔐 Login attempt:", email);
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    console.log("🔐 User found:", user ? { id: user.id, email: user.email, role: user.role, isActive: user.isActive } : null);
    if (!user) {
      logAudit(auditContextFromRequest(req), "admin.login.failed", "User", undefined, { email });
      return res.status(401).json({ error: "Invalid email or password" });
    }
    if (!staffRoles.includes(user.role)) {
      logAudit(auditContextFromRequest(req), "admin.login.denied_nonstaff", "User", user.id);
      return res.status(403).json({ error: "Access denied" });
    }
    if (!user.isActive) {
      logAudit(auditContextFromRequest(req), "admin.login.denied_inactive", "User", user.id);
      return res.status(403).json({ error: "Your account is deactivated" });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log("🔐 Password match:", passwordMatch);
    if (!passwordMatch) {
      logAudit(auditContextFromRequest(req), "admin.login.failed", "User", user.id);
      return res.status(401).json({ error: "Invalid email or password" });
    }
    // Allow admin login even if email not verified (staff are provisioned by founder).
    const token = signAdminToken({ id: user.id, role: user.role });
    res.cookie(ADMIN_COOKIE, token, cookieOptions(process.env.NODE_ENV === "production"));

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: req.ip || (req.headers["x-forwarded-for"] as string) || null,
      },
    });
    logAudit(auditContextFromRequest(req), "admin.login", "User", user.id);

    return res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        permissions: getPermissions(user),
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/logout
router.post("/logout", async (req: Request, res: Response) => {
  logAudit(auditContextFromRequest(req), "admin.logout", "User", (req as any).authUser?.id);
  res.clearCookie(ADMIN_COOKIE, { path: "/" });
  return res.json({ message: "Logged out" });
});

// GET /api/admin/me — current admin session
router.get("/me", async (req: Request, res: Response) => {
  const user = await loadUser(req);
  if (!user || !staffRoles.includes(user.role)) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      permissions: getPermissions(user),
    },
  });
});

// Health of admin routes
router.get("/health", async (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "admin-api" });
});

// Mount sub-routers (each enforces its own permissions)
router.use(dashboardRouter);
router.use(applicationsRouter);
router.use("/applications/documents", documentsRouter);
router.use(scholarshipsRouter);
router.use(announcementsRouter);
router.use(websiteRouter);
router.use(mediaRouter);
router.use(usersRouter);
router.use(settingsRouter);
router.use(auditRouter);
router.use(notificationsRouter);
router.use(searchRouter);
router.use(contactRouter);
router.use(paymentsRouter);

export { routerPublic };
export default router;
