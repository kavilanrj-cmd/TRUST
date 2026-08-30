// Payment routes for Neelakannu Educational Trust Platform
// Handles: Razorpay order creation, payment verification, webhook handling

import express, { Request, Response } from "express";
import prisma from "../utils/db";
import crypto from "crypto";

const router = express.Router();

// Razorpay configuration
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

// Generate Razorpay order
router.post("/create-order", async (req: Request, res: Response) => {
  try {
    const { applicationId, scholarshipProgramId } = req.body;

    if (!applicationId) {
      return res.status(400).json({ error: "Application ID is required" });
    }

    // Verify application ownership
    const application = await prisma.application.findFirst({
      where: {
        applicationId,
        studentId: (req as any).user?.userId,
      },
      include: {
        scholarshipProgram: true,
      },
    });

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    if (application.status !== "DRAFT") {
      return res.status(400).json({ error: "Payment can only be made for draft applications" });
    }

    const fee = application.scholarshipProgram.applicationFee;

    if (!fee || fee <= 0) {
      return res.status(400).json({ error: "Scholarship program has no application fee configured" });
    }

    // Check if payment already exists for this application
    const existingPayment = await prisma.payment.findFirst({
      where: { applicationId: application.applicationId },
    });

    if (existingPayment && existingPayment.status === "SUCCESS") {
      return res.json({
        orderId: existingPayment.razorpayOrderId,
        paymentId: existingPayment.razorpayPaymentId,
        status: existingPayment.status,
      });
    }

    // Create Razorpay order amount (in paise)
    const orderAmount = Math.round(fee * 100);

    const orderRequest = {
      amount: orderAmount,
      currency: "INR",
      receipt: `receipt_${application.applicationId}_${Date.now()}`,
      payment_capture: 1,
    };

    // Generate order ID - in production use Razorpay SDK
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Record the payment pending in database
    const payment = await prisma.payment.create({
      data: {
        application: { connect: { applicationId: application.applicationId } },
        applicationId: application.applicationId,
        amount: fee,
        currency: "INR",
        status: "PENDING",
      },
    });

    return res.json({
      id: orderId,
      amount: orderAmount,
      currency: "INR",
      receipt: `receipt_${application.applicationId}_${Date.now()}`,
      key: RAZORPAY_KEY_ID,
      paymentId: payment.id,
      orderId: payment.razorpayOrderId,
      status: "PENDING",
    });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Verify payment
router.post("/verify", async (req: Request, res: Response) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: "Payment verification data is required" });
    }

    // Verify payment signature
    const sign = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSign = crypto
      .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET || "whsec_test")
      .update(sign)
      .digest("hex");

    if (expectedSign !== razorpaySignature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // Update payment status in database
    const payment = await prisma.payment.update({
      where: { razorpayOrderId },
      data: {
        razorpayPaymentId,
        status: "SUCCESS",
        paymentDate: new Date(),
      },
    });

    // Update application status to indicate payment completed
    await prisma.application.update({
      where: { applicationId: payment.applicationId },
      data: { status: "DRAFT" }, // Keep as DRAFT until submission
    });

    return res.json({
      message: "Payment verified successfully",
      paymentId: razorpayPaymentId,
      status: "SUCCESS",
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Webhook handler for Razorpay
router.post("/webhook", express.raw({ type: "application/json" }), async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;

    if (!signature) {
      return res.status(400).json({ error: "Missing webhook signature" });
    }

    // Verify webhook signature
    const payload = req.body.toString();
    const expectedSign = crypto
      .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET || "whsec_test")
      .update(payload)
      .digest("hex");

    if (expectedSign !== signature) {
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    const event = JSON.parse(payload);
    const { event: razorpayEvent, payload: razorpayPayload } = event;

    // Handle duplicate webhook events - check if already processed
    const existingWebhook = await prisma.webhookLog.findFirst({
      where: { razorPayEventId: razorpayPayload?.id },
    });

    if (existingWebhook) {
      // Already processed this event
      return res.status(200).json({ status: "ignored" });
    }

    // Apply idempotency - only process specific events
    switch (razorpayEvent) {
      case "payment.authorized":
      case "payment.captured":
        const paymentId = razorpayPayload?.payment?.id;
        const orderId = razorpayPayload?.order?.id;

        if (paymentId && orderId) {
          // Update payment status
          await prisma.payment.update({
            where: { razorpayOrderId: orderId },
            data: {
              razorpayPaymentId: paymentId,
              status: "SUCCESS",
              paymentDate: new Date(),
            },
          });

          // Log the webhook event
          await prisma.webhookLog.create({
            data: {
              razorPayEventId: razorpayPayload.id,
              event: razorpayEvent,
              applicationId: razorpayPayload?.order?.receipt?.split("_")[1] || "",
            },
          });
        }
        break;

      case "payment.failed":
        const failedPaymentId = razorpayPayload?.payment?.id;
        const failedOrderId = razorpayPayload?.order?.id;

        if (failedPaymentId && failedOrderId) {
          await prisma.payment.update({
            where: { razorpayOrderId: failedOrderId },
            data: {
              status: "FAILED",
            },
          });

          await prisma.webhookLog.create({
            data: {
              razorPayEventId: razorpayPayload.id,
              event: razorpayEvent,
              applicationId: razorpayPayload?.order?.receipt?.split("_")[1] || "",
            },
          });
        }
        break;

      default:
        // Log unhandled events
        await prisma.webhookLog.create({
          data: {
            razorPayEventId: razorpayPayload?.id,
            event: razorpayEvent,
          },
        });
        break;
    }

    res.status(200).json({ status: "processed" });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(400).json({ error: "Webhook processing error" });
  }
});

// Get payment status for application
router.get("/application/:applicationId", async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;

    const payment = await prisma.payment.findFirst({
      where: { applicationId },
      include: {
        application: {
          include: {
            scholarshipProgram: true,
          },
        },
      },
    });

    if (!payment) {
      return res.json({
        status: "NO_PAYMENT",
        applicationId,
      });
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