/*
  Warnings:

  - Added the required column `jobId` to the `applicant_assessments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "applicant_assessments" ADD COLUMN     "jobId" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "applicant_assessments_jobId_idx" ON "applicant_assessments"("jobId");

-- AddForeignKey
ALTER TABLE "applicant_assessments" ADD CONSTRAINT "applicant_assessments_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
