-- AlterEnum: add ACCEPTED to the application lifecycle (distinct from the
-- legacy APPROVED; payments are verified separately from applications).
ALTER TYPE "ApplicationStatus" ADD VALUE 'ACCEPTED';

-- AlterEnum: NOT_SUBMITTED marks a payment row created by an applicant who has
-- uploaded a screenshot but not yet submitted their application.
ALTER TYPE "PaymentStatus" ADD VALUE 'NOT_SUBMITTED';

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 's3',
    "originalFileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- AlterTable: payment screenshots uploaded by the applicant (visible to admins
-- only; served through authenticated endpoints, never a public bucket URL).
ALTER TABLE "Payment"
ADD COLUMN "paymentScreenshotKey" TEXT,
ADD COLUMN "paymentScreenshotProvider" TEXT,
ADD COLUMN "paymentScreenshotMime" TEXT,
ADD COLUMN "paymentScreenshotName" TEXT,
ADD COLUMN "paymentScreenshotSize" INTEGER,
ADD COLUMN "paymentScreenshotUploadedAt" TIMESTAMP(3);