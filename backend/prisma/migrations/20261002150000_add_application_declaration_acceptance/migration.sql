-- Applicant Declaration acceptance on the application itself.
--
-- declarationAccepted is the applicant's agreement to the mandatory Applicant
-- Declaration shown immediately before the final Submit Application action.
-- It defaults to false so every pre-existing application starts un-accepted
-- and can never be submitted without the applicant explicitly agreeing.
--
-- declarationAcceptedAt records when the applicant agreed, so the trust can
-- see when the declaration was accepted relative to the submission.
ALTER TABLE "Application" ADD COLUMN "declarationAccepted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Application" ADD COLUMN "declarationAcceptedAt" TIMESTAMP(3);