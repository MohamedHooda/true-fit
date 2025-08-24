-- CreateEnum
CREATE TYPE "question_type" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'TEXT');

-- CreateTable
CREATE TABLE "assessment_questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "templateId" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "type" "question_type" NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "correctAnswer" TEXT,
    "negativeWeight" DOUBLE PRECISION,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicant_assessments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "submittedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applicantId" UUID NOT NULL,
    "templateId" UUID NOT NULL,

    CONSTRAINT "applicant_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicant_answers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "answer" TEXT,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assessmentId" UUID NOT NULL,
    "questionId" UUID NOT NULL,

    CONSTRAINT "applicant_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assessment_questions_templateId_idx" ON "assessment_questions"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_questions_templateId_order_key" ON "assessment_questions"("templateId", "order");

-- CreateIndex
CREATE INDEX "applicant_assessments_applicantId_templateId_idx" ON "applicant_assessments"("applicantId", "templateId");

-- CreateIndex
CREATE INDEX "applicant_answers_assessmentId_idx" ON "applicant_answers"("assessmentId");

-- CreateIndex
CREATE INDEX "applicant_answers_questionId_idx" ON "applicant_answers"("questionId");

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "assessment_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicant_assessments" ADD CONSTRAINT "applicant_assessments_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicant_assessments" ADD CONSTRAINT "applicant_assessments_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "assessment_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicant_answers" ADD CONSTRAINT "applicant_answers_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "applicant_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicant_answers" ADD CONSTRAINT "applicant_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "assessment_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
