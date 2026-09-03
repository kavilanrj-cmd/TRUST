import type { NextConfig } from "next";

const API_TARGET =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://trust-backend.vercel.app"
    : "http://localhost:5000");

if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_API_URL) {
  console.warn(
    "[next.config] NEXT_PUBLIC_API_URL is not set in production. " +
      "API /api/* rewrites will target the default deployed backend URL."
  );
}

const nextConfig: NextConfig = {
  async rewrites() {
    // Forward every /api/* request to the backend. Same-origin proxy means the
    // browser never talks cross-origin, so CORS blockers don't apply and the
    // backend's HttpOnly auth cookie is stored under the frontend domain.
    return [
      {
        source: "/api/:path*",
        destination: `${API_TARGET}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;