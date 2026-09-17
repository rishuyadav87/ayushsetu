-- Question-set upload, NSQF level-wise tests and AI proctoring

-- Assessment: optional taxonomy link + level/upload metadata
ALTER TABLE "Assessment" DROP CONSTRAINT IF EXISTS "Assessment_qpCode_fkey";
ALTER TABLE "Assessment" ALTER COLUMN "qpCode" DROP NOT NULL;
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_qpCode_fkey" FOREIGN KEY ("qpCode") REFERENCES "SkillTaxonomy"("qpCode") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "nsqfLevel" INTEGER NOT NULL DEFAULT 4;
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "passingPercent" INTEGER NOT NULL DEFAULT 60;
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "proctored" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "isPractice" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "createdById" TEXT;
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AssessmentResult: proctoring fields, cascade on assessment delete
ALTER TABLE "AssessmentResult" DROP CONSTRAINT IF EXISTS "AssessmentResult_assessmentId_fkey";
ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentResult" ADD COLUMN IF NOT EXISTS "percentage" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AssessmentResult" ADD COLUMN IF NOT EXISTS "violationCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AssessmentResult" ADD COLUMN IF NOT EXISTS "flagged" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AssessmentResult" ADD COLUMN IF NOT EXISTS "autoSubmitted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AssessmentResult" ADD COLUMN IF NOT EXISTS "submitReason" TEXT;
ALTER TABLE "AssessmentResult" ADD COLUMN IF NOT EXISTS "proctoringLog" TEXT;
ALTER TABLE "AssessmentResult" ADD COLUMN IF NOT EXISTS "timeTakenSec" INTEGER;
