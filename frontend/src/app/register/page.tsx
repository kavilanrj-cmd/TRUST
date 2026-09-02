"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import DarkModeToggle from "@/components/DarkModeToggle";

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          confirmPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Registration failed");
      }
      await refresh();
      // Email verification is required before login; redirect to the login page.
      router.push("/login");
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-gold focus:border-transparent dark:bg-[#131a2e] dark:text-white dark:border-white/15";

  return (
    <section className="relative min-h-screen w-full bg-[#F7F7F5] px-4 py-12 dark:bg-[#0b1020]">
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <DarkModeToggle />
      </div>
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md items-center justify-center">
        <div className="w-full space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#0A1F44] dark:text-white">Create Account</h2>
            <p className="mt-2 text-muted-foreground dark:text-white/70">
              Sign up to apply for scholarships
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#0A1F44] dark:text-white">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#0A1F44] dark:text-white">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#0A1F44] dark:text-white">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 6 characters)"
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#0A1F44] dark:text-white">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className={inputCls}
                required
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-[#D4AF37] px-6 py-3 font-medium text-[#0A1F44] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground dark:text-white/70">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-[#0A1F44] underline underline-offset-2 hover:text-[#B8902F] dark:text-[#D4AF37]">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
