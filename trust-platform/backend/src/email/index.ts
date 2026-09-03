// Email service for Neelakannu Educational Trust Platform
// Uses Resend for transactional emails
// Email failures should not corrupt application/payment transactions

import { Resend } from "resend";
import type { Response } from "express";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || "re_sk_test");

// Email sender address
const SENDER = "neelakannu@edu.trust";

// Email templates
export type EmailType =
  | "registration"
  | "verification"
  | "password-reset"
  | "application-submitted"
  | "application-id"
  | "payment-successful"
  | "payment-failed"
  | "under-review"
  | "application-approved"
  | "application-rejected"
  | "application-waitlisted"
  | "correction-requested";

interface EmailData {
  to: string;
  subject: string;
  html: string;
}

// Generate email content based on type and data
const getEmailContent = (type: EmailType, data: any): { subject: string; html: string } => {
  switch (type) {
    case "registration":
      return {
        subject: "Welcome to Neelakannu Educational Trust Scholarship Portal",
        html: `<p>Hello ${data.name},</p>
<p>Welcome to the Neelakannu Educational Trust Scholarship Portal. Your account has been successfully created.</p>
<p>Please <a href="${data.verifyUrl}">verify your email address</a> to start applying for scholarships.</p>
<p>Thank you,<br/>Neelakannu Educational Trust</p>`,
      };
    case "verification":
      return {
        subject: "Verify Your Email - Neelakannu Educational Trust",
        html: `<p>Hello ${data.name},</p>
<p>Please click the link below to verify your email address:</p>
<p><a href="${data.verifyUrl}">Verify Email Address</a></p>
<p>This verification link will expire in 24 hours.</p>
<p>If you did not create an account, please ignore this email.</p>
<p>Best regards,<br/>Neelakannu Educational Trust</p>`,
      };
    case "password-reset":
      return {
        subject: "Reset Your Password - Neelakannu Educational Trust",
        html: `<p>Hello ${data.name},</p>
<p>We received a request to reset your password. Click the link below to create a new password:</p>
<p><a href="${data.resetUrl}">Reset Password</a></p>
<p>This password reset link will expire in 1 hour.</p>
<p>If you did not request a password reset, please ignore this email.</p>
<p>Best regards,<br/>Neelakannu Educational Trust</p>`,
      };
    case "application-submitted":
      return {
        subject: "Application Submitted - Neelakannu Educational Trust",
        html: `<p>Hello ${data.name},</p>
<p>Your scholarship application has been successfully submitted.</p>
<p><strong>Application ID:</strong> ${data.applicationId}</p>
<p><strong>Scholarship:</strong> ${data.scholarshipName}</p>
<p><strong>Submission Date:</strong> ${data.submissionDate}</p>
<p>You will receive email notifications about your application status.</p>
<p>Best regards,<br/>Neelakannu Educational Trust</p>`,
      };
    case "application-id":
      return {
        subject: "Your Application ID - Neelakannu Educational Trust",
        html: `<p>Hello ${data.name},</p>
<p>Your scholarship application ID has been generated.</p>
<p><strong>Application ID:</strong> ${data.applicationId}</p>
<p><strong>Scholarship:</strong> ${data.scholarshipName}</p>
<p>Keep this ID for future reference and to track your application status.</p>
<p>Best regards,<br/>Neelakannu Educational Trust</p>`,
      };
    case "payment-successful":
      return {
        subject: "Payment Successful - Neelakannu Educational Trust",
        html: `<p>Hello ${data.name},</p>
<p>Your application fee payment has been successfully received.</p>
<p><strong>Application ID:</strong> ${data.applicationId}</p>
<p><strong>Amount:</strong> ${data.amount}</p>
<p><strong>Payment ID:</strong> ${data.paymentId}</p>
<p>Your application is now under review. You will be notified of the decision.</p>
<p>Best regards,<br/>Neelakannu Educational Trust</p>`,
      };
    case "payment-failed":
      return {
        subject: "Payment Failed - Neelakannu Educational Trust",
        html: `<p>Hello ${data.name},</p>
<p>Your application fee payment could not be processed.</p>
<p><strong>Application ID:</strong> ${data.applicationId}</p>
<p><strong>Amount:</strong> ${data.amount}</p>
<p>Please complete the payment to continue your application.</p>
<p>If you have already paid, please contact support.</p>
<p>Best regards,<br/>Neelakannu Educational Trust</p>`,
      };
    case "under-review":
      return {
        subject: "Application Under Review - Neelakannu Educational Trust",
        html: `<p>Hello ${data.name},</p>
<p>Your scholarship application is now under review.</p>
<p><strong>Application ID:</strong> ${data.applicationId}</p>
<p><strong>Scholarship:</strong> ${data.scholarshipName}</p>
<p>The review process typically takes 2-3 weeks.</p>
<p>You will be notified of the decision via email.</p>
<p>Best regards,<br/>Neelakannu Educational Trust</p>`,
      };
    case "application-approved":
      return {
        subject: "Application Approved! - Neelakannu Educational Trust",
        html: `<p>Hello ${data.name},</p>
<p>Congratulations! Your scholarship application has been approved.</p>
<p><strong>Application ID:</strong> ${data.applicationId}</p>
<p><strong>Scholarship:</strong> ${data.scholarshipName}</p>
<p>Please check your email for further instructions regarding scholarship disbursement.</p>
<p>Best regards,<br/>Neelakannu Educational Trust</p>`,
      };
    case "application-rejected":
      return {
        subject: "Application Status Update - Neelakannu Educational Trust",
        html: `<p>Hello ${data.name},</p>
<p>Your scholarship application has been reviewed.</p>
<p><strong>Application ID:</strong> ${data.applicationId}</p>
<p><strong>Scholarship:</strong> ${data.scholarshipName}</p>
<p>We regret to inform you that your application was not selected for this scholarship cycle.</p>
<p>Thank you for your interest in the Neelakannu Educational Trust scholarship program.</p>
<p>Best regards,<br/>Neelakannu Educational Trust</p>`,
      };
    case "application-waitlisted":
      return {
        subject: "Waitlisted - Neelakannu Educational Trust",
        html: `<p>Hello ${data.name},</p>
<p>Your scholarship application has been placed on the waitlist.</p>
<p><strong>Application ID:</strong> ${data.applicationId}</p>
<p><strong>Scholarship:</strong> ${data.scholarshipName}</p>
<p>You will be notified if a seat becomes available.</p>
<p>Best regards,<br/>Neelakannu Educational Trust</p>`,
      };
    case "correction-requested":
      return {
        subject: " Correction Required for Your Application - Neelakannu Educational Trust",
        html: `<p>Hello ${data.name},</p>
<p>The administration has requested corrections to your scholarship application.</p>
<p><strong>Application ID:</strong> ${data.applicationId}</p>
<p><strong>Correction Message:</strong> ${data.correctionMessage}</p>
<p>Please <a href="${data.loginUrl}">log in to your account</a> and review the requested information.</p>
<p>You have 7 days to make the necessary corrections and resubmit your application.</p>
<p>Best regards,<br/>Neelakannu Educational Trust</p>`,
      };
  }
};

