// API base URL for the Neelakannu Educational Trust backend.
//
// Production: empty string so every `${API_BASE_URL}/api/…` call is a
// same-origin request (e.g. "/api/…").  The Next.js rewrite in
// next.config.ts forwards /api/* to the deployed backend server-side,
// which avoids browser CORS entirely and lets the HttpOnly guest-session
// cookie be stored under the frontend domain.
//
// Development: direct cross-origin call to the local backend.
//
// Override with NEXT_PUBLIC_API_URL if you need a custom target.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production"
    ? ""
    : "http://localhost:5000");