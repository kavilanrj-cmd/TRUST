// Database client for the Neelakannu Educational Trust Platform
// Uses Prisma ORM with PostgreSQL - Phase 1A setup

let prisma: any;

if ((global as any).prisma) {
  prisma = (global as any).prisma;
} else {
  const { PrismaClient } = require("@prisma/client");
  prisma = new PrismaClient();
  (global as any).prisma = prisma;
}

// Connect to the database
prisma.$connect()
  .then(() => {
    console.log("✅ Database connected successfully");
  })
  .catch((err: any) => {
    console.error("❌ Database connection error:", err);
  });

export default prisma;