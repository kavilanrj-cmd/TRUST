// Temporary QA applicant accounts.
//
// These are ordinary STUDENT users. They authenticate through the exact same
// /api/auth/login flow as any applicant, hold no admin permissions, and cannot
// reach any admin or founder route. The only difference is the isTestAccount
// flag, which exists so they can be listed and disabled later.
//
// SAFETY RULES enforced here:
//   - Refuses to run unless ALLOW_TEST_ACCOUNTS=true (default false).
//   - Idempotent: an existing email is never duplicated.
//   - Never overwrites a real account. Passwords are only reset for rows that
//     are already flagged isTestAccount=true.
//   - Never deletes any user.
//   - Never elevates a role. Every account is created as STUDENT with no
//     permissions and is explicitly asserted to be non-founder/non-active-admin.
//
// To remove this feature later: delete this file, the three npm scripts, and
// the isTestAccount column. Nothing else depends on it.

import "dotenv/config";
import bcrypt from "bcrypt";
import prisma from "../utils/db";
import { ROLES } from "../utils/roles";

const TEST_ACCOUNT_COUNT = 10;

// The password pattern is documented in the task description, not in the DB.
// Accounts are created with emailVerified already set so QA testers are not
// blocked by the verification email step, which is a UI-flow difference only and
// grants no additional permission.
const passwordFor = (index: number) => `Test@2026#${String(index).padStart(2, "0")}`;

const emailFor = (index: number) =>
  `test.student${String(index).padStart(2, "0")}@example.com`;

function assertEnabled() {
  if (process.env.ALLOW_TEST_ACCOUNTS !== "true") {
    console.error(
      "Refusing to run: test-account management is disabled.\n" +
        "Set ALLOW_TEST_ACCOUNTS=true in backend/.env to enable it explicitly."
    );
    process.exit(1);
  }
}

async function seedTestUsers() {
  assertEnabled();

  const created: string[] = [];
  const existingTest: string[] = [];
  const skippedReal: string[] = [];

  for (let i = 1; i <= TEST_ACCOUNT_COUNT; i++) {
    const email = emailFor(i);
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      // Never touch an account that is not already a test account. A real
      // applicant who happens to own one of these addresses is left completely
      // untouched.
      if (!existing.isTestAccount) {
        skippedReal.push(email);
        console.warn(`  ! skipped (exists and is NOT a test account): ${email}`);
        continue;
      }
      // Already a test account: refresh the password so the documented
      // credentials always work, without changing role or identity.
      const password = await bcrypt.hash(passwordFor(i), 10);
      await prisma.user.update({
        where: { email },
        data: {
          password,
          role: ROLES.STUDENT,
          isFounderProtected: false,
          isActive: true,
        },
      });
      existingTest.push(email);
      console.log(`  = already existed, password refreshed: ${email}`);
      continue;
    }

    const password = await bcrypt.hash(passwordFor(i), 10);
    await prisma.user.create({
      data: {
        email,
        name: `Test Student ${String(i).padStart(2, "0")}`,
        password,
        role: ROLES.STUDENT,
        permissions: [],
        isFounderProtected: false,
        isActive: true,
        isTestAccount: true,
        emailVerified: true,
      },
    });
    created.push(email);
    console.log(`  + created: ${email}`);
  }

  const total = await prisma.user.count({ where: { isTestAccount: true } });
  console.log(
    `\nDone. created=${created.length} refreshed=${existingTest.length} ` +
      `skippedReal=${skippedReal.length} totalTestAccounts=${total}`
  );
  console.log("All test accounts are role=STUDENT with no admin permissions.");
}

async function listTestUsers() {
  assertEnabled();

  const users = await prisma.user.findMany({
    where: { isTestAccount: true },
    select: {
      email: true,
      name: true,
      role: true,
      isActive: true,
      isFounderProtected: true,
      createdAt: true,
      _count: { select: { applications: true } },
    },
    orderBy: { email: "asc" },
  });

  if (users.length === 0) {
    console.log("No test accounts found.");
    return;
  }

  console.log(`Test accounts (${users.length}):`);
  for (const u of users) {
    console.log(
      `  ${u.email}  role=${u.role}  active=${u.isActive}  ` +
        `founderProtected=${u.isFounderProtected}  applications=${u._count.applications}`
    );
  }
}

// Disables rather than deletes, so no application data is ever removed. The
// authenticate middleware already rejects isActive=false users, which blocks
// login without touching any row data.
async function disableTestUsers() {
  assertEnabled();

  const result = await prisma.user.updateMany({
    where: { isTestAccount: true, isActive: true },
    data: { isActive: false },
  });

  console.log(
    `Disabled ${result.count} test account(s). They can no longer log in. ` +
      `No user or application data was deleted.`
  );
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case "seed":
      await seedTestUsers();
      break;
    case "list":
      await listTestUsers();
      break;
    case "disable":
      await disableTestUsers();
      break;
    default:
      console.error(
        "Usage: tsx src/scripts/testUsers.ts <seed|list|disable>"
      );
      process.exit(1);
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Test account command failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
