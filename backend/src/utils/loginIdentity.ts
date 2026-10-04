// Login identifier resolution.
//
// The only supported identifiers are an email address or an Indian mobile
// number. There is no username: no such column exists on `User`, none is ever
// created, and no code path accepts one.
//
// A mobile number is not stored on `User`. The applicant's number lives on
// `PersonalDetails.phone`, attached to their application, so a mobile lookup
// walks User -> Application -> PersonalDetails. Nothing here writes to that
// column: the stored value is left exactly as the applicant entered it and only
// the *lookup* is normalized, which is why this needs no migration.
//
// Both login routes (/api/auth/login and /api/admin/login) share this module so
// an account is identified by exactly the same rules everywhere.

import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import prisma from "./db";

export type LoginIdentifierKind = "email" | "mobile";

// Deliberately loose but structural: one "@", no whitespace, something either
// side of it, and a dotted domain.
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Indian mobile numbers are 10 digits starting 6-9.
const MOBILE_RX = /^[6-9][0-9]{9}$/;

// Shown when the typed value is neither an email address nor a mobile number.
// Purely syntactic — it is decided before any lookup runs, so it reveals nothing
// about which accounts exist.
export const INVALID_IDENTIFIER_MESSAGE =
  "Please enter a valid email address or mobile number.";

// Only what a login needs. Selects are explicit so a handler can never
// accidentally start reading a column it has no business seeing.
const LOGIN_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  password: true,
  role: true,
  isActive: true,
  permissions: true,
} as const;

export interface LoginUser {
  id: string;
  name: string | null;
  email: string;
  password: string;
  role: string;
  isActive: boolean;
  permissions: unknown;
}

export function isEmailIdentifier(value: string): boolean {
  return EMAIL_RX.test(value.trim());
}

// Reduce any accepted spelling of an Indian mobile number to the bare 10
// digits. A country code (+91 / 91 / 0091), spaces, dashes, dots and brackets
// are all tolerated. Returns null when the value is not a usable mobile number.
export function normalizeMobile(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  // "91" and "+91" contribute 2 digits, the "0091" prefix 4.
  const national =
    digits.length === 12 && digits.startsWith("91")
      ? digits.slice(2)
      : digits.length === 14 && digits.startsWith("0091")
        ? digits.slice(4)
        : digits;
  return MOBILE_RX.test(national) ? national : null;
}

// Decide how an identifier should be looked up. "@" is the clearest signal —
// a mobile number never contains one — so its presence means "treat as email",
// and a value that looks like an email but fails the check is rejected rather
// than retried as a number.
export function classifyIdentifier(value: string): LoginIdentifierKind | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.includes("@")) return isEmailIdentifier(trimmed) ? "email" : null;
  return normalizeMobile(trimmed) ? "mobile" : null;
}

// PersonalDetails.phone is free text, and what an applicant typed can appear in
// any spelling: "9876500022", "+91 98765 00022", "098765 00022" and so on.
// Enumerating a few likely spellings cannot cover that, so the comparison is
// made on the digits alone — see findByMobile. The stored value itself is never
// rewritten.
function storedDigitForms(national: string): string[] {
  return [national, `91${national}`, `0091${national}`];
}

// Mobile lookup across the existing application records. Ordered for
// determinism in the rare case two accounts share a number.
//
// The digits are compared inside Postgres rather than against a fixed list of
// spellings, so any formatting an applicant may have typed resolves to the same
// account. Every value is a bound parameter; nothing is concatenated into SQL.
//
// Note: `regexp_replace` means this cannot use an index on `phone`. That is fine
// at the current volume (a login touches one short column), but if the table ever
// grows enough to matter, a functional index on
// `regexp_replace(phone, '\D', '', 'g')` is the fix.
async function findByMobile(national: string): Promise<LoginUser[]> {
  const forms = storedDigitForms(national);
  // `db.ts` exports the client untyped, so it is narrowed here to get the real
  // generics for $queryRaw.
  const client = prisma as PrismaClient;
  return client.$queryRaw<LoginUser[]>(Prisma.sql`
    SELECT u.id, u.name, u.email, u.password, u.role, u."isActive", u.permissions
    FROM "User" u
    JOIN "Application" a ON a."studentId" = u.id
    JOIN "PersonalDetails" p ON p."applicationId" = a.id
    WHERE regexp_replace(p.phone, '\\D', '', 'g') IN (${Prisma.join(forms)})
    ORDER BY u."createdAt" ASC
  `);
}

// Email lookup: an exact match plus a case-insensitive match. Emails are stored
// with whatever case they were registered with and the two login routes have
// always disagreed about case, so both spellings are tried.
async function findByEmail(email: string): Promise<LoginUser[]> {
  const wanted = email.trim();
  return prisma.user.findMany({
    where: {
      OR: [{ email: wanted }, { email: { equals: wanted, mode: "insensitive" } }],
    },
    select: LOGIN_USER_SELECT,
    orderBy: { createdAt: "asc" },
  });
}

// Accounts matching an identifier, or an empty array when the identifier is
// malformed. More than one row is possible: two applications can be filed from
// the same number, and an email can exist in two casings.
export async function findLoginUsers(identifier: string): Promise<LoginUser[]> {
  const kind = classifyIdentifier(identifier);
  if (kind === "email") return findByEmail(identifier);
  if (kind === "mobile") return findByMobile(normalizeMobile(identifier) as string);
  return [];
}

// A throwaway hash so a login against an unknown identifier still pays the
// bcrypt cost. Without it, response time alone would reveal whether the email
// or mobile number is registered.
const DUMMY_HASH = bcrypt.hashSync("unmatched-login-identifier", 10);

// Check a password against every account the identifier resolved to. A shared
// mobile number therefore still authenticates the owner of the password rather
// than whichever row happened to sort first.
export async function verifyLoginPassword(
  users: LoginUser[],
  password: string
): Promise<LoginUser | null> {
  if (users.length === 0) {
    await bcrypt.compare(password, DUMMY_HASH);
    return null;
  }
  for (const user of users) {
    if (await bcrypt.compare(password, user.password)) return user;
  }
  return null;
}

// Pull the identifier out of a login request body. `identifier` is the current
// field name; `email` and `mobile` stay accepted for older clients, and are
// interpreted by exactly the same email-or-mobile rules — never as a username.
export function readLoginIdentifier(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const raw = body as Record<string, unknown>;
  const candidate = raw.identifier ?? raw.email ?? raw.mobile;
  return typeof candidate === "string" ? candidate.trim() : "";
}

export function readLoginPassword(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const raw = body as Record<string, unknown>;
  return typeof raw.password === "string" ? raw.password : "";
}