// Send email function
export const sendEmail = async (type: EmailType, data: any): Promise<{ success: boolean; sendData?: any; error?: string }> => {
  try {
    const { subject, html } = getEmailContent(type, data);

    const emailData: EmailData = {
      to: data.email,
      subject,
      html,
    };

    // Send via Resend
    const { data: sendData, error: sendError } = await resend.emails.send({
      from: SENDER,
      to: data.email,
      subject,
      html,
    });

    if (sendError) {
      console.error("Resend email error:", sendError);
      // Return success but with error info - should not corrupt transaction
      return { success: false, error: sendError.message };
    }

    return { success: true, sendData };
  } catch (error) {
    console.error("Email sending error:", error);
    // Important: Email failures should NOT corrupt application/payment transactions
    // Return failure but indicate it's non-critical
    return { success: false, error: (error as Error).message };
  }
};

// Bulk send for admin operations
export const sendBulkEmails = async (
  emails: Array<{ type: EmailType; data: any }>
): Promise<Array<{ success: boolean; error?: string }>> => {
  const results = await Promise.all(emails.map(({ type, data }) => sendEmail(type, data)));
  return results;
};

// Send application submitted email
export const sendApplicationSubmitted = async (
  email: string,
  name: string,
  applicationId: string,
  scholarshipName: string,
  submissionDate: string
) => {
  await sendEmail("application-submitted", {
    email,
    name,
    applicationId,
    scholarshipName,
    submissionDate,
  });
};

// Send application ID generated email
export const sendApplicationIdGenerated = async (
  email: string,
  name: string,
  applicationId: string,
  scholarshipName: string
) => {
  await sendEmail("application-id", {
    email,
    name,
    applicationId,
    scholarshipName,
  });
};

// Send payment successful email
export const sendPaymentSuccessful = async (
  email: string,
  name: string,
  applicationId: string,
  amount: number,
  paymentId: string
) => {
  await sendEmail("payment-successful", {
    email,
    name,
    applicationId,
    amount: `₹${amount}`,
    paymentId,
  });
};

// Send payment failed email
export const sendPaymentFailed = async (
  email: string,
  name: string,
  applicationId: string,
  amount: number
) => {
  await sendEmail("payment-failed", {
    email,
    name,
    applicationId,
    amount: `₹${amount}`,
  });
};

// Send application under review email
export const sendUnderReview = async (
  email: string,
  name: string,
  applicationId: string,
  scholarshipName: string
) => {
  await sendEmail("under-review", {
    email,
    name,
    applicationId,
    scholarshipName,
  });
};

// Send application approved email
export const sendApplicationApproved = async (
  email: string,
  name: string,
  applicationId: string,
  scholarshipName: string
) => {
  await sendEmail("application-approved", {
    email,
    name,
    applicationId,
    scholarshipName,
  });
};

// Send application rejected email
export const sendApplicationRejected = async (
  email: string,
  name: string,
  applicationId: string,
  scholarshipName: string
) => {
  await sendEmail("application-rejected", {
    email,
    name,
    applicationId,
    scholarshipName,
  });
};

// Send application waitlisted email
export const sendApplicationWaitlisted = async (
  email: string,
  name: string,
  applicationId: string,
  scholarshipName: string
) => {
  await sendEmail("application-waitlisted", {
    email,
    name,
    applicationId,
    scholarshipName,
  });
};

// Send correction requested email
export const sendCorrectionRequested = async (
  email: string,
  name: string,
  applicationId: string,
  correctionMessage: string,
  loginUrl: string
) => {
  await sendEmail("correction-requested", {
    email,
    name,
    applicationId,
    correctionMessage,
    loginUrl,
  });
};

export default { sendEmail, sendBulkEmails };