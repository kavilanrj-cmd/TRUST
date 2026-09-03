// Vercel serverless entry point.
// Vercel's `@vercel/node` builder compiles this file and routes every /api/*
// request to it. The Express app is mounted on the root and handles all its
// routes itself, so no route splitting is required.
import { app } from "../src/index";
import { bootstrapFounder } from "../src/admin/index";

// Preserve the original startup behaviour: ensure a founder account exists
// once per cold start (bootstrapFounder is guarded internally by a staff
// count check, so it only creates an account when none exists).
bootstrapFounder().catch(() => {});

export default app;