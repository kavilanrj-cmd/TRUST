// Small typed helpers for Express request query/params (avoid string | string[] casts).

import { Request } from "express";

export function qstr(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : undefined;
  return String(value);
}

export function qnum(value: unknown, fallback: number): number {
  const s = qstr(value);
  if (s === undefined) return fallback;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? fallback : n;
}

export function pstr(req: Request, name: string): string {
  return String(req.params[name] || "");
}

export function qbool(value: unknown, fallback: boolean): boolean {
  const s = qstr(value);
  if (s === undefined) return fallback;
  return s === "true" || s === "1";
}
