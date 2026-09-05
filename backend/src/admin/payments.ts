// Admin payment management: list all payments across applications.
import { Router, Request, Response } from "express";
import prisma from "../utils/db";
import { authenticate, requirePermission } from "../utils/auth";
import { PERMISSIONS } from "../utils/roles";

const router = Router();

const VALID_STATUSES = ["SUCCESS", "FAILED", "PENDING", "REFUNDED", "PENDING_VERIFICATION", "VERIFIED", "REJECTED"];

// GET /api/admin/payments — list payments with filters + pagination
router.get(
  "/payments",
  authenticate,
  requirePermission(PERMISSIONS.applications_view),
  async (req: Request, res: Response) => {
    try {
      const {
        status, search, from, to, page = "1", limit = "15", sort = "desc",
      } = req.query as any;

      const pageNum = parseInt(page, 10) || 1;
      const limitNum = Math.min(parseInt(limit, 10) || 15, 100);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};
      if (status) where.status = status;
      if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(from);
        if (to) {
          const toDate = new Date(to);
          toDate.setHours(23, 59, 59, 999);
          where.createdAt.lte = toDate;
        }
      }
      if (search) {
        const s = String(search);
        where.OR = [
          { razorpayOrderId: { contains: s, mode: "insensitive" } },
          { razorpayPaymentId: { contains: s, mode: "insensitive" } },
          { application: { applicationId: { contains: s, mode: "insensitive" } } },
          { application: { personalDetails: { fullName: { contains: s, mode: "insensitive" } } } },
          { application: { student: { email: { contains: s, mode: "insensitive" } } } },
        ];
      }

      const orderBy = sort === "asc" ? { createdAt: "asc" as const } : { createdAt: "desc" as const };

      const [payments, total] = await prisma.$transaction([
        prisma.payment.findMany({
          where,
          include: {
            application: {
              select: {
                id: true,
                applicationId: true,
                student: { select: { name: true, email: true } },
                personalDetails: { select: { fullName: true } },
              },
            },
          },
          orderBy,
          skip,
          take: limitNum,
        }),
        prisma.payment.count({ where }),
      ]);

      return res.json({ payments, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
    } catch (error) {
      console.error("Admin payments list error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/admin/payments/export — CSV export of payments
router.get(
  "/payments/export",
  authenticate,
  requirePermission(PERMISSIONS.applications_export),
  async (req: Request, res: Response) => {
    try {
      const { status, search } = req.query as any;
      const where: any = {};
      if (status) where.status = status;
      if (search) {
        const s = String(search);
        where.OR = [
          { razorpayOrderId: { contains: s, mode: "insensitive" } },
          { razorpayPaymentId: { contains: s, mode: "insensitive" } },
          { application: { applicationId: { contains: s, mode: "insensitive" } } },
        ];
      }

      const payments = await prisma.payment.findMany({
        where,
        include: {
          application: {
            select: {
              applicationId: true,
              student: { select: { name: true, email: true } },
              personalDetails: { select: { fullName: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const escape = (v: unknown) => {
        const s = v === null || v === undefined ? "" : String(v);
        return `"${s.replace(/"/g, '""')}"`;
      };

      const header = [
        "Application ID", "Applicant Name", "Email", "Amount", "Currency",
        "Order Ref", "Transaction ID / UTR", "Status", "Payment Date", "Created At",
      ].join(",");
      const rows = payments.map((p: any) =>
        [
          p.application?.applicationId || "",
          p.application?.personalDetails?.fullName || p.application?.student?.name || "",
          p.application?.student?.email || "",
          p.amount,
          p.currency || "INR",
          p.razorpayOrderId || "",
          p.razorpayPaymentId || "",
          p.status,
          p.paymentDate || "",
          p.createdAt,
        ].map(escape).join(",")
      );

      res.header("Content-Type", "text/csv; charset=utf-8");
      res.header("Content-Disposition", `attachment; filename="payments-${new Date().toISOString().split("T")[0]}.csv"`);
      return res.send([header, ...rows].join("\n"));
    } catch (error) {
      console.error("Admin payments export error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/admin/payments/:id/verify — admin manually verifies a UPI payment,
// recording it as VERIFIED so the applicant's payment step reflects a verified
// state. Separation of concerns: verifying the payment does not itself approve
// the scholarship application (that is a separate APPOVED/REJECTED decision).
router.post(
  "/payments/:id/verify",
  authenticate,
  requirePermission(PERMISSIONS.applications_status),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const authUser = (req as any).authUser as { id: string } | undefined;

      const payment = await prisma.payment.findUnique({ where: { id } });
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      const updated = await prisma.payment.update({
        where: { id },
        data: {
          status: "VERIFIED",
          paymentDate: payment.paymentDate || new Date(),
          verifiedById: authUser?.id || payment.verifiedById,
          verifiedAt: new Date(),
          verificationNote: null,
        },
      });

      return res.json({
        message: "Payment verified successfully",
        id: updated.id,
        status: updated.status,
        verifiedAt: updated.verifiedAt,
      });
    } catch (error) {
      console.error("Admin verify payment error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/admin/payments/:id/reject — admin rejects a UPI payment submission,
// returning it to a state where the applicant can re-enter a correct UTR.
router.post(
  "/payments/:id/reject",
  authenticate,
  requirePermission(PERMISSIONS.applications_status),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { note } = req.body || {};
      const authUser = (req as any).authUser as { id: string } | undefined;

      const payment = await prisma.payment.findUnique({ where: { id } });
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      const reason = typeof note === "string" ? String(note).trim() : "";
      if (!reason) {
        return res.status(400).json({ error: "A rejection reason is required" });
      }

      const updated = await prisma.payment.update({
        where: { id },
        data: {
          status: "REJECTED",
          verifiedById: authUser?.id || payment.verifiedById,
          verifiedAt: new Date(),
          verificationNote: reason,
        },
      });

      return res.json({
        message: "Payment rejected",
        id: updated.id,
        status: updated.status,
        verificationNote: updated.verificationNote,
      });
    } catch (error) {
      console.error("Admin reject payment error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export { VALID_STATUSES };
export default router;
