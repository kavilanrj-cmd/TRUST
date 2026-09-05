// Payment routes for Neelakannu Educational Trust Platform
// Handles: Razorpay order creation, payment verification, webhook handling.
// The Razorpay secret is only ever used on the server (never the frontend).

import express, { Request, Response } from "express";
import prisma from "../utils/db";
import crypto from "crypto";
import path from "path";
import { getApplicationFeeConfig, UPI_QR_KEY, UPI_QR_MIME_KEY, UPI_QR_PROVIDER_KEY } from "../utils/applicationFee";
import {
  getDocumentBuffer,
  deleteDocumentObject,
  safeFileName,
  saveDocumentBuffer,
  getDocumentBucket,
  screenshotUpload,
} from "../utils/storage";

const router = express.Router();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "";

const RAZORPAY_ORDERS_URL = "https://api.razorpay.com/v1/orders";

function razorpayAuthHeader(): string {
  return "Basic " + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
}

// Create a Razorpay order and record it in the database as a pending payment.
router.post("/create-order", async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.body;
    const userId = (req as any).user?.userId;

    if (!applicationId) {
      return res.status(400).json({ error: "Application ID is required" });
    }

    // Verify application ownership
    const application = await prisma.application.findFirst({
      where: { applicationId, studentId: userId },
    });

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    if (application.status !== "DRAFT") {
      return res.status(400).json({ error: "Payment can only be made for draft applications" });
    }

    const feeConfig = await getApplicationFeeConfig();

    if (!feeConfig.enabled) {
      return res.status(400).json({ error: "Application fee collection is currently disabled" });
    }

    if (feeConfig.amount <= 0) {
      return res.status(400).json({ error: "Application fee has not been configured" });
    }

    // Return an already-final payment if one exists for this application, so a
    // returning applicant sees their actual lifecycle status (pending
    // verification, verified, rejected) and is never auto-marked successful.
    const existingPayment = await prisma.payment.findFirst({
      where: { applicationId: application.id },
      orderBy: { createdAt: "desc" },
    });

    if (existingPayment) {
      return res.json({
        id: existingPayment.razorpayOrderId,
        orderId: existingPayment.razorpayOrderId,
        paymentId: existingPayment.razorpayPaymentId,
        amount: existingPayment.amount,
        currency: existingPayment.currency || "INR",
        status: existingPayment.status,
        txnId: existingPayment.razorpayPaymentId,
        paymentMethod: "manual_upi",
        upi: feeConfig.upi || { vpa: "", instructions: "", qrConfigured: false, qrUrl: "" },
        feeNotice: "Review the QR code and pay the application fee, then submit your UPI transaction reference.",
      });
    }

    // --- Temporary UPI QR payment method ---
    // When paymentMethod is "manual_upi" (or legacy "upi") we do not call
    // Razorpay. We create a PENDING payment row and return the UPI QR details
    // for the applicant to scan & pay. The fee amount is always the
    // admin-controlled app.applicationFee value. When Razorpay is added later,
    // paymentMethod becomes "razorpay" and this branch is skipped in favour of
    // the existing order-creation flow below.
    if (feeConfig.paymentMethod === "manual_upi") {
      const upiRef = `upi_${crypto.randomUUID()}`;
      let payment;
      if (existingPayment) {
        payment = await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            razorpayOrderId: upiRef,
            razorpayPaymentId: null,
            amount: feeConfig.amount,
            currency: "INR",
            status: "PENDING",
            paymentMethod: "MANUAL_UPI",
            paymentDate: null,
            verifiedById: null,
            verifiedAt: null,
            verificationNote: null,
          },
        });
      } else {
        payment = await prisma.payment.create({
          data: {
            applicationId: application.id,
            razorpayOrderId: upiRef,
            amount: feeConfig.amount,
            currency: "INR",
            status: "PENDING",
            paymentMethod: "MANUAL_UPI",
          },
        });
      }

      return res.json({
        id: upiRef,
        orderId: upiRef,
        paymentId: payment.razorpayPaymentId || null,
        amount: feeConfig.amount,
        currency: "INR",
        status: "PENDING",
        paymentMethod: "manual_upi",
        upi: feeConfig.upi || { vpa: "", instructions: "", qrConfigured: false, qrUrl: "" },
        feeNotice: "Scan the UPI QR code and pay the application fee, then enter your UPI transaction reference below.",
      });
    }

    // --- Razorpay order creation (future / when paymentMethod == "razorpay") ---
    // Amount in paise
    const orderAmount = Math.round(feeConfig.amount * 100);
    const receipt = `NET_${application.applicationId}`;

    let razorpayOrder: { id: string; amount: number; currency: string; receipt: string };
    try {
      const response = await fetch(RAZORPAY_ORDERS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: razorpayAuthHeader(),
        },
        body: JSON.stringify({
          amount: orderAmount,
          currency: "INR",
          receipt,
          payment_capture: 1,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.error("Razorpay create order failed:", response.status, data);
        return res.status(502).json({ error: "Unable to create payment order. Please try again." });
      }
      razorpayOrder = data;
    } catch (e) {
      console.error("Razorpay create order network error:", e);
      return res.status(502).json({ error: "Payment service temporarily unavailable. Please try again." });
    }

    // Create/replace the pending payment row with the real Razorpay order id.
    let payment;
    if (existingPayment) {
      payment = await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          razorpayOrderId: razorpayOrder.id,
          razorpayPaymentId: null,
          amount: feeConfig.amount,
          currency: "INR",
          status: "PENDING",
          paymentMethod: "RAZORPAY",
          paymentDate: null,
          verifiedById: null,
          verifiedAt: null,
          verificationNote: null,
        },
      });
    } else {
      payment = await prisma.payment.create({
        data: {
          applicationId: application.id,
          razorpayOrderId: razorpayOrder.id,
          amount: feeConfig.amount,
          currency: "INR",
          status: "PENDING",
          paymentMethod: "RAZORPAY",
        },
      });
    }

    const responseBody = {
      id: razorpayOrder.id,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt,
      key: RAZORPAY_KEY_ID,
      paymentId: payment.id,
      status: "PENDING",
    };

    return res.json(responseBody);
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Confirm that an applicant has paid via UPI and submitted their transaction
// reference. The payment is recorded as PENDING_VERIFICATION and must be
// verified by an admin before the application is fully processed.
router.post("/confirm", async (req: Request, res: Response) => {
  try {
    const { applicationId, upiTransactionId } = req.body;
    const userId = (req as any).user?.userId;

    if (!applicationId || !upiTransactionId) {
      return res.status(400).json({ error: "Application ID and UPI transaction reference are required" });
    }

    const txn = String(upiTransactionId).trim();
    if (!txn) {
      return res.status(400).json({ error: "UPI transaction reference is required" });
    }
    // Sensible length/looks validation for a transaction reference / UTR.
    if (txn.length < 6 || txn.length > 64) {
      return res.status(400).json({ error: "Please enter a valid UPI transaction reference (UTR)." });
    }

    const application = await prisma.application.findFirst({
      where: { applicationId, studentId: userId },
    });
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    const payment = await prisma.payment.findFirst({
      where: { applicationId: application.id },
      orderBy: { createdAt: "desc" },
    });

    // Initial submissions only come from draft applications. A rejected payment
    // can be re-confirmed from a submitted application so the applicant can fix
    // the screenshot / UTR without losing their already-submitted application.
    const resubmittingRejected =
      application.status !== "DRAFT" &&
      payment &&
      ["REJECTED", "NOT_SUBMITTED"].includes(payment.status);
    if (application.status !== "DRAFT" && !resubmittingRejected) {
      return res.status(400).json({ error: "Payment can only be confirmed for draft applications" });
    }

    if (!payment) {
      if (application.status !== "DRAFT") {
        return res.status(400).json({ error: "No payment found for this application" });
      }
      return res.status(400).json({ error: "Please create a payment order first." });
    }

    // Idempotent: an already-verified (or pending) payment keeps its state.
    if (payment.status === "VERIFIED" || payment.status === "SUCCESS") {
      return res.json({
        status: payment.status,
        message: "Payment already verified. You can proceed.",
        paymentId: payment.id,
        txnId: payment.razorpayPaymentId,
      });
    }

    // The applicant must attach a payment screenshot before a manual UPI
    // payment can be marked as pending verification.
    if (!payment.paymentScreenshotKey) {
      return res.status(400).json({
        error: "Please upload your payment screenshot first.",
        code: "PAYMENT_SCREENSHOT_REQUIRED",
      });
    }

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId: txn,
        status: "PENDING_VERIFICATION",
        paymentMethod: "MANUAL_UPI",
        verifiedById: null,
        verifiedAt: null,
        verificationNote: null,
        amount: payment.amount,
        currency: payment.currency || "INR",
      },
    });

    return res.json({
      status: "PENDING_VERIFICATION",
      message: "Payment details submitted. Our team will verify your transaction.",
      paymentId: updated.id,
      txnId: updated.razorpayPaymentId,
    });
  } catch (error) {
    console.error("Confirm UPI payment error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/payments/application/:applicationId/screenshot
// Applicant uploads (or replaces) the payment screenshot used as proof of the
// manual UPI transaction. Attaches to the latest payment row for their
// application (creating a NOT_SUBMITTED payment row if none exists yet). Only
// the application owner can upload; only the owner or staff can retrieve it.
router.post(
  "/application/:applicationId/screenshot",
  screenshotUpload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const { applicationId } = req.params;
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const application = await prisma.application.findFirst({
        where: { applicationId, studentId: userId },
      });
      if (!application) {
        return res.status(404).json({ error: "Application not found or access denied" });
      }

      // Once an application has reached a final state, its payment details are frozen.
      const FINAL = ["APPROVED", "ACCEPTED", "REJECTED", "WITHDRAWN"];
      if (FINAL.includes(application.status)) {
        return res.status(403).json({ error: "Payment details are locked for this application" });
      }

      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { storageKey, storageProvider } = await saveDocumentBuffer(
        file.buffer,
        file.mimetype,
        getDocumentBucket(),
        "payment-screenshots"
      );

      const existingPayment = await prisma.payment.findFirst({
        where: { applicationId: application.id },
        orderBy: { createdAt: "desc" },
      });

      // Replace: delete the previous screenshot object from storage.
      if (existingPayment && existingPayment.paymentScreenshotKey && existingPayment.paymentScreenshotKey !== storageKey) {
        await deleteDocumentObject(
          existingPayment.paymentScreenshotKey,
          existingPayment.paymentScreenshotProvider || "s3"
        ).catch(() => {});
      }

      const screenshotData = {
        paymentScreenshotKey: storageKey,
        paymentScreenshotProvider: storageProvider,
        paymentScreenshotMime: file.mimetype,
        paymentScreenshotName: safeFileName(file.originalname) || path.basename(storageKey),
        paymentScreenshotSize: file.size,
        paymentScreenshotUploadedAt: new Date(),
      };

      let payment;
      if (existingPayment) {
        payment = await prisma.payment.update({
          where: { id: existingPayment.id },
          data: screenshotData,
        });
      } else {
        const feeConfig = await getApplicationFeeConfig();
        payment = await prisma.payment.create({
          data: {
            applicationId: application.id,
            razorpayOrderId: `upi_${crypto.randomUUID()}`,
            amount: feeConfig.enabled && feeConfig.amount > 0 ? feeConfig.amount : 0,
            currency: "INR",
            status: "NOT_SUBMITTED",
            paymentMethod: "MANUAL_UPI",
            ...screenshotData,
          },
        });
      }

      return res.json({
        message: existingPayment ? "Payment screenshot updated" : "Payment screenshot uploaded",
        payment: {
          id: payment.id,
          status: payment.status,
          hasScreenshot: true,
          screenshotName: payment.paymentScreenshotName,
          screenshotMime: payment.paymentScreenshotMime,
        },
      });
    } catch (error: any) {
      console.error("Payment screenshot upload error:", error);
      return res.status(400).json({ error: error.message || "Screenshot upload failed" });
    }
  }
);

