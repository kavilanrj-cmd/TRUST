// Public contact message submission.
import { Router, Request, Response } from "express";
import prisma from "../utils/db";
import { logAudit, notifyAllStaff } from "../utils/audit";

const router = Router();

// POST /api/contact — submit a contact message from the public site.
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: "A valid email is required" });
    }
    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return res.status(400).json({ error: "Subject is required" });
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }
    if (message.trim().length > 5000) {
      return res.status(400).json({ error: "Message is too long" });
    }

    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
      },
    });

    logAudit(
      {
        ip: req.ip || (req.headers["x-forwarded-for"] as string) || null,
        userAgent: (req.headers["user-agent"] as string) || null,
      },
      "contact.message_submitted",
      "ContactMessage",
      contactMessage.id
    );

    notifyAllStaff({
      type: "contact_message",
      title: "New contact message",
      message: `${contactMessage.name} sent a message: ${contactMessage.subject}`,
      link: `/admin/contact-messages/${contactMessage.id}`,
    });

    return res.status(201).json({ message: "Message submitted successfully", id: contactMessage.id });
  } catch (error) {
    console.error("Contact submit error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
