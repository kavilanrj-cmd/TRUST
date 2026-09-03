// Authentication routes for Neelakannu Educational Trust Platform
// Handles: Register, Login, Logout, Email Verification, Forgot Password, Reset Password

import express, { Request, Response } from "express";
import prisma from "../utils/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Resend } from "resend";
import { STUDENT_COOKIE, cookieOptions, loadUser } from "../utils/auth";

const resend = new Resend(process.env.RESEND_API_KEY);

const router = express.Router();

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || "neelakannu-educational-trust-jwt-super-secret-key-2026";
const JWT_EXPIRES_IN = "7d";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "neelakannu-educational-trust-refresh-super-secret-key-2026";
const REFRESH_EXPIRES_IN = "30d";
const FRONTEND_BASE_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const SENDER = "neelakannu@edu.trust";

// Register a new user
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "STUDENT",
      }
    });

    // Generate email verification token
    const verificationToken = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      }
    });

    // Send verification email
    await resend.emails.send({
      from: SENDER,
      to: email,
      subject: "Verify your email - Neelakannu Educational Trust",
      html: `<p>Click <a href="${FRONTEND_BASE_URL}/auth/verify-email?token=${verificationToken}">here</a> to verify your email.</p>`
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.cookie(STUDENT_COOKIE, token, cookieOptions(process.env.NODE_ENV === "production"));

    return res.status(201).json({
      message: "User registered successfully. Please check your email to verify your account.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Login user
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if password is correct
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: user.id },
      REFRESH_SECRET,
      { expiresIn: REFRESH_EXPIRES_IN }
    );

    res.cookie(STUDENT_COOKIE, token, cookieOptions(process.env.NODE_ENV === "production"));

    return res.json({
      message: "Login successful",
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Logout user
router.post("/logout", async (req: Request, res: Response) => {
  try {
    res.clearCookie(STUDENT_COOKIE, { path: "/" });
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me — current authenticated session (used by the frontend to
// detect whether a student is logged in and to guard protected routes).
router.get("/me", async (req: Request, res: Response) => {
  try {
    const user = await loadUser(req);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error("Me error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Verify email
router.post("/verify-email", async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Verification token is required" });
    }

    // Find the verification token
    const verification = await prisma.emailVerification.findFirst({
      where: {
        verificationToken: token,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!verification) {
      return res.status(400).json({ error: "Invalid or expired verification token" });
    }

    // Mark the token as used
    await prisma.emailVerification.update({
      where: { id: verification.id },
      data: { used: true }
    });

    // Update user's email verification status
    await prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerified: new Date() }
    });

    return res.json({
      message: "Email verified successfully. You can now log in and apply for scholarships."
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Forgot password
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal whether user exists - return success anyway
      return res.json({ message: "If an account with that email exists, a password reset link has been sent." });
    }

    // Generate reset token
    const resetToken = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

    // Store reset token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        resetToken,
        expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour
      }
    });

    // Send password reset email
    await resend.emails.send({
      from: SENDER,
      to: email,
      subject: "Reset your password - Neelakannu Educational Trust",
      html: `<p>Click <a href="${FRONTEND_BASE_URL}/auth/reset-password?token=${resetToken}">here</a> to reset your password.</p>`
    });

    return res.json({
      message: "If an account with that email exists, a password reset link has been sent."
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Reset password
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Find the reset token
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        resetToken: token,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!resetToken) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user's password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      })
    ]);

    return res.json({
      message: "Password reset successfully. You can now log in with your new password."
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;