// GET /api/payments/application/:applicationId/screenshot
// Securely stream the applicant's payment screenshot. Only the application
// owner or admin/reviewer staff may view it (never served publicly).
router.get("/application/:applicationId/screenshot", async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).authUser as { id: string; userId?: string; role?: string } | undefined;
    const userId = (req as any).user?.userId || authUser?.userId || authUser?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { applicationId } = req.params;
    const application = await prisma.application.findFirst({ where: { applicationId } });
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    const STAFF_ROLES = ["FOUNDER", "ADMIN", "REVIEWER"];
    const isOwner = application.studentId === userId;
    const isStaff = !!authUser?.role && STAFF_ROLES.includes(authUser.role);
    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: "Access denied" });
    }

    const payment = await prisma.payment.findFirst({
      where: { applicationId: application.id },
      orderBy: { createdAt: "desc" },
    });
    if (!payment || !payment.paymentScreenshotKey) {
      return res.status(404).json({ error: "Payment screenshot not found" });
    }

    const { data } = await getDocumentBuffer(payment.paymentScreenshotKey, payment.paymentScreenshotProvider || "s3");
    const mime = payment.paymentScreenshotMime || "image/jpeg";
    res.setHeader("Content-Type", mime);
    res.setHeader("Content-Disposition", `inline; filename="${payment.paymentScreenshotName || path.basename(payment.paymentScreenshotKey)}"`);
    res.setHeader("Cache-Control", "private, no-store");
    return res.send(data);
  } catch (error) {
    console.error("Payment screenshot serve error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/payments/upi-qr
// Securely stream the admin-uploaded UPI QR image for the authenticated
// applicant. Mirrors the document file-serving pattern (never served publicly).
router.get("/upi-qr", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const keys = await prisma.websiteSetting.findMany({ where: { key: { in: [UPI_QR_KEY, UPI_QR_MIME_KEY, UPI_QR_PROVIDER_KEY] } } });
    const map: Record<string, string> = {};
    for (const k of keys) map[k.key] = k.value || "";

    const storageKey = map[UPI_QR_KEY]?.trim();
    if (!storageKey) {
      return res.status(404).json({ error: "UPI QR code has not been configured" });
    }

    const provider = map[UPI_QR_PROVIDER_KEY]?.trim() || "local";
    const mime = map[UPI_QR_MIME_KEY]?.trim() || "image/png";
    const { data } = await getDocumentBuffer(storageKey, provider);
    res.setHeader("Content-Type", mime);
    res.setHeader("Content-Disposition", `inline; filename="${path.basename(storageKey)}"`);
    res.setHeader("Cache-Control", "private, max-age=3600");
    return res.send(data);
  } catch (error) {
    console.error("Serve UPI QR error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Verify a payment signature after Razorpay checkout completes.
router.post("/verify", async (req: Request, res: Response) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const userId = (req as any).user?.userId;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: "Payment verification data is required" });
    }

    // The signature is an HMAC-SHA256 over "orderId|paymentId" using the secret key.
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSign = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSign !== razorpaySignature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // Ensure the payment belongs to the authenticated student's application.
    const payment = await prisma.payment.findFirst({
      where: { razorpayOrderId },
      include: { application: true },
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    if (payment.application.studentId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId,
        status: "SUCCESS",
        paymentDate: new Date(),
      },
    });

    return res.json({
      message: "Payment verified successfully",
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      amount: updated.amount,
      status: "SUCCESS",
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Webhook handler for Razorpay (server-to-server; idempotent).
router.post("/webhook", express.raw({ type: "application/json" }), async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;

    if (!signature) {
      return res.status(400).json({ error: "Missing webhook signature" });
    }

    const payload = req.body.toString();
    const expectedSign = crypto
      .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    if (expectedSign !== signature) {
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    const event = JSON.parse(payload);
    const { event: razorpayEvent, payload: razorpayPayload } = event;

    const existingWebhook = await prisma.webhookLog.findFirst({
      where: { razorPayEventId: razorpayPayload?.id },
    });

    if (existingWebhook) {
      return res.status(200).json({ status: "ignored" });
    }

    switch (razorpayEvent) {
      case "payment.authorized":
      case "payment.captured": {
        const paymentId = razorpayPayload?.payment?.id;
        const orderId = razorpayPayload?.order?.id;
        if (paymentId && orderId) {
          await prisma.payment.update({
            where: { razorpayOrderId: orderId },
            data: { razorpayPaymentId: paymentId, status: "SUCCESS", paymentDate: new Date() },
          });
        }
        break;
      }
      case "payment.failed": {
        const failedOrderId = razorpayPayload?.order?.id;
        if (failedOrderId) {
          await prisma.payment.update({
            where: { razorpayOrderId: failedOrderId },
            data: { status: "FAILED" },
          });
        }
        break;
      }
      default:
        break;
    }

    await prisma.webhookLog.create({
      data: {
        razorPayEventId: razorpayPayload?.id || `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        event: razorpayEvent,
        applicationId: razorpayPayload?.order?.receipt?.split("_")[1] || null,
      },
    });

    return res.status(200).json({ status: "processed" });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(400).json({ error: "Webhook processing error" });
  }
});

// Get payment status for the authenticated student's application.
router.get("/application/:applicationId", async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;
    const userId = (req as any).user?.userId;

    const application = await prisma.application.findFirst({
      where: { applicationId, studentId: userId },
    });

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    const payment = await prisma.payment.findFirst({
      where: { applicationId: application.id },
      orderBy: { createdAt: "desc" },
      include: { application: { include: { scholarshipProgram: true } } },
    });

    if (!payment) {
      return res.json({ status: "NO_PAYMENT", applicationId });
    }

    return res.json({
      id: payment.id,
      applicationId: payment.applicationId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId,
      paymentDate: payment.paymentDate,
      verifiedAt: payment.verifiedAt,
      verificationNote: payment.verificationNote,
      screenshot: payment.paymentScreenshotKey
        ? {
            name: payment.paymentScreenshotName,
            mime: payment.paymentScreenshotMime,
            size: payment.paymentScreenshotSize,
            uploadedAt: payment.paymentScreenshotUploadedAt,
          }
        : null,
      application: {
        applicationId: payment.application?.applicationId,
        status: payment.application?.status,
        scholarshipProgram: payment.application?.scholarshipProgram?.name,
      },
    });
  } catch (error) {
    console.error("Get payment status error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;