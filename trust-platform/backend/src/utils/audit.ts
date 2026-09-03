// Audit logging + admin notification helpers.
// Audit logging must never break the primary operation, so failures are swallowed.

import { Request } from "express";
import prisma from "./db";

export interface AuditContext {
  actorId?: string | null;
  actorName?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

export function auditContextFromRequest(req: Request): AuditContext {
  const user = (req as any).authUser || (req as any).user;
  return {
    actorId: user?.id || null,
    actorName: user?.name || user?.email || null,
    ip: req.ip || (req.headers["x-forwarded-for"] as string) || null,
    userAgent: (req.headers["user-agent"] as string) || null,
  };
}

export async function logAudit(
  ctx: AuditContext,
  action: string,
  targetType?: string,
  targetId?: string | string[],
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: ctx.actorId || null,
        actorName: ctx.actorName || null,
        action,
        targetType: targetType || null,
        targetId: targetId ? String(targetId) : null,
        metadata: (metadata as any) || undefined,
        ip: ctx.ip || null,
        userAgent: ctx.userAgent || null,
      },
    });
  } catch (e) {
    console.error("Audit log write failed (non-fatal):", e);
  }
}

export async function createAdminNotification(data: {
  userId: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
  createdById?: string;
}): Promise<void> {
  try {
    await prisma.adminNotification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message || null,
        link: data.link || null,
        createdById: data.createdById || null,
      },
    });
  } catch (e) {
    console.error("Notification write failed (non-fatal):", e);
  }
}

// Notify all active staff (founder + admin + reviewer).
export async function notifyAllStaff(payload: {
  type: string;
  title: string;
  message?: string;
  link?: string;
  createdById?: string;
  excludeUserId?: string;
}): Promise<void> {
  try {
    const staff = await prisma.user.findMany({
      where: {
        role: { in: ["FOUNDER", "ADMIN", "REVIEWER"] },
        isActive: true,
        ...(payload.excludeUserId ? { id: { not: payload.excludeUserId } } : {}),
      },
      select: { id: true },
    });
    await prisma.adminNotification.createMany({
      data: staff.map((u: any) => ({
        userId: u.id,
        type: payload.type,
        title: payload.title,
        message: payload.message || null,
        link: payload.link || null,
        createdById: payload.createdById || null,
      })),
    });
  } catch (e) {
    console.error("Notify staff failed (non-fatal):", e);
  }
}
