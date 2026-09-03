// API base URL for the Neelakannu Educational Trust backend.
// The frontend calls its own same-origin /api/* path and Next.js rewrites
// (see next.config.ts) forward those to the configured backend URL server-side.
// This keeps production requests same-origin: no browser CORS, and the
// backend's HttpOnly auth cookie is stored under the frontend domain.
// next.config.ts rewrites to NEXT_PUBLIC_API_URL (localhost:5000 in dev,
// the deployed backend URL in production).
export const API_BASE_URL = "";