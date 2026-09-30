-- Neelakannu Educational Trust - Add school/college addresses, bank details, and scholarship amount fields
-- This migration adds new fields for school/college information, bank details, and scholarship amount.
-- All new fields are nullable to preserve backward compatibility with existing applications.

-- AlterTable: Make schoolCollege nullable in AcademicDetails (backward compatibility)
ALTER TABLE "AcademicDetails" ALTER COLUMN "schoolCollege" DROP NOT NULL;

-- Add new school/college address fields to AcademicDetails
ALTER TABLE "AcademicDetails" ADD COLUMN "schoolName" TEXT;
ALTER TABLE "AcademicDetails" ADD COLUMN "schoolAddress" TEXT;
ALTER TABLE "AcademicDetails" ADD COLUMN "collegeName" TEXT;
ALTER TABLE "AcademicDetails" ADD COLUMN "collegeAddress" TEXT;

-- AlterTable: Add scholarshipAmount to FinancialDetails (nullable, new applications only)
ALTER TABLE "FinancialDetails" ADD COLUMN "scholarshipAmount" DECIMAL(65,30);

-- CreateTable: BankDetails model
CREATE TABLE "BankDetails" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "branchName" TEXT NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankDetails_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BankDetails" ADD CONSTRAINT "BankDetails_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "BankDetails_applicationId_key" ON "BankDetails"("applicationId");