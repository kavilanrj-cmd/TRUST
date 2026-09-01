// Authentication + authorization middleware + JWT helpers.
// Admin sessions are delivered as HTTP-only cookies; the Authorization header is
// also accepted for non-browser tooling. Enforcement is always server-side.

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "./db";
import { Permission, hasPermission, ROLES } from "./roles";

const JWT_SECRET = process.env.JWT_SECRET || "neelakannu-educational-trust-jwt-super-secret-key-2026";

export const ADMIN_COOKIE = "net_admin_token";

export interface AuthUser {
  id: string;
  userId?: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  permissions?: unknown;
}

export function signAdminToken(user: { id: string; role: string }): string {
  return jwt.sign(
    { userId: user.id, role: user.role, scope: "admin" },
    JWT_SECRET,
    { expiresIn: "8h" }
  );
}

export function cookieOptions(secure: boolean) {
  const crossSite = process.env.NODE_ENV === "production" && secure;
  return {
    httpOnly: true,
    secure: secure ?? process.env.NODE_ENV === "production",
    sameSite: crossSite ? ("none" as const) : ("lax" as const),
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
    path: "/",
  };
}

// Extract a raw JWT from cookie or Authorization header.
function extractToken(req: Request): string | null {
  const fromCookie = req.cookies?.[ADMIN_COOKIE];
  if (fromCookie) return fromCookie;
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return null;
}

// Loads the current user (if authenticated) and attaches to req. Does not fail
// the request if unauthenticated (used by public endpoints to optionally know the user).
export async function loadUser(req: Request): Promise<AuthUser | null> {
  const token = extractToken(req);
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        permissions: true,
      },
    });
    if (!user || !user.isActive) return null;
    const authUser = { ...(user as AuthUser), userId: user.id };
    return authUser;
  } catch {
    return null;
  }
}

// Middleware: requires a valid, active, authenticated user.
export function authenticate(req: Request, res: Response, next: NextFunction) {
  (async () => {
    const user = await loadUser(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    (req as any).user = user;
    (req as any).authUser = user;
    next();
  })();
}

// Middleware: requires one of the given roles.
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).authUser;
    if (!user) return res.status(401).json({ error: "Authentication required" });
    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
}

// Middleware: requires a specific permission.
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).authUser;
    if (!user) return res.status(401).json({ error: "Authentication required" });
    if (!hasPermission(user, permission)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
}

// Convenience: any admin-staff member (founder/admin/reviewer) but NOT students.
export const adminOrStaff = [ROLES.FOUNDER, ROLES.ADMIN, ROLES.REVIEWER];

// Convenience: founder or admin (management users who can change things).
export const managementRoles = [ROLES.FOUNDER, ROLES.ADMIN];
