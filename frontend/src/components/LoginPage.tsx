"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

interface FormState {
  identifier: string;
  password: string;
  rememberMe: boolean;
  errors: {
    identifier?: string;
    password?: string;
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

export default function LoginPage() {
  const [form, setForm] = useState<FormState>({
    identifier: "",
    password: "",
    rememberMe: false,
    errors: {},
    isLoading: false,
  });

  const handleChange = (field: keyof Pick<FormState, "identifier" | "password">, value: string) => {    setForm((prev) => ({
      ...prev,
      [field]: value,
      errors: { ...prev.errors, [field]: undefined },
    }));
  };

  const validate = () => {
    const errors: FormState["errors"] = {};
    const identifier = form.identifier.trim();
    const password = form.password;

    if (!identifier) {
      errors.identifier = "Email or username is required.";
    } else if (identifier.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      errors.identifier = "Please enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    }

    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setForm((prev) => ({ ...prev, errors }));
      return;
    }
    setForm((prev) => ({ ...prev, isLoading: true, errors: {} }));

    // Simulate a short auth request (no real authentication).
    console.log("Login submitted:", {
      identifier: form.identifier.trim(),
      password: form.password,
      rememberMe: form.rememberMe,
    });

    setTimeout(() => {
      setForm((prev) => ({ ...prev, isLoading: false }));
    }, 1400);
  };

  return (
    <motion.div
      className="min-h-screen w-full bg-[#F7F7F5] lg:grid lg:grid-cols-[50%_50%]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* ===== Branding panel ===== */}
      <motion.aside
        className="relative flex flex-col justify-center overflow-hidden bg-[#0A1F44] px-6 py-10 sm:px-10 lg:min-h-screen lg:py-16"
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
            className="mt-8 rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm"
          >
            <div className="flex items-start gap-3">
              <Sparkles className="mt-1 h-5 w-5 shrink-0 text-[#D4AF37]" />
              <div>
                <p className="font-semibold text-white">Scholarships for deserving students</p>
                <p className="mt-1 text-sm text-white/70">Supporting education since 2018</p>
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
                className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5"
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

      {/* ===== Login form panel ===== */}
      <motion.main
        className="flex w-full flex-col justify-center px-6 py-10 sm:px-10 lg:min-h-screen lg:py-16"
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
              <p className="font-serif text-lg font-bold text-[#0A1F44]">Neelakannu</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#B8902F]">
                Educational Trust
              </p>
            </div>
          </motion.div>

          <motion.header
            variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
          >
            <h1 className="text-3xl font-bold tracking-tight text-[#0A1F44] sm:text-4xl">
              Welcome Back
            </h1>
            <p className="mt-2 text-muted-foreground">
              Sign in to continue to Neelakannu Educational Trust
            </p>
          </motion.header>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
            {/* Email / Username */}
            <motion.div variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}>
              <FloatingField
                id="identifier"
                label="Email / Username"
                type="text"
                icon={<User className="h-5 w-5" />}
                value={form.identifier}
                onChange={(v) => handleChange("identifier", v)}
                error={form.errors.identifier}
              />
            </motion.div>

            {/* Password */}
            <motion.div variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}>
              <PasswordField
                value={form.password}
                onChange={(v) => handleChange("password", v)}
                error={form.errors.password}
              />
            </motion.div>

            {/* Remember me + forgot */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
              className="flex items-center justify-between"
            >
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={form.rememberMe}
                  onChange={(e) => setForm((prev) => ({ ...prev, rememberMe: e.target.checked }))}
                  className="h-4 w-4 rounded border-muted-foreground/40 accent-[#D4AF37]"
                />
                Remember me
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-[#0A1F44] underline-offset-2 hover:underline"
              >
                Forgot password?
              </Link>
            </motion.div>

            {/* Submit */}
            <motion.div variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}>
              <motion.button
                type="submit"
                disabled={form.isLoading}
                whileHover={{ scale: form.isLoading ? 1 : 1.03 }}
                whileTap={{ scale: form.isLoading ? 1 : 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D4AF37] px-6 py-3.5 text-base font-semibold text-[#0A1F44] shadow-lg shadow-[#D4AF37]/30 transition disabled:cursor-not-allowed disabled:opacity-70"
              >
                {form.isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Lock className="h-5 w-5" />
                )}
                {form.isLoading ? "Logging in..." : "Login"}
              </motion.button>
            </motion.div>

            {/* Sign up link */}
            <motion.p
              variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
              className="text-center text-sm text-muted-foreground"
            >
              Don&rsquo;t have an account?{" "}
              <Link href="/signup" className="font-semibold text-[#0A1F44] underline-offset-2 hover:underline">
                Sign up
              </Link>
            </motion.p>
          </form>
        </motion.div>
      </motion.main>
    </motion.div>
  );
}

function FloatingField({
  id,
  label,
  type,
  icon,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  type: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const showIcon = value.length > 0 || focused;

  return (
    <div>
      <motion.div
        className="relative"
        animate={error ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div
          className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${showIcon ? "text-[#D4AF37]" : "text-muted-foreground/50"}`}
        >
          {icon}
        </div>

        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-2xl border bg-white py-4 pl-12 pr-4 text-[#0A1F44] shadow-sm outline-none transition-all duration-300 placeholder:text-transparent ${
            error
              ? "border-red-400 focus:border-red-400 focus:ring-4 focus:ring-red-100"
              : focused
                ? "border-[#D4AF37] ring-4 ring-[#D4AF37]/15"
                : "border-muted-foreground/20 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/15"
          }`}
          placeholder={label}
        />

        <label
          htmlFor={id}
          className={`pointer-events-none absolute left-4 origin-left rounded-md px-1 transition-all duration-200 ${
            focused || value
              ? "top-0 -translate-y-1/2 bg-[#F7F7F5] text-xs font-semibold"
              : "top-1/2 -translate-y-1/2 pl-8 text-sm"
          } ${focused || value ? (error ? "text-red-500" : "text-[#0A1F44]") : "text-muted-foreground/60"}`}
        >
          {label}
        </label>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            id={`${id}-error`}
            className="mt-1.5 text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function PasswordField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const showIcon = value.length > 0 || focused;

  return (
    <div>
      <motion.div
        className="relative"
        animate={error ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div
          className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${showIcon ? "text-[#D4AF37]" : "text-muted-foreground/50"}`}
        >
          <Lock className="h-5 w-5" />
        </div>

        <input
          id="password"
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-invalid={!!error}
          aria-describedby={error ? "password-error" : undefined}
          className={`w-full rounded-2xl border bg-white py-4 pl-12 pr-12 text-[#0A1F44] shadow-sm outline-none transition-all duration-300 placeholder:text-transparent ${
            error
              ? "border-red-400 focus:border-red-400 focus:ring-4 focus:ring-red-100"
              : focused
                ? "border-[#D4AF37] ring-4 ring-[#D4AF37]/15"
                : "border-muted-foreground/20 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/15"
          }`}
          placeholder="Password"
        />

        <label
          htmlFor="password"
          className={`pointer-events-none absolute left-4 origin-left rounded-md px-1 transition-all duration-200 ${
            focused || value
              ? "top-0 -translate-y-1/2 bg-[#F7F7F5] text-xs font-semibold"
              : "top-1/2 -translate-y-1/2 pl-8 text-sm"
          } ${focused || value ? (error ? "text-red-500" : "text-[#0A1F44]") : "text-muted-foreground/60"}`}
        >
          Password
        </label>

        {value.length > 0 && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground/60 transition-colors hover:text-[#0A1F44]"
          >
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </motion.div>

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
    </div>
  );
}
