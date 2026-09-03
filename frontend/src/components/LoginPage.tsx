"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
import DarkModeToggle from "./DarkModeToggle";
import { useAuth } from "@/lib/auth";

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
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState<FormState>({
    identifier: "",
    password: "",
    rememberMe: false,
    errors: {},
    isLoading: false,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [capsLockWarning, setCapsLockWarning] = useState<boolean | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setForm((prev) => ({ ...prev, errors }));
      return;
    }
    setForm((prev) => ({ ...prev, isLoading: true, errors: {} }));

    try {
      await login(form.identifier.trim(), form.password);
      router.push("/student/application");
    } catch (err: any) {
      setFormError(err?.message || "Login failed. Please try again.");
      setForm((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <motion.div
      className="relative min-h-screen w-full bg-[#F7F7F5] dark:bg-[#0b1020] lg:grid lg:grid-cols-[50%_50%]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Dark mode toggle — top-right corner, never covers logo/form */}
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <DarkModeToggle />
      </div>

      {/* ===== Branding panel ===== */}
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

      {/* ===== Login form panel ===== */}
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
              Welcome Back
            </h1>
            <p className="mt-2 text-muted-foreground dark:text-white/70">
              Sign in to continue to Neelakannu Educational Trust
            </p>
          </motion.header>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
            {/* Email / Username */}
            <motion.div variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}>
              <label className="mb-2 block text-sm font-medium text-[#0A1F44] dark:text-white">Email / Username</label>
              <div className="relative">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 dark:text-white/40">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="identifier"
                  type="text"
                  value={form.identifier}
                  onChange={(e) => handleChange("identifier", e.target.value)}
                  aria-invalid={!!form.errors.identifier}
                  aria-describedby={form.errors.identifier ? "identifier-error" : undefined}
                  placeholder="Enter your email or username"
                  className={`w-full rounded-lg border bg-white py-3 pl-12 pr-4 text-[#0A1F44] shadow-sm outline-none transition-all duration-300 placeholder:text-muted-foreground/50 dark:bg-[#131a2e] dark:text-white dark:placeholder:text-white/40 ${
                    form.errors.identifier
                      ? "border-red-400 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                      : "border-muted-foreground/20 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/15 dark:border-white/15"
                  }`}
                />
              </div>
              <AnimatePresence>
                {form.errors.identifier && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    id="identifier-error"
                    className="mt-1.5 text-sm text-red-500"
                  >
                    {form.errors.identifier}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Password */}
            <motion.div variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}>
              <label className="mb-2 block text-sm font-medium text-[#0A1F44] dark:text-white">Password</label>
              <PasswordField
                value={form.password}
                onChange={(v) => handleChange("password", v)}
                error={form.errors.password}
                setCapsLockWarning={setCapsLockWarning}
              />
            </motion.div>

            {capsLockWarning && (
              <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-3 shadow-sm dark:border-yellow-500/30 dark:bg-yellow-500/10">
                <span className="inline-flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-yellow-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 2a6 6 0 100 12A6 6 0 0010 4zM9.5 9.5a1.5 1.5 0 010 3 1.5 1.5 0 010-3zM12 12a1 1 0 010 2 1 1 0 010-2z" />
                  </svg>
                  <span className="text-yellow-700 text-sm font-medium dark:text-yellow-300">Caps Lock is ON</span>
                </span>
              </div>
            )}

            {/* Remember me + forgot */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
              className="flex items-center justify-between"
            >
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground dark:text-white/70">
                <input
                  type="checkbox"
                  checked={form.rememberMe}
                  onChange={(e) => setForm((prev) => ({ ...prev, rememberMe: e.target.checked }))}
                  className="h-4 w-4 rounded border-muted-foreground/40 accent-[#D4AF37] dark:border-white/30 dark:bg-[#111827]"
                />
                Remember me
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-[#0A1F44] underline-offset-2 hover:underline dark:text-[#D4AF37]"
              >
                Forgot password?
              </Link>
            </motion.div>

            {/* Submit */}
            <motion.div variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}>
              {formError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                  className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                >
                  {formError}
                </motion.p>
              )}
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
              className="text-center text-sm text-muted-foreground dark:text-white/70"
            >
              Don&rsquo;t have an account?{" "}
              <Link href="/register" className="font-semibold text-[#0A1F44] underline-offset-2 hover:underline dark:text-[#D4AF37]">
                Sign up
              </Link>
            </motion.p>
          </form>
        </motion.div>
      </motion.main>
    </motion.div>
  );
}

function PasswordField({
  value,
  onChange,
  error,
  show,
  setShow,
  setCapsLockWarning,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  show?: boolean;
  setShow?: React.Dispatch<React.SetStateAction<boolean>>;
  setCapsLockWarning?: (value: boolean) => void;
}) {
  const [internalShow, setInternalShow] = useState(false);
  const actualShow = show ?? internalShow;
  const actualSetShow = setShow ?? setInternalShow;
  const actualSetCapsLockWarning = setCapsLockWarning ?? (() => {});

  return (
    <div>
      <motion.div
        className="relative"
        animate={error ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 dark:text-white/40">
          <Lock className="h-5 w-5" />
        </div>

        <input
          id="password"
          type={actualShow ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.getModifierState("CapsLock")) {
              actualSetCapsLockWarning(true);
            } else {
              actualSetCapsLockWarning(false);
            }
          }}
          aria-invalid={!!error}
          aria-describedby={error ? "password-error" : undefined}
          className={`w-full rounded-lg border bg-white py-3 pl-12 pr-12 text-[#0A1F44] shadow-sm outline-none transition-all duration-300 placeholder:text-muted-foreground/50 dark:bg-[#131a2e] dark:text-white dark:placeholder:text-white/40 ${
            error
              ? "border-red-400 focus:border-red-400 focus:ring-4 focus:ring-red-100"
              : "border-muted-foreground/20 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/15 dark:border-white/15"
          }`}
          placeholder="Enter your password"
        />

        {value.length > 0 && (
          <button
            type="button"
            onClick={() => actualSetShow(!actualShow)}
            aria-label={actualShow ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground/60 transition-colors hover:text-[#0A1F44] dark:hover:text-white"
          >
            {actualShow ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
