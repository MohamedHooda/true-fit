-- CreateEnum
CREATE TYPE "ranking_status" AS ENUM ('CALCULATING', 'COMPLETED', 'STALE', 'ERROR');

-- CreateTable
CREATE TABLE "candidate_rankings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "jobId" UUID NOT NULL,
    "applicantId" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "maxPossibleScore" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "incorrectAnswers" INTEGER NOT NULL,
    "recencyBonus" DOUBLE PRECISION,
    "scoringConfigVersion" TEXT NOT NULL,
    "calculatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isStale" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "candidate_rankings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_ranking_metadata" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "jobId" UUID NOT NULL,
    "status" "ranking_status" NOT NULL DEFAULT 'CALCULATING',
    "totalCandidates" INTEGER NOT NULL DEFAULT 0,
    "lastCalculatedAt" TIMESTAMPTZ,
    "calculationDuration" INTEGER,
    "scoringConfigVersion" TEXT NOT NULL,
    "triggerEvent" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "job_ranking_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "candidate_rankings_jobId_rank_idx" ON "candidate_rankings"("jobId", "rank");

-- CreateIndex
CREATE INDEX "candidate_rankings_jobId_isStale_idx" ON "candidate_rankings"("jobId", "isStale");

-- CreateIndex
CREATE INDEX "candidate_rankings_scoringConfigVersion_idx" ON "candidate_rankings"("scoringConfigVersion");

-- CreateIndex
CREATE INDEX "candidate_rankings_calculatedAt_idx" ON "candidate_rankings"("calculatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_rankings_jobId_applicantId_key" ON "candidate_rankings"("jobId", "applicantId");

-- CreateIndex
CREATE UNIQUE INDEX "job_ranking_metadata_jobId_key" ON "job_ranking_metadata"("jobId");

-- CreateIndex
CREATE INDEX "job_ranking_metadata_status_idx" ON "job_ranking_metadata"("status");

-- CreateIndex
CREATE INDEX "job_ranking_metadata_lastCalculatedAt_idx" ON "job_ranking_metadata"("lastCalculatedAt");

-- AddForeignKey
ALTER TABLE "candidate_rankings" ADD CONSTRAINT "candidate_rankings_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_rankings" ADD CONSTRAINT "candidate_rankings_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_rankings" ADD CONSTRAINT "candidate_rankings_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "applicant_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_ranking_metadata" ADD CONSTRAINT "job_ranking_metadata_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
