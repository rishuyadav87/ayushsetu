-- Proctored attempt sessions (resume, heartbeat autosave, live monitoring) and AI-generated tests
ALTER TABLE "Assessment" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'MANUAL';

CREATE TABLE IF NOT EXISTS "AssessmentAttempt" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "questionOrder" TEXT NOT NULL,
    "optionOrder" TEXT NOT NULL,
    "answers" TEXT NOT NULL DEFAULT '{}',
    "violationCount" INTEGER NOT NULL DEFAULT 0,
    "events" TEXT NOT NULL DEFAULT '[]',
    "lastSnapshot" TEXT,
    "faceCount" INTEGER,
    "resumeCount" INTEGER NOT NULL DEFAULT 0,
    "environment" TEXT,
    "resultId" TEXT,
    CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "AssessmentAttempt_status_idx" ON "AssessmentAttempt"("status");
