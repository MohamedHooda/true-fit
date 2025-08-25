import { CandidateRankingPool } from "persistence/db/pool/candidate-rankings"
import { ServiceError, ServiceErrorType } from "types/serviceError"
import { ITrueFitEventRelaying, TrueFitEventTypes } from "services/events"
import {
    TopCandidatesResponse,
    RankingCalculationResult,
    JobRankingStatus,
    RankingEventPayload,
    BulkRankingRequest,
    RankingInvalidationRequest,
} from "types/candidate-ranking"

export interface ICandidateRankingService {
    /**
     * Get top candidates for a job with automatic recalculation if stale
     * @param {string} jobId - The ID of the job
     * @param {number} limit - Number of top candidates to return
     * @returns {Promise<TopCandidatesResponse>} - Top candidates with metadata
     */
    getTopCandidates(
        jobId: string,
        limit?: number,
    ): Promise<TopCandidatesResponse>

    /**
     * Force recalculation of rankings for a job
     * @param {string} jobId - The ID of the job
     * @param {string} triggerEvent - What triggered the recalculation
     * @returns {Promise<RankingCalculationResult>} - Calculation results
     */
    recalculateJobRankings(
        jobId: string,
        triggerEvent: string,
    ): Promise<RankingCalculationResult>

    /**
     * Get ranking status for a job
     * @param {string} jobId - The ID of the job
     * @returns {Promise<JobRankingStatus>} - Ranking status
     */
    getJobRankingStatus(jobId: string): Promise<JobRankingStatus>

    /**
     * Process multiple job rankings in batch
     * @param {BulkRankingRequest} request - Bulk ranking request
     * @returns {Promise<RankingCalculationResult[]>} - Results for each job
     */
    processBulkRankings(
        request: BulkRankingRequest,
    ): Promise<RankingCalculationResult[]>

    /**
     * Handle assessment submission event
     * @param {string} assessmentId - The ID of the submitted assessment
     * @param {string} jobId - The ID of the job
     * @param {string} applicantId - The ID of the applicant
     * @returns {Promise<void>}
     */
    handleAssessmentSubmitted(
        assessmentId: string,
        jobId: string,
        applicantId: string,
    ): Promise<void>

    /**
     * Handle scoring config change event
     * @param {string} configId - The ID of the changed config
     * @param {string | null} jobId - The specific job ID (null for global config)
     * @returns {Promise<void>}
     */
    handleScoringConfigChanged(
        configId: string,
        jobId: string | null,
    ): Promise<void>

    /**
     * Schedule background recalculation for stale jobs
     * @returns {Promise<void>}
     */
    scheduleStaleJobRecalculations(): Promise<void>

    /**
     * Invalidate rankings based on various criteria
     * @param {RankingInvalidationRequest} request - Invalidation criteria
     * @returns {Promise<void>}
     */
    invalidateRankings(request: RankingInvalidationRequest): Promise<void>
}

class CandidateRankingService implements ICandidateRankingService {
    constructor(
        private readonly pool: CandidateRankingPool,
        private readonly events: ITrueFitEventRelaying,
    ) {
        this.setupEventHandlers()
    }

    private setupEventHandlers(): void {
        // Listen for assessment submissions
        this.events.listenForEvents(
            [TrueFitEventTypes.ASSESSMENT_SUBMITTED],
            async (event) => {
                const payload = event.payload
                await this.handleAssessmentSubmitted(
                    payload.assessmentId,
                    payload.jobId,
                    payload.applicantId,
                )
            },
        )

        // Listen for scoring config changes
        this.events.listenForEvents(
            [TrueFitEventTypes.SCORING_CONFIG_CHANGED],
            async (event) => {
                const payload = event.payload
                await this.handleScoringConfigChanged(
                    payload.configId,
                    payload.jobId || null,
                )
            },
        )

        // Listen for job changes
        this.events.listenForEvents(
            [TrueFitEventTypes.JOB_UPDATED],
            async (event) => {
                const payload = event.payload
                await this.pool.markRankingsStale(payload.jobId, "JOB_UPDATED")
            },
        )
    }

    async getTopCandidates(
        jobId: string,
        limit = 5,
    ): Promise<TopCandidatesResponse> {
        if (!jobId) {
            throw new ServiceError(
                ServiceErrorType.InvalidInput,
                "Job ID is required",
            )
        }

        if (limit < 1 || limit > 100) {
            throw new ServiceError(
                ServiceErrorType.InvalidInput,
                "Limit must be between 1 and 100",
            )
        }

        try {
            const result = await this.pool.getTopCandidates(jobId, limit)

            // If rankings are stale or empty, trigger background recalculation
            if (
                result.metadata.status === "STALE" ||
                (result.candidates.length === 0 &&
                    result.metadata.totalCandidates === 0)
            ) {
                // Don't await - let it run in background
                this.recalculateJobRankings(jobId, "AUTO_REFRESH").catch(
                    (err) => {
                        console.error("Background recalculation failed:", err)
                    },
                )
            }

            return result
        } catch (err) {
            if (err instanceof ServiceError) {
                throw err
            }
            throw new ServiceError(
                ServiceErrorType.InternalError,
                "Failed to retrieve top candidates",
            )
        }
    }

