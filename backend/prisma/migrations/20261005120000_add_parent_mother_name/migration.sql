-- Neelakannu Educational Trust - Add mother name to ParentGuardian
--
-- Purely additive: one nullable TEXT column. Nothing is dropped, renamed or
-- retyped, no table is recreated, and no existing row is read or written by this
-- script, so every stored application is preserved exactly as it is.
--
-- Why a new column instead of reusing parent2Name: parent2Name is the existing
-- "second person" slot for "No Parents" applicants, and both the applicant
-- progress logic and the backend required-document / submit gates detect a "No
-- Parents" application by "parent2Name is set and isSingleParent is false".
-- Writing the mother's name there would make every "Parents" application look
-- like a "No Parents" one and silently drop the Income Certificate requirement.
-- A dedicated nullable column keeps that detection byte-for-byte identical.
--
-- Applications created before this migration have motherName = NULL, which every
-- read path renders as "not provided yet"; the applicant fills it in the Family
-- step, and the step's completeness rules then require it.

ALTER TABLE "ParentGuardian" ADD COLUMN "motherName" TEXT;