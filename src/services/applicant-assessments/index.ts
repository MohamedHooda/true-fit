import {
    ApplicantAssessmentWithDetails,
    AssessmentSubmission,
    AssessmentScoreWithDetails,
    AssessmentExplanation,
    AssessmentFilters,
    AssessmentStats,
} from "types/applicant-assessment"
import { ApplicantAssessmentPool } from "persistence/db/pool/applicant-assessments"
import { JobApplicationPool } from "persistence/db/pool/job-applications"
import { AssessmentTemplatePool } from "persistence/db/pool/assessment-templates"
import { ITrueFitEventRelaying, TrueFitEventTypes } from "services/events"
import { ServiceError, ServiceErrorType } from "types/serviceError"

export interface IApplicantAssessmentService {
    getAssessmentById(
        id: string,
    ): Promise<ApplicantAssessmentWithDetails | null>

    getAssessments(
        filters?: AssessmentFilters,
        limit?: number,
        offset?: number,
    ): Promise<ApplicantAssessmentWithDetails[]>

    submitAssessment(
        submission: AssessmentSubmission,
    ): Promise<ApplicantAssessmentWithDetails>

    getAssessmentScore(id: string): Promise<AssessmentScoreWithDetails>

    getAssessmentExplanation(id: string): Promise<AssessmentExplanation>

    getAssessmentStats(
        templateId?: string,
        jobId?: string,
    ): Promise<AssessmentStats>
}

class ApplicantAssessmentService implements IApplicantAssessmentService {
    constructor(
        private readonly pool: ApplicantAssessmentPool,
        private readonly jobApplicationPool: JobApplicationPool,
        private readonly assessmentTemplatePool: AssessmentTemplatePool,
        private readonly events: ITrueFitEventRelaying,
    ) {}

    async getAssessmentById(
        id: string,
    ): Promise<ApplicantAssessmentWithDetails | null> {
        return this.pool.getAssessmentById(id)
    }

    async getAssessments(
        filters?: AssessmentFilters,
        limit?: number,
        offset?: number,
    ): Promise<ApplicantAssessmentWithDetails[]> {
        // Validate limit and offset
        if (limit !== undefined && limit <= 0) {
            throw new ServiceError(
                ServiceErrorType.InvalidInput,
                "Limit must be positive",
            )
        }

        if (offset !== undefined && offset < 0) {
            throw new ServiceError(
                ServiceErrorType.InvalidInput,
                "Offset must be non-negative",
            )
        }

        // Validate date filters
        if (
            filters?.submittedAfter &&
            filters?.submittedBefore &&
            filters.submittedAfter > filters.submittedBefore
        ) {
            throw new ServiceError(
                ServiceErrorType.InvalidInput,
                "submittedAfter must be before submittedBefore",
            )
        }

        // Validate score filters
        if (
            filters?.minScore !== undefined &&
            filters?.maxScore !== undefined &&
            filters.minScore > filters.maxScore
        ) {
            throw new ServiceError(
                ServiceErrorType.InvalidInput,
                "minScore must be less than or equal to maxScore",
            )
        }

        return this.pool.getAssessments(filters, limit, offset)
    }

    async submitAssessment(
        submission: AssessmentSubmission,
    ): Promise<ApplicantAssessmentWithDetails> {
        // Validate submission
        if (!submission.answers.length) {
            throw new ServiceError(
                ServiceErrorType.InvalidInput,
                "Assessment must have at least one answer",
            )
        }

        // Check if job application already exists, if not create one
        const hasApplied =
            await this.jobApplicationPool.hasApplicantAppliedToJob(
                submission.applicantId,
                submission.jobId,
            )

        if (!hasApplied) {
            await this.jobApplicationPool.createJobApplication({
                applicantId: submission.applicantId,
                jobId: submission.jobId,
                status: "APPLIED",
            })
        }

        const assessment = await this.pool.submitAssessment(submission)

        // Emit assessment submitted event for ranking recalculation
        await this.events.dispatchEvent({
            type: TrueFitEventTypes.ASSESSMENT_SUBMITTED,
            payload: {
                assessmentId: assessment.id,
                applicantId: assessment.applicantId,
                templateId: assessment.templateId,
                jobId: submission.jobId, // Use the provided jobId
                answersCount: assessment.answers.length,
            },
        })

        return assessment
    }

    async getAssessmentScore(id: string): Promise<AssessmentScoreWithDetails> {
        const assessment = await this.pool.getAssessmentById(id)
        if (!assessment) {
            throw new ServiceError(
                ServiceErrorType.NotFound,
                "Assessment not found",
            )
        }

        const score = await this.pool.getAssessmentScore(id)

        return score
    }

    async getAssessmentExplanation(id: string): Promise<AssessmentExplanation> {
        const assessment = await this.pool.getAssessmentById(id)
        if (!assessment) {
            throw new ServiceError(
                ServiceErrorType.NotFound,
                "Assessment not found",
            )
        }

        return this.pool.getAssessmentExplanation(id)
    }

    async getAssessmentStats(
        templateId?: string,
        jobId?: string,
    ): Promise<AssessmentStats> {
        return this.pool.getAssessmentStats(templateId, jobId)
    }
}

export default function getApplicantAssessmentService(
    pool: ApplicantAssessmentPool,
    jobApplicationPool: JobApplicationPool,
    assessmentTemplatePool: AssessmentTemplatePool,
    events: ITrueFitEventRelaying,
): IApplicantAssessmentService {
    return new ApplicantAssessmentService(
        pool,
        jobApplicationPool,
        assessmentTemplatePool,
        events,
    )
}
