import { PrismaClient, RankingStatus } from "@prisma/client"
import { handleDBError } from "helpers/serviceError"
import { Logger } from "types/logging"
import {
    CandidateRankingWithDetails,
    TopCandidatesResponse,
    RankingCalculationResult,
    CandidateScore,
    RankingInvalidationRequest,
    JobRankingStatus,
} from "types/candidate-ranking"
import crypto from "crypto"

export interface CandidateRankingPool {
    /**
     * Get top candidates for a job
     * @param {string} jobId - The ID of the job
     * @param {number} limit - Number of top candidates to return
     * @returns {Promise<TopCandidatesResponse>} - Top candidates with metadata
     */
    getTopCandidates(
        jobId: string,
        limit?: number,
    ): Promise<TopCandidatesResponse>

    /**
     * Calculate and store rankings for a job
     * @param {string} jobId - The ID of the job
     * @param {string} triggerEvent - What triggered the calculation
     * @returns {Promise<RankingCalculationResult>} - Calculation results
     */
    calculateJobRankings(
        jobId: string,
        triggerEvent: string,
    ): Promise<RankingCalculationResult>

    /**
     * Invalidate rankings based on various criteria
     * @param {RankingInvalidationRequest} request - Invalidation criteria
     * @returns {Promise<void>}
     */
    invalidateRankings(request: RankingInvalidationRequest): Promise<void>

    /**
     * Get ranking status for a job
     * @param {string} jobId - The ID of the job
     * @returns {Promise<JobRankingStatus | null>} - Ranking status
     */
    getJobRankingStatus(jobId: string): Promise<JobRankingStatus | null>

    /**
     * Get jobs that need ranking recalculation
     * @param {number} limit - Maximum number of jobs to return
     * @returns {Promise<string[]>} - Job IDs that need recalculation
     */
    getJobsNeedingRecalculation(limit?: number): Promise<string[]>

    /**
     * Mark rankings as stale for a specific job
     * @param {string} jobId - The ID of the job
     * @param {string} reason - Reason for marking as stale
     * @returns {Promise<void>}
     */
    markRankingsStale(jobId: string, reason: string): Promise<void>

    /**
     * Get scoring config version hash
     * @param {string} jobId - The ID of the job
     * @returns {Promise<string>} - Config version hash
     */
    getScoringConfigVersion(jobId: string): Promise<string>
}

class CandidateRankingPoolImpl implements CandidateRankingPool {
    constructor(
        private readonly prisma: PrismaClient,
        private readonly logger: Logger,
    ) {}

    async getTopCandidates(
        jobId: string,
        limit = 5,
    ): Promise<TopCandidatesResponse> {
        try {
            // Get metadata first
            const metadata = await this.prisma.jobRankingMetadata.findUnique({
                where: { jobId },
            })

            // If no metadata or stale, return empty with status
            if (!metadata || metadata.status === RankingStatus.STALE) {
                return {
                    jobId,
                    candidates: [],
                    metadata: {
                        totalCandidates: 0,
                        lastCalculatedAt: null,
                        calculationDuration: null,
                        status: RankingStatus.STALE,
                    },
                }
            }

            // Get top candidates
            const candidates = await this.prisma.candidateRanking.findMany({
                where: {
                    jobId,
                    isStale: false,
                },
                include: {
                    applicant: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            city: true,
                            country: true,
                        },
                    },
                    job: {
                        include: {
                            branch: {
                                include: {
                                    company: {
                                        select: {
                                            id: true,
                                            name: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    assessment: {
                        select: {
                            id: true,
                            submittedAt: true,
                        },
                    },
                },
                orderBy: { rank: "asc" },
                take: limit,
            })

            return {
                jobId,
                candidates,
                metadata: {
                    totalCandidates: metadata.totalCandidates,
                    lastCalculatedAt: metadata.lastCalculatedAt,
                    calculationDuration: metadata.calculationDuration,
                    status: metadata.status,
                },
            }
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async calculateJobRankings(
        jobId: string,
        triggerEvent: string,
    ): Promise<RankingCalculationResult> {
        const startTime = Date.now()

        try {
            // Get scoring config version
            const configVersion = await this.getScoringConfigVersion(jobId)

            // Use transaction for atomic operation
            const result = await this.prisma.$transaction(async (tx) => {
                // Mark as calculating
                await tx.jobRankingMetadata.upsert({
                    where: { jobId },
                    update: {
                        status: RankingStatus.CALCULATING,
                        triggerEvent,
                        errorMessage: null,
                        scoringConfigVersion: configVersion,
                    },
                    create: {
                        jobId,
                        status: RankingStatus.CALCULATING,
                        triggerEvent,
                        scoringConfigVersion: configVersion,
                        totalCandidates: 0,
                    },
                })

                // Calculate scores using optimized SQL
                const scores = await this.calculateCandidateScores(tx, jobId)

                // Clear existing rankings
                await tx.candidateRanking.deleteMany({
                    where: { jobId },
                })

                // Insert new rankings
                const rankedCandidates = scores.map((score, index) => ({
                    jobId,
                    applicantId: score.applicantId,
                    assessmentId: score.assessmentId,
                    rank: index + 1,
                    score: score.score,
                    maxPossibleScore: score.maxPossibleScore,
                    percentage: score.percentage,
                    correctAnswers: score.correctAnswers,
                    incorrectAnswers: score.incorrectAnswers,
                    recencyBonus: score.recencyBonus || 0,
                    scoringConfigVersion: configVersion,
                    calculatedAt: new Date(),
                    isStale: false,
                }))

                await tx.candidateRanking.createMany({
                    data: rankedCandidates,
                })

                const calculationDuration = Date.now() - startTime

                // Update or create metadata (upsert to handle first-time calculations)
                await tx.jobRankingMetadata.upsert({
                    where: { jobId },
                    create: {
                        jobId,
                        status: RankingStatus.COMPLETED,
                        totalCandidates: scores.length,
                        lastCalculatedAt: new Date(),
                        calculationDuration,
                        scoringConfigVersion: configVersion,
                    },
                    update: {
                        status: RankingStatus.COMPLETED,
                        totalCandidates: scores.length,
                        lastCalculatedAt: new Date(),
                        calculationDuration,
                        scoringConfigVersion: configVersion,
                    },
                })

                return {
                    jobId,
                    totalCandidates: scores.length,
                    calculationDuration,
                    rankedCandidates: rankedCandidates.map((r) => ({
                        ...r,
                        id: crypto.randomUUID(),
                    })),
                    scoringConfigVersion: configVersion,
                }
            })

            this.logger.info("Calculated job rankings", {
                jobId,
                totalCandidates: result.totalCandidates,
                duration: result.calculationDuration,
                trigger: triggerEvent,
            })

            return result
        } catch (err) {
            const calculationDuration = Date.now() - startTime

            // Mark as error
            await this.prisma.jobRankingMetadata.upsert({
                where: { jobId },
                update: {
                    status: RankingStatus.ERROR,
                    errorMessage:
                        err instanceof Error ? err.message : "Unknown error",
                    calculationDuration,
                },
                create: {
                    jobId,
                    status: RankingStatus.ERROR,
                    errorMessage:
                        err instanceof Error ? err.message : "Unknown error",
                    calculationDuration,
                    scoringConfigVersion: "",
                    totalCandidates: 0,
                },
            })

            handleDBError(err, this.logger)
        }
    }

    private async calculateCandidateScores(
        tx: any,
        jobId: string,
    ): Promise<CandidateScore[]> {
        // Get scoring config
        const scoringConfig = await tx.scoringConfig.findFirst({
            where: {
                OR: [{ jobId }, { isDefault: true }],
            },
            orderBy: { jobId: "asc" }, // Prefer job-specific config
        })

        if (!scoringConfig) {
            throw new Error("No scoring configuration found")
        }

        // Optimized SQL query to calculate scores
        const rawScores = await tx.$queryRaw`
            WITH LatestAssessments AS (
                SELECT DISTINCT ON (aa."applicantId")
                    aa."applicantId",
                    aa.id as "assessmentId",
                    aa."submittedAt",
                    at.id as "templateId"
                FROM applicant_assessments aa
                JOIN assessment_templates at ON aa."templateId" = at.id
                WHERE aa."jobId" = ${jobId}::uuid
                ORDER BY aa."applicantId", aa."submittedAt" DESC
            ),
            ScoredAnswers AS (
                SELECT 
                    la."applicantId",
                    la."assessmentId",
                    la."submittedAt",
                    SUM(CASE 
                        WHEN aw."isCorrect" THEN aq.weight 
                        ELSE -aq.weight * ${scoringConfig.negativeMarkingFraction}
                    END) as "baseScore",
                    SUM(aq.weight) as "maxPossibleScore",
                    SUM(CASE WHEN aw."isCorrect" THEN 1 ELSE 0 END) as "correctAnswers",
                    SUM(CASE WHEN NOT aw."isCorrect" THEN 1 ELSE 0 END) as "incorrectAnswers"
                FROM LatestAssessments la
                JOIN applicant_answers aw ON la."assessmentId" = aw."assessmentId"
                JOIN assessment_questions aq ON aw."questionId" = aq.id
                GROUP BY la."applicantId", la."assessmentId", la."submittedAt"
            ),
            FinalScores AS (
                SELECT 
                    "applicantId",
                    "assessmentId",
                    "baseScore",
                    "maxPossibleScore",
                    "correctAnswers",
                    "incorrectAnswers",
                    CASE 
                        WHEN ${scoringConfig.recencyBoostPercent} IS NOT NULL 
                             AND ${scoringConfig.recencyWindowDays} IS NOT NULL
                             AND "submittedAt" > NOW() - INTERVAL '${scoringConfig.recencyWindowDays} days'
                        THEN "baseScore" * ${scoringConfig.recencyBoostPercent} / 100
                        ELSE 0
                    END as "recencyBonus"
                FROM ScoredAnswers
            )
            SELECT 
                "applicantId",
                "assessmentId",
                ("baseScore" + "recencyBonus") as score,
                "maxPossibleScore",
                CASE 
                    WHEN "maxPossibleScore" > 0 
                    THEN (("baseScore" + "recencyBonus") / "maxPossibleScore") * 100
                    ELSE 0
                END as percentage,
                "correctAnswers",
                "incorrectAnswers",
                "recencyBonus"
            FROM FinalScores
            ORDER BY ("baseScore" + "recencyBonus") DESC
        `

        return rawScores.map((row: any) => ({
            applicantId: row.applicantId,
            assessmentId: row.assessmentId,
            score: parseFloat(row.score) || 0,
            maxPossibleScore: parseFloat(row.maxPossibleScore) || 0,
            percentage: parseFloat(row.percentage) || 0,
            correctAnswers: parseInt(row.correctAnswers) || 0,
            incorrectAnswers: parseInt(row.incorrectAnswers) || 0,
            recencyBonus: parseFloat(row.recencyBonus) || undefined,
        }))
    }

    async invalidateRankings(
        request: RankingInvalidationRequest,
    ): Promise<void> {
        try {
            if (request.jobId) {
                // Invalidate specific job
                await this.markRankingsStale(
                    request.jobId,
                    request.triggerEvent,
                )
            } else if (request.scoringConfigId) {
                // Invalidate all jobs using this scoring config
                const affectedJobs = await this.prisma.job.findMany({
                    where: {
                        OR: [
                            { scoringConfig: { id: request.scoringConfigId } },
                            { scoringConfig: null }, // Jobs using default config
                        ],
                    },
                    select: { id: true },
                })

                for (const job of affectedJobs) {
                    await this.markRankingsStale(job.id, request.triggerEvent)
                }
            } else if (request.applicantId) {
                // Invalidate all jobs where this applicant has assessments
                const affectedJobs = await this.prisma.job.findMany({
                    where: {
                        templates: {
                            some: {
                                assessments: {
                                    some: {
                                        applicantId: request.applicantId,
                                    },
                                },
                            },
                        },
                    },
                    select: { id: true },
                })

                for (const job of affectedJobs) {
                    await this.markRankingsStale(job.id, request.triggerEvent)
                }
            }
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getJobRankingStatus(jobId: string): Promise<JobRankingStatus | null> {
        try {
            const metadata = await this.prisma.jobRankingMetadata.findUnique({
                where: { jobId },
            })

            if (!metadata) {
                return null
            }

            const hasStaleRankings = await this.prisma.candidateRanking.count({
                where: { jobId, isStale: true },
            })

            return {
                jobId,
                status: metadata.status,
                totalCandidates: metadata.totalCandidates,
                lastCalculatedAt: metadata.lastCalculatedAt,
                isStale:
                    hasStaleRankings > 0 ||
                    metadata.status === RankingStatus.STALE,
                errorMessage: metadata.errorMessage,
            }
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getJobsNeedingRecalculation(limit = 10): Promise<string[]> {
        try {
            const jobs = await this.prisma.jobRankingMetadata.findMany({
                where: {
                    OR: [
                        { status: RankingStatus.STALE },
                        { status: RankingStatus.ERROR },
                        {
                            AND: [
                                { status: RankingStatus.COMPLETED },
                                {
                                    lastCalculatedAt: {
                                        lt: new Date(
                                            Date.now() - 24 * 60 * 60 * 1000,
                                        ), // 24 hours ago
                                    },
                                },
                            ],
                        },
                    ],
                },
                select: { jobId: true },
                orderBy: [
                    { status: "asc" }, // STALE first, then ERROR, then old COMPLETED
                    { lastCalculatedAt: "asc" },
                ],
                take: limit,
            })

            return jobs.map((job) => job.jobId)
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async markRankingsStale(jobId: string, reason: string): Promise<void> {
        try {
            await this.prisma.$transaction([
                // Mark existing rankings as stale
                this.prisma.candidateRanking.updateMany({
                    where: { jobId },
                    data: { isStale: true },
                }),
                // Update metadata
                this.prisma.jobRankingMetadata.upsert({
                    where: { jobId },
                    update: {
                        status: RankingStatus.STALE,
                        triggerEvent: reason,
                    },
                    create: {
                        jobId,
                        status: RankingStatus.STALE,
                        triggerEvent: reason,
                        scoringConfigVersion: "",
                        totalCandidates: 0,
                    },
                }),
            ])

            this.logger.info("Marked rankings as stale", { jobId, reason })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getScoringConfigVersion(jobId: string): Promise<string> {
        try {
            const config = await this.prisma.scoringConfig.findFirst({
                where: {
                    OR: [{ jobId }, { isDefault: true }],
                },
                orderBy: { jobId: "asc" }, // Prefer job-specific config
            })

            if (!config) {
                return "default"
            }

            // Create hash of config values for version tracking
            const configString = JSON.stringify({
                id: config.id,
                negativeMarkingFraction: config.negativeMarkingFraction,
                recencyWindowDays: config.recencyWindowDays,
                recencyBoostPercent: config.recencyBoostPercent,
                updatedAt: config.updatedAt.toISOString(),
            })

            return crypto
                .createHash("sha256")
                .update(configString)
                .digest("hex")
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }
}

export default function getCandidateRankingPool(
    prisma: PrismaClient,
    logger: Logger,
): CandidateRankingPool {
    return new CandidateRankingPoolImpl(prisma, logger)
}
