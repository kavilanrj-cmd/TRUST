-- Add support for the "No Parents" family status (two parent records).
-- Additive + nullable: existing applications remain valid and untouched.
ALTER TABLE "ParentGuardian" ADD COLUMN "parent2Name" TEXT;
ALTER TABLE "ParentGuardian" ADD COLUMN "parent2Relationship" TEXT;