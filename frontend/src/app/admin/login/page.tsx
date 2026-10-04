"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";
import {
  IDENTIFIER_LABEL,
  IDENTIFIER_PLACEHOLDER,
  INVALID_IDENTIFIER_MESSAGE,
  isValidLoginIdentifier,
} from "@/lib/login-identity";

export default function AdminLoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // Same rule as the applicant login: an email address or an Indian mobile
    // number, never a username.
    if (!identifier.trim() || !isValidLoginIdentifier(identifier)) {
      setError(INVALID_IDENTIFIER_MESSAGE);
      return;
    }
    setLoading(true);
    try {
      await adminApi.login(identifier, password);
      router.push("/admin");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy via-navy-800 to-navy-700 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/assets/neelakannu-trust-logo.png"
            alt="NEELAKANNU EDUCATIONAL TRUST"
            width={64}
            height={64}
            className="h-16 w-16"
          />
          <h1 className="mt-4 font-serif text-2xl font-bold text-white">Admin Portal</h1>
          <p className="mt-1 text-sm text-white/70">NEELAKANNU EDUCATIONAL TRUST</p>
        </div>

        <div className="card-trust bg-white p-8 dark:bg-[#131a2e]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="identifier" className="field-label">
                {IDENTIFIER_LABEL}
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                className="field-input"
                placeholder={IDENTIFIER_PLACEHOLDER}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input
                type="password"
                autoComplete="current-password"
                className="field-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-gold w-full">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Authorized staff only.{" "}
            <Link href="/" className="font-semibold text-navy hover:underline dark:text-gold">
              Back to website
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
