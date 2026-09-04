// Payment routes for Neelakannu Educational Trust Platform
// Handles: Razorpay order creation, payment verification, webhook handling.
// The Razorpay secret is only ever used on the server (never the frontend).

import express, { Request, Response } from "express";
import prisma from "../utils/db";
import crypto from "crypto";
import { getApplicationFeeConfig } from "../utils/applicationFee";

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

    // Return an already-successful payment if one exists for this application.
    const existingPayment = await prisma.payment.findFirst({
      where: { applicationId: application.id },
      orderBy: { createdAt: "desc" },
    });

    if (existingPayment && existingPayment.status === "SUCCESS") {
      return res.json({
        id: existingPayment.razorpayOrderId,
        orderId: existingPayment.razorpayOrderId,
        paymentId: existingPayment.razorpayPaymentId,
        amount: Math.round(Number(existingPayment.amount) * 100),
        currency: existingPayment.currency,
        status: "SUCCESS",
      });
    }

    // --- Temporary UPI QR payment method ---
    // When paymentMethod is "upi" we do not call Razorpay. We create a PENDING
    // payment row and return the UPI QR details for the applicant to scan & pay.
    // The fee amount is always the admin-controlled app.applicationFee value.
    // When Razorpay is added later, paymentMethod becomes "razorpay" and this
    // branch is skipped in favour of the existing order-creation flow below.
    if (feeConfig.paymentMethod === "upi") {
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
            paymentDate: null,
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
          },
        });
      }

      return res.json({
        id: upiRef,
        orderId: upiRef,
        paymentId: payment.id,
        amount: feeConfig.amount,
        currency: "INR",
        status: "PENDING",
        paymentMethod: "upi",
        upi: feeConfig.upi || { qrUrl: "", vpa: "", instructions: "" },
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
          paymentDate: null,
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
// reference. The payment is recorded as PENDING and must be verified by an admin
// before the application can be submitted.
router.post("/confirm", async (req: Request, res: Response) => {
  try {
    const { applicationId, upiTransactionId } = req.body;
    const userId = (req as any).user?.userId;

    if (!applicationId || !upiTransactionId) {
      return res.status(400).json({ error: "Application ID and UPI transaction reference are required" });
    }

    const application = await prisma.application.findFirst({
      where: { applicationId, studentId: userId },
    });
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }
    if (application.status !== "DRAFT") {
      return res.status(400).json({ error: "Payment can only be confirmed for draft applications" });
    }

    const payment = await prisma.payment.findFirst({
      where: { applicationId: application.id },
      orderBy: { createdAt: "desc" },
    });

    if (!payment) {
      return res.status(400).json({ error: "Please create a payment order first." });
    }

    if (payment.status === "SUCCESS") {
      return res.json({ status: "SUCCESS", message: "Payment already verified." });
    }

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId: String(upiTransactionId).trim(),
        status: "PENDING",
      },
    });

    return res.json({
      status: "PENDING",
      message: "Payment details submitted. It will be verified by the trust before submission.",
      paymentId: updated.id,
      txnId: updated.razorpayPaymentId,
    });
  } catch (error) {
    console.error("Confirm UPI payment error:", error);
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
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId,
      paymentDate: payment.paymentDate,
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
