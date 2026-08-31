// Database client for the Neelakannu Educational Trust Platform
// Uses Prisma ORM with PostgreSQL - Phase 1A setup
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

let prisma: any;

if ((global as any).prisma) {
  prisma = (global as any).prisma;
} else {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
  });
  prisma = new PrismaClient({ adapter });
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
