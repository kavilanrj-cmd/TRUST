-- Neelakannu Educational Trust - Admin Panel + CMS
-- SAFE ADDITIVE MIGRATION
-- Adds new enum values, columns, and tables for the admin panel, CMS, media,
-- audit logging, notifications, settings, and internal notes.
-- Existing tables/data are NOT modified destructively.
-- NOTE: The production database already contains the pre-existing tables from the
-- application baseline (created outside of this migration history). This migration
-- is intended to be applied ON TOP of that existing schema. Do not run `prisma
-- migrate reset` (destructive).

-- 1. Extend enum values (additive; never remove existing values)
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'REVIEWER';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'FOUNDER';
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'DOCUMENT_VERIFICATION';
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'WITHDRAWN';

-- 2. Additive columns on "User"
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isFounderProtected" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "permissions" JSONB;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginIp" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdById" TEXT;

-- 3. Additive columns on "Application"
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3);
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "correctionNote" TEXT;

-- 4. Additive columns on "ApplicationDocument"
ALTER TABLE "ApplicationDocument" ADD COLUMN IF NOT EXISTS "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "ApplicationDocument" ADD COLUMN IF NOT EXISTS "verificationNote" TEXT;
ALTER TABLE "ApplicationDocument" ADD COLUMN IF NOT EXISTS "verifiedById" TEXT;
ALTER TABLE "ApplicationDocument" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3);

-- 4b. Additive columns on "Announcement"
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "scheduledFor" TIMESTAMP(3);
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);

-- 5. New tables
CREATE TABLE IF NOT EXISTS "ApplicationNote" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApplicationNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ApplicationActivity" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApplicationActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SiteContent" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "page" TEXT NOT NULL,
    "section" TEXT,
    "label" TEXT,
    "value" TEXT,
    "draftValue" TEXT,
    "maxLength" INTEGER,
    "editable" BOOLEAN NOT NULL DEFAULT true,
    "updatedById" TEXT,
    "lastPublishedAt" TIMESTAMP(3),
    "publishedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ContentVersion" (
    "id" TEXT NOT NULL,
    "siteContentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "value" TEXT,
    "changedById" TEXT,
    "editedByName" TEXT,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MediaAsset" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "altText" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AdminNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WebsiteSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "type" TEXT NOT NULL DEFAULT 'text',
    "label" TEXT,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WebsiteSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EmailTemplate" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- 6. Unique constraints (safe; do not warn if already exist)
DO $$ BEGIN
  ALTER TABLE "SiteContent" ADD CONSTRAINT "SiteContent_key_key" UNIQUE ("key"); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_storageKey_key" UNIQUE ("storageKey"); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "WebsiteSetting" ADD CONSTRAINT "WebsiteSetting_key_key" UNIQUE ("key"); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_type_key" UNIQUE ("type"); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_siteContentId_versionNumber_key" UNIQUE ("siteContentId", "versionNumber"); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 7. Foreign keys
ALTER TABLE "ApplicationNote" DROP CONSTRAINT IF EXISTS "ApplicationNote_applicationId_fkey";
ALTER TABLE "ApplicationNote" ADD CONSTRAINT "ApplicationNote_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationNote" DROP CONSTRAINT IF EXISTS "ApplicationNote_authorId_fkey";
ALTER TABLE "ApplicationNote" ADD CONSTRAINT "ApplicationNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ApplicationActivity" DROP CONSTRAINT IF EXISTS "ApplicationActivity_applicationId_fkey";
ALTER TABLE "ApplicationActivity" ADD CONSTRAINT "ApplicationActivity_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationActivity" DROP CONSTRAINT IF EXISTS "ApplicationActivity_actorId_fkey";
ALTER TABLE "ApplicationActivity" ADD CONSTRAINT "ApplicationActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SiteContent" DROP CONSTRAINT IF EXISTS "SiteContent_updatedById_fkey";
ALTER TABLE "SiteContent" ADD CONSTRAINT "SiteContent_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ContentVersion" DROP CONSTRAINT IF EXISTS "ContentVersion_siteContentId_fkey";
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_siteContentId_fkey" FOREIGN KEY ("siteContentId") REFERENCES "SiteContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentVersion" DROP CONSTRAINT IF EXISTS "ContentVersion_changedById_fkey";
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MediaAsset" DROP CONSTRAINT IF EXISTS "MediaAsset_uploadedById_fkey";
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_actorId_fkey";
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AdminNotification" DROP CONSTRAINT IF EXISTS "AdminNotification_userId_fkey";
ALTER TABLE "AdminNotification" ADD CONSTRAINT "AdminNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WebsiteSetting" DROP CONSTRAINT IF EXISTS "WebsiteSetting_updatedById_fkey";
ALTER TABLE "WebsiteSetting" ADD CONSTRAINT "WebsiteSetting_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmailTemplate" DROP CONSTRAINT IF EXISTS "EmailTemplate_updatedById_fkey";
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 8. Indexes for query performance
CREATE INDEX IF NOT EXISTS "ApplicationNote_applicationId_idx" ON "ApplicationNote"("applicationId");
CREATE INDEX IF NOT EXISTS "ApplicationActivity_applicationId_idx" ON "ApplicationActivity"("applicationId");
CREATE INDEX IF NOT EXISTS "ApplicationActivity_createdAt_idx" ON "ApplicationActivity"("createdAt");
CREATE INDEX IF NOT EXISTS "ContentVersion_siteContentId_idx" ON "ContentVersion"("siteContentId");
CREATE INDEX IF NOT EXISTS "SiteContent_page_idx" ON "SiteContent"("page");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AdminNotification_userId_read_idx" ON "AdminNotification"("userId", "read");
CREATE INDEX IF NOT EXISTS "MediaAsset_createdAt_idx" ON "MediaAsset"("createdAt");
