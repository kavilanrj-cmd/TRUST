import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import applicationRoutes from "./applications/index";
import authRoutes from "./auth/index";
import scholarshipRoutes from "./scholarships/index";
import documentRoutes from "./documents/index";
import paymentRoutes from "./payments/index";
import contactRoutes from "./contact/index";
import adminRoutes, { routerPublic, bootstrapFounder } from "./admin/index";
import db from "./utils/db";
import { authenticate } from "./utils/auth";
import { getApplicationFeeConfig } from "./utils/applicationFee";

const app = express();
const PORT = process.env.PORT || 5000;

// CORS origin allow-list. Combine FRONTEND_URL env (comma-separated) with the
// known deployed frontend so production credentialed requests are never blocked
// even if FRONTEND_URL is missing in a given environment.
const CORS_ORIGINS = new Set([
  ...(process.env.FRONTEND_URL || "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  "https://my-trust-nine.vercel.app",
]);
const clientOrigins = Array.from(CORS_ORIGINS);

// Security headers
app.use(helmet());

// CORS configuration (allow credentialed requests for HttpOnly cookies)
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin / non-browser tools)
    if (!origin) return callback(null, true);
    if (clientOrigins.includes(origin)) return callback(null, true);
    // In production, restrict to configured origins; in dev permit localhost and local IPs.
    if (
      process.env.NODE_ENV !== "production" &&
      /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  exposedHeaders: ["Content-Disposition"],
}));

// Global rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: "Too many requests, please try again later.",
});
app.use(limiter);

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many login attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Body parsing + cookies
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "neelakannu-trust-platform-api"
  });
});

// Public application fee configuration used by the home page and application form.
app.get("/api/application-fee", async (_req: Request, res: Response) => {
  try {
    const fee = await getApplicationFeeConfig();
    res.json(fee);
  } catch (e) {
    console.error("Get application fee error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/scholarships", scholarshipRoutes);
app.use("/api/applications", authenticate, applicationRoutes);
app.use("/api/documents", authenticate, documentRoutes);
app.use("/api/payments", authenticate, paymentRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/content", routerPublic);

// Serve uploaded media files through an authenticated route (see admin router).
// Never serve the raw uploads directory publicly.

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Error:", err);
  const status = err?.status || err?.statusCode || 500;
  const message =
    status === 500 || !err?.message
      ? "Internal server error"
      : err.message;
  res.status(status).json({ error: message });
});

// Start the HTTP server only when run directly (e.g. `node dist/index.js`).
// On Vercel serverless the app is imported by api/index.ts instead and should
// not call listen().
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Backend running at http://localhost:${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  });
}

// Bootstrap a founder account if no staff exists yet (from env).
// Run this after database connection is established.
bootstrapFounder().catch(() => {});

export { app };