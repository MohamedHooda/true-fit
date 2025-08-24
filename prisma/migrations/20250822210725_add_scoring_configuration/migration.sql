-- CreateTable
CREATE TABLE "scoring_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "negativeMarkingFraction" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "recencyWindowDays" INTEGER,
    "recencyBoostPercent" DOUBLE PRECISION,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "jobId" UUID,

    CONSTRAINT "scoring_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scoring_configs_jobId_key" ON "scoring_configs"("jobId");

-- AddForeignKey
ALTER TABLE "scoring_configs" ADD CONSTRAINT "scoring_configs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
