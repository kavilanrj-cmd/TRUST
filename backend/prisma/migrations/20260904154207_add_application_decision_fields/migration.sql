-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "decisionMessage" TEXT,
ADD COLUMN     "missingDocuments" JSONB,
ADD COLUMN     "rejectionReasons" JSONB,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
ADD COLUMN     "reviewedByName" TEXT;
