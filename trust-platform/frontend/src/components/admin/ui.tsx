"use client";

import React from "react";
import { statusColor, roleColor, fmtDate, fmtDateTime, AdminApiError } from "@/lib/admin-api";

export { statusColor, roleColor, fmtDate, fmtDateTime, AdminApiError };

export function Card({
  title,
  subtitle,
  actions,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`card-trust bg-white dark:bg-[#131a2e] ${className}`}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            {title && <h3 className="text-base font-semibold text-navy dark:text-white">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "gold" | "outline" | "ghost" | "danger";
  size?: "sm" | "md";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
  const sizes = size === "sm" ? "px-3 py-1.5 text-xs" : "px-5 py-2.5";
  const variants: Record<string, string> = {
    primary: "bg-navy text-white hover:bg-navy-800 dark:bg-[#1e365e] dark:hover:bg-navy-600",
    gold: "bg-gold text-navy hover:bg-gold-600",
    outline: "border border-navy/20 bg-white text-navy hover:bg-muted dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/10",
    ghost: "text-navy hover:bg-muted dark:text-white dark:hover:bg-white/10",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button className={`${base} ${sizes} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "field-input";

export function Spinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex min-h-[30vh] flex-col items-center justify-center text-center">
      <p className="text-base font-semibold text-navy dark:text-white">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[30vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-semibold text-red-600">{message}</p>
    </div>
  );
}

export function pageHeading(title: string, subtitle?: string) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-navy dark:text-white">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
