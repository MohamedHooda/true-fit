import {
    ApplicantAssessmentWithDetails,
    AssessmentSubmission,
    AssessmentScoreWithDetails,
    AssessmentExplanation,
    AssessmentFilters,
    AssessmentStats,
} from "types/applicant-assessment"
import { ApplicantAssessmentPool } from "persistence/db/pool/applicant-assessments"
import { ITrueFitEventRelaying, TrueFitEventTypes } from "services/events"
import { ServiceError, ServiceErrorType } from "types/serviceError"

export interface IApplicantAssessmentService {
    /**
     * Get an assessment by ID
     * @param {string} id - The ID of the assessment to get
     * @returns {Promise<ApplicantAssessmentWithDetails | null>} - The assessment with details
     */
    getAssessmentById(
        id: string,
    ): Promise<ApplicantAssessmentWithDetails | null>

    /**
     * Get assessments with optional filters
     * @param {AssessmentFilters} filters - Optional filters to apply
     * @param {number} limit - Maximum number of assessments to return
     * @param {number} offset - Number of assessments to skip
     * @returns {Promise<ApplicantAssessmentWithDetails[]>} - The assessments with details
     */
    getAssessments(
        filters?: AssessmentFilters,
        limit?: number,
        offset?: number,
    ): Promise<ApplicantAssessmentWithDetails[]>

    /**
     * Submit an assessment
     * @param {AssessmentSubmission} submission - The assessment submission
     * @returns {Promise<ApplicantAssessmentWithDetails>} - The submitted assessment
     */
    submitAssessment(
        submission: AssessmentSubmission,
    ): Promise<ApplicantAssessmentWithDetails>

    /**
     * Get assessment score
     * @param {string} id - The ID of the assessment
     * @returns {Promise<AssessmentScoreWithDetails>} - The assessment score with details
     */
    getAssessmentScore(id: string): Promise<AssessmentScoreWithDetails>

    /**
     * Get assessment explanation
     * @param {string} id - The ID of the assessment
     * @returns {Promise<AssessmentExplanation>} - The assessment explanation
     */
    getAssessmentExplanation(id: string): Promise<AssessmentExplanation>

    /**
     * Get assessment statistics
     * @param {string} templateId - Optional template ID to filter by
     * @param {string} jobId - Optional job ID to filter by
     * @returns {Promise<AssessmentStats>} - The assessment statistics
     */
    getAssessmentStats(
        templateId?: string,
        jobId?: string,
    ): Promise<AssessmentStats>
}

class ApplicantAssessmentService implements IApplicantAssessmentService {
    constructor(
        private readonly pool: ApplicantAssessmentPool,
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

        const assessment = await this.pool.submitAssessment(submission)

        // Emit assessment submitted event for ranking recalculation
        await this.events.dispatchEvent({
            type: TrueFitEventTypes.ASSESSMENT_SUBMITTED,
            payload: {
                assessmentId: assessment.id,
                applicantId: assessment.applicantId,
                templateId: assessment.templateId,
                jobId: assessment.template.job?.id, // Need job ID for ranking
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

        // TODO: Add ASSESSMENT event types
        // await this.events.dispatchEvent({
        //     type: "ASSESSMENT_SCORED",
        //     payload: {
        //         assessmentId: id,
        //         score: score.score,
        //         percentage: score.percentage,
        //         correctAnswers: score.breakdown.correctAnswers.count,
        //         incorrectAnswers: score.breakdown.incorrectAnswers.count,
        //     }
        // })

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
    events: ITrueFitEventRelaying,
): IApplicantAssessmentService {
    return new ApplicantAssessmentService(pool, events)
}
