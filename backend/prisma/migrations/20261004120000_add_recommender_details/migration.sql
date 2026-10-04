-- Neelakannu Educational Trust - Add recommender details ("Recommended By")
--
-- Purely additive: a new 1:1 table alongside the existing per-section detail
-- tables (PersonalDetails, BankDetails, ...). Nothing is dropped, renamed or
-- retyped, and no existing application row is read or written by this script.
--
-- Because RecommenderDetails is a separate optional relation, an application that
-- predates this step simply has no row and continues to load unchanged; every
-- read path (applicant, admin) treats a missing row as "not provided yet".
-- Completeness of the six columns is enforced when the applicant saves the step
-- and again on submit, and the NOT NULL constraints back that up.

-- CreateTable: RecommenderDetails model
CREATE TABLE "RecommenderDetails" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "recommender1Name" TEXT NOT NULL,
    "recommender1Roll" TEXT NOT NULL,
    "recommender1Mobile" TEXT NOT NULL,
    "recommender2Name" TEXT NOT NULL,
    "recommender2Roll" TEXT NOT NULL,
    "recommender2Mobile" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecommenderDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: one recommender block per application, mirroring BankDetails
CREATE UNIQUE INDEX "RecommenderDetails_applicationId_key" ON "RecommenderDetails"("applicationId");

-- AddForeignKey: deleting an application removes its recommender block with it
ALTER TABLE "RecommenderDetails" ADD CONSTRAINT "RecommenderDetails_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;