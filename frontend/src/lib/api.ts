// API base URL for the Neelakannu Educational Trust backend.
// In development, calls resolve to the local backend; in production they
// resolve to the deployed backend (env override takes precedence). This keeps
// the auth/applications/payments/content requests pointing at the real backend
// rather than the frontend's own origin returning a 404.
// The backend CORS allow-lists the production frontend and accepts both the
// HttpOnly cookie (credentials: "include") and Authorization headers, so direct
// cross-origin calls work without any proxy.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://trust-backend.vercel.app"
    : "http://localhost:5000");