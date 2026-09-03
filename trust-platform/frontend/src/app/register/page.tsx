"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import DarkModeToggle from "@/components/DarkModeToggle";
import {
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  errors: {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
  isLoading: boolean;
}

const particles = [
  { top: "12%", left: "12%", size: 10, delay: 0 },
  { top: "28%", left: "82%", size: 14, delay: 0.8 },
  { top: "46%", left: "18%", size: 8, delay: 1.6 },
  { top: "62%", left: "88%", size: 12, delay: 0.4 },
  { top: "76%", left: "26%", size: 9, delay: 2.1 },
  { top: "20%", left: "55%", size: 7, delay: 1.2 },
  { top: "84%", left: "68%", size: 11, delay: 0.6 },
  { top: "55%", left: "40%", size: 6, delay: 2.6 },
];

function PasswordField({
  value,
  onChange,
  error,
  show,
  setShow,
  onKeyDown,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  show: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}) {
  return (
    <div>
      <motion.div
        className="relative"
        animate={error ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300">
          <Lock className="h-5 w-5" />
        </div>

        <input
          id="password"
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          aria-invalid={!!error}
          aria-describedby={error ? "password-error" : undefined}
          className={`w-full rounded-lg border bg-white py-3 pl-12 pr-12 text-[#0A1F44] shadow-sm outline-none transition-all duration-300 placeholder:text-slate-400 border-slate-300 dark:bg-[#151D35] dark:text-white dark:placeholder:text-slate-400 dark:border-slate-700 ${
              error
                ? "border-red-400 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                : "focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/30 dark:focus:border-[#D4AF37] dark:focus:ring-[#D4AF37]/30"
            }`}
          placeholder="Enter your password"
        />

        {value.length > 0 && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition-colors hover:text-[#0A1F44] dark:text-slate-300 dark:hover:text-white"
          >
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              id="password-error"
              className="mt-1.5 text-sm text-red-500"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [capsLockWarning, setCapsLockWarning] = useState<boolean | null>(null);

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
      const msg = err?.message || "";
      if (msg === "Failed to fetch" || msg.includes("NetworkError") || msg.includes("network")) {
        setError("Unable to connect to the server. Please try again later.");
      } else {
        setError(msg || "Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Caps Lock detection for password field
  const handlePasswordKeyDown = (e: React.KeyboardEvent) => {
    if (e.getModifierState("CapsLock")) {
      setCapsLockWarning(true);
    } else {
      setCapsLockWarning(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border px-4 py-3 text-[#0A1F44] bg-white placeholder:text-slate-400 border-slate-300 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 dark:bg-[#151D35] dark:text-white dark:placeholder:text-slate-400 dark:border-slate-700 dark:focus:border-[#D4AF37] dark:focus:ring-[#D4AF37]/30";

  return (
    <section className="relative min-h-screen w-full bg-[#F7F7F5] px-4 py-12 dark:bg-[#0b1020]">
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <DarkModeToggle />
      </div>

      <motion.div
        className="relative min-h-screen w-full bg-[#F7F7F5] lg:grid lg:grid-cols-[50%_50%]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* ===== Branding panel (left) ===== */}
        <motion.aside
          className="relative flex flex-col justify-center overflow-hidden bg-[#0A1F44] px-6 py-10 sm:px-10 lg:min-h-screen lg:py-16 dark:bg-[#060a14]"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* floating gold particles */}
          {particles.map((p, i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              className="pointer-events-none absolute rounded-full bg-[#D4AF37]"
              style={{ top: p.top, left: p.left, width: p.size, height: p.size, opacity: 0.35 }}
              animate={{ y: [0, -18, 0], opacity: [0.15, 0.4, 0.15], scale: [1, 1.15, 1] }}
              transition={{ duration: 6, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
            />
          ))}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl"
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 8, repeat: Infinity }}
          />

          {/* Branding content */}
          <motion.div
            className="relative mx-auto w-full max-w-md"
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 },
            }}
            initial="hidden"
            animate="show"
            transition={{ staggerChildren: 0.12, delayChildren: 0.2 }}
          >
            <motion.div
              variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } }}
              className="flex items-center gap-4"
            >
              <Image
                src="/assets/neelakannu-trust-logo.png"
                alt="Neelakannu Educational Trust logo"
                width={72}
                height={72}
                className="h-18 w-18 rounded-2xl shadow-lg"
                priority
              />
              <div>
                <h2 className="font-serif text-2xl font-bold leading-tight text-white sm:text-3xl">
                  Neelakannu
                </h2>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#D4AF37]">
                  Educational Trust
                </p>
              </div>
            </motion.div>

            <motion.p
              variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
              className="mt-8 font-serif text-2xl italic leading-snug text-white/90 sm:text-[1.7rem]"
            >
              &ldquo;Empowering education, enabling dreams.&rdquo;
            </motion.p>

            {/* quote / info card */}
            <motion.div
              variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }}
              className="mt-8 rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.05]"
            >
              <div className="flex items-start gap-3">
                <Sparkles className="mt-1 h-5 w-5 shrink-0 text-[#D4AF37]" />
                <div>
                  <p className="font-semibold text-white">Scholarships for deserving students</p>
                  <p className="mt-1 text-sm text-white/70 dark:text-white/70">Supporting education since 2018</p>
                </div>
              </div>
            </motion.div>

            {/* stat chips */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
              className="mt-6 flex flex-wrap gap-3"
            >
              {[
                { icon: ShieldCheck, label: "2018", sub: "Founded" },
                { icon: CheckCircle2, label: "100%", sub: "Student Focus" },
              ].map((s) => (
                <div
                  key={s.sub}
                  className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 dark:border-white/10 dark:bg-white/[0.05]"
                >
                  <s.icon className="h-5 w-5 text-[#D4AF37]" />
                  <div className="leading-tight">
                    <p className="text-sm font-bold text-white">{s.label}</p>
                    <p className="text-xs text-white/70">{s.sub}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </motion.aside>

        {/* ===== Signup form panel (right) ===== */}
        <motion.main
          className="flex w-full flex-col justify-center px-6 py-10 sm:px-10 lg:min-h-screen lg:py-16 text-[#0A1F44] dark:text-white"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
        >
          <motion.div
            className="mx-auto w-full max-w-md"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.09, delayChildren: 0.3 } },
            }}
            initial="hidden"
            animate="show"
          >
            {/* Mobile branding (compact) */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
              className="mb-8 flex items-center gap-3 lg:hidden"
            >
              <Image
                src="/assets/neelakannu-trust-logo.png"
                alt="Neelakannu Educational Trust logo"
                width={48}
                height={48}
                className="h-12 w-12 rounded-xl"
              />
              <div>
                <p className="font-serif text-lg font-bold text-[#0A1F44] dark:text-white">Neelakannu</p>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#B8902F] dark:text-[#D4AF37]">
                  Educational Trust
                </p>
              </div>
            </motion.div>

            <motion.header
              variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
            >
              <h1 className="text-3xl font-bold tracking-tight text-[#0A1F44] sm:text-4xl dark:text-white">
                Create Account
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Sign up to apply for scholarships
              </p>
            </motion.header>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
                <PasswordField
                  value={password}
                  onChange={(v) => setPassword(v)}
                  show={showPassword}
                  setShow={setShowPassword}
                  onKeyDown={handlePasswordKeyDown}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#0A1F44] dark:text-white">Confirm Password</label>
                <PasswordField
                  value={confirmPassword}
                  onChange={(v) => setConfirmPassword(v)}
                  show={showConfirmPassword}
                  setShow={setShowConfirmPassword}
                  onKeyDown={handlePasswordKeyDown}
                />
              </div>

              {capsLockWarning && (
                <div
                  className="rounded-xl border border-yellow-300 bg-yellow-50 p-3 shadow-sm dark:border-yellow-500/30 dark:bg-yellow-500/10"
                  style={{ animation: "fadeIn 0.3s ease-out, slideIn 0.3s ease-out" }}
                >
                  <span className="inline-flex items-center gap-2">
                    <svg
                      className="h-4 w-4 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 2a6 6 0 100 12A6 6 0 0010 4zM9.5 9.5a1.5 1.5 0 010 3 1.5 1.5 0 010-3zM12 12a1 1 0 010 2 1 1 0 010-2z" />
                    </svg>
                    <span className="text-yellow-700 text-sm font-medium dark:text-yellow-300">Caps Lock is ON</span>
                  </span>
                </div>
              )}

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                >
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
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-[#D4AF37] underline underline-offset-2 hover:text-[#B8902F]">
                  Login
                </Link>
              </p>
            </div>
          </motion.div>
        </motion.main>
      </motion.div>
    </section>
  );
}