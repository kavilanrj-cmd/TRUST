-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_scholarshipProgramId_fkey";

-- DropIndex
DROP INDEX "AdminNotification_userId_read_idx";

-- DropIndex
DROP INDEX "ApplicationActivity_applicationId_idx";

-- DropIndex
DROP INDEX "ApplicationActivity_createdAt_idx";

-- DropIndex
DROP INDEX "ApplicationNote_applicationId_idx";

-- DropIndex
DROP INDEX "AuditLog_action_idx";

-- DropIndex
DROP INDEX "AuditLog_createdAt_idx";

-- DropIndex
DROP INDEX "ContentVersion_siteContentId_idx";

-- DropIndex
DROP INDEX "MediaAsset_createdAt_idx";

-- DropIndex
DROP INDEX "SiteContent_page_idx";

-- AlterTable
ALTER TABLE "AcademicDetails" ADD COLUMN     "academicType" TEXT,
ADD COLUMN     "className" TEXT,
ADD COLUMN     "section" TEXT,
ADD COLUMN     "semester" TEXT,
ADD COLUMN     "ugPg" TEXT;

-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "doorNumber" TEXT;

-- AlterTable
ALTER TABLE "Application" ALTER COLUMN "scholarshipProgramId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ApplicationDocument" ADD COLUMN     "documentType" TEXT;

-- AlterTable
ALTER TABLE "ParentGuardian" ADD COLUMN     "isSingleParent" BOOLEAN;

-- AlterTable
ALTER TABLE "PersonalDetails" ADD COLUMN     "bankRecordName" TEXT;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_scholarshipProgramId_fkey" FOREIGN KEY ("scholarshipProgramId") REFERENCES "ScholarshipProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;