    async recalculateJobRankings(
        jobId: string,
        triggerEvent: string,
    ): Promise<RankingCalculationResult> {
        if (!jobId) {
            throw new ServiceError(
                ServiceErrorType.InvalidInput,
                "Job ID is required",
            )
        }

        try {
            const result = await this.pool.calculateJobRankings(
                jobId,
                triggerEvent,
            )

            // Emit event for successful calculation
            await this.events.dispatchEvent({
                type: TrueFitEventTypes.RANKING_CALCULATED,
                payload: {
                    jobId,
                    totalCandidates: result.totalCandidates,
                    calculationDuration: result.calculationDuration,
                },
            })

            return result
        } catch (err) {
            if (err instanceof ServiceError) {
                throw err
            }
            throw new ServiceError(
                ServiceErrorType.InternalError,
                "Failed to calculate job rankings",
            )
        }
    }

    async getJobRankingStatus(jobId: string): Promise<JobRankingStatus> {
        if (!jobId) {
            throw new ServiceError(
                ServiceErrorType.InvalidInput,
                "Job ID is required",
            )
        }

        try {
            const status = await this.pool.getJobRankingStatus(jobId)

            if (!status) {
                // No rankings exist yet
                return {
                    jobId,
                    status: "STALE",
                    totalCandidates: 0,
                    lastCalculatedAt: null,
                    isStale: true,
                }
            }

            return status
        } catch (err) {
            if (err instanceof ServiceError) {
                throw err
            }
            throw new ServiceError(
                ServiceErrorType.InternalError,
                "Failed to get ranking status",
            )
        }
    }

    async processBulkRankings(
        request: BulkRankingRequest,
    ): Promise<RankingCalculationResult[]> {
        if (!request.jobIds || request.jobIds.length === 0) {
            throw new ServiceError(
                ServiceErrorType.InvalidInput,
                "Job IDs are required",
            )
        }

        if (request.jobIds.length > 50) {
            throw new ServiceError(
                ServiceErrorType.InvalidInput,
                "Cannot process more than 50 jobs at once",
            )
        }

        const results: RankingCalculationResult[] = []
        const errors: Array<{ jobId: string; error: string }> = []

        // Process jobs with controlled concurrency
        const batchSize = request.priority === "high" ? 5 : 2
        for (let i = 0; i < request.jobIds.length; i += batchSize) {
            const batch = request.jobIds.slice(i, i + batchSize)

            const batchPromises = batch.map(async (jobId) => {
                try {
                    const result = await this.recalculateJobRankings(
                        jobId,
                        request.triggerEvent,
                    )
                    results.push(result)
                } catch (err) {
                    errors.push({
                        jobId,
                        error:
                            err instanceof Error
                                ? err.message
                                : "Unknown error",
                    })
                }
            })

            await Promise.allSettled(batchPromises)

            // Add delay between batches for normal priority
            if (
                request.priority === "normal" &&
                i + batchSize < request.jobIds.length
            ) {
                await new Promise((resolve) => setTimeout(resolve, 1000))
            }
        }

        if (errors.length > 0) {
            console.error("Bulk ranking errors:", errors)
        }

        return results
    }

    async handleAssessmentSubmitted(
        assessmentId: string,
        jobId: string,
        applicantId: string,
    ): Promise<void> {
        try {
            await this.pool.markRankingsStale(
                jobId,
                `ASSESSMENT_SUBMITTED:${assessmentId}`,
            )

            // For high-impact events (new assessments), trigger immediate recalculation
            // Don't await - let it run in background
            this.recalculateJobRankings(jobId, "ASSESSMENT_SUBMITTED").catch(
                (err) => {
                    console.error(
                        "Assessment-triggered recalculation failed:",
                        err,
                    )
                },
            )
        } catch (err) {
            console.error("Failed to handle assessment submission:", err)
        }
    }

    async handleScoringConfigChanged(
        configId: string,
        jobId: string | null,
    ): Promise<void> {
        try {
            await this.pool.invalidateRankings({
                jobId: jobId || undefined,
                scoringConfigId: jobId ? undefined : configId,
                triggerEvent: `SCORING_CONFIG_CHANGED:${configId}`,
            })

            // For config changes, schedule background recalculation
            // Don't trigger immediate recalculation as it affects multiple jobs
            this.scheduleStaleJobRecalculations().catch((err) => {
                console.error("Config-triggered recalculation failed:", err)
            })
        } catch (err) {
            console.error("Failed to handle scoring config change:", err)
        }
    }

    async scheduleStaleJobRecalculations(): Promise<void> {
        try {
            const staleJobs = await this.pool.getJobsNeedingRecalculation(10)

            if (staleJobs.length === 0) {
                return
            }

            // Process stale jobs with normal priority
            await this.processBulkRankings({
                jobIds: staleJobs,
                triggerEvent: "SCHEDULED_RECALCULATION",
                priority: "normal",
            })
        } catch (err) {
            console.error("Failed to schedule stale job recalculations:", err)
        }
    }

    async invalidateRankings(
        request: RankingInvalidationRequest,
    ): Promise<void> {
        try {
            await this.pool.invalidateRankings(request)
        } catch (err) {
            if (err instanceof ServiceError) {
                throw err
            }
            throw new ServiceError(
                ServiceErrorType.InternalError,
                "Failed to invalidate rankings",
            )
        }
    }
}

export default function getCandidateRankingService(
    pool: CandidateRankingPool,
    events: ITrueFitEventRelaying,
): ICandidateRankingService {
    return new CandidateRankingService(pool, events)
}
