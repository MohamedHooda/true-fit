import { PrismaClient } from "@prisma/client"
import { handleDBError } from "helpers/serviceError"
import { Logger } from "types/logging"
import {
    ScoringConfig,
    ScoringConfigWithJob,
    ScoringConfigCreate,
    ScoringConfigUpdate,
    ScoringResult,
} from "types/scoring"
import { AssessmentScoreBreakdown } from "types/assessment"

export interface ScoringConfigPool {
    /**
     * Get a scoring config by ID
     * @param {string} id - The ID of the config to get
     * @returns {Promise<ScoringConfig | null>} - The scoring config
     */
    getScoringConfigById(id: string): Promise<ScoringConfig | null>

    /**
     * Get a scoring config with job details
     * @param {string} id - The ID of the config to get
     * @returns {Promise<ScoringConfigWithJob | null>} - The config with job details
     */
    getScoringConfigWithJob(id: string): Promise<ScoringConfigWithJob | null>

    /**
     * Get scoring config by job ID
     * @param {string} jobId - The ID of the job
     * @returns {Promise<ScoringConfig | null>} - The scoring config for the job
     */
    getScoringConfigByJobId(jobId: string): Promise<ScoringConfig | null>

    /**
     * Get the default scoring config
     * @returns {Promise<ScoringConfig | null>} - The default scoring config
     */
    getDefaultScoringConfig(): Promise<ScoringConfig | null>

    /**
     * Get scoring configs by company ID
     * @param {string} companyId - The ID of the company
     * @returns {Promise<ScoringConfigWithJob[]>} - The scoring configs for the company
     */
    getScoringConfigsByCompanyId(
        companyId: string,
    ): Promise<ScoringConfigWithJob[]>

    /**
     * Create a scoring config
     * @param {ScoringConfigCreate} config - The config to create
     * @returns {Promise<ScoringConfig>} - The created config
     */
    createScoringConfig(config: ScoringConfigCreate): Promise<ScoringConfig>

    /**
     * Delete a scoring config
     * @param {string} id - The ID of the config to delete
     * @returns {Promise<void>}
     */
    deleteScoringConfig(id: string): Promise<void>

    /**
     * Get all scoring configs
     * @param {number} limit - Maximum number of configs to return
     * @param {number} offset - Number of configs to skip
     * @returns {Promise<ScoringConfigWithJob[]>} - The scoring configs with job details
     */
    getScoringConfigs(
        limit?: number,
        offset?: number,
    ): Promise<ScoringConfigWithJob[]>

    /**
     * Update a scoring config
     * @param {string} id - The ID of the config to update
     * @param {ScoringConfigUpdate} config - The config data to update
     * @returns {Promise<ScoringConfig>} - The updated config
     */
    updateScoringConfig(
        id: string,
        config: ScoringConfigUpdate,
    ): Promise<ScoringConfig>

    /**
     * Set a config as the default (unsets all other defaults)
     * @param {string} id - The ID of the config to set as default
     * @returns {Promise<ScoringConfig>} - The updated config
     */
    setAsDefault(id: string): Promise<ScoringConfig>

    /**
     * Get or create scoring config for a job (falls back to default if none exists)
     * @param {string} jobId - The job ID
     * @returns {Promise<ScoringConfig>} - The scoring config for the job
     */
    getOrCreateScoringConfigForJob(jobId: string): Promise<ScoringConfig>

    /**
     * Calculate assessment score using a scoring config
     * @param {string} configId - The scoring config ID
     * @param {string} assessmentId - The assessment ID
     * @returns {Promise<{score: number, maxScore: number, percentage: number, breakdown: any}>}
     */
    calculateAssessmentScore(
        configId: string,
        assessmentId: string,
    ): Promise<AssessmentScoreBreakdown>

    /**
     * Apply scoring config to multiple assessments
     * @param {string} configId - The scoring config ID
     * @param {string[]} assessmentIds - Array of assessment IDs
     * @returns {Promise<Array<{assessmentId: string, score: number, percentage: number}>>}
     */
    bulkCalculateScores(
        configId: string,
        assessmentIds: string[],
    ): Promise<ScoringResult[]>
}

class ScoringConfigPoolImpl implements ScoringConfigPool {
    constructor(
        private readonly prisma: PrismaClient,
        private readonly logger: Logger,
    ) {}

    async getScoringConfigById(id: string): Promise<ScoringConfig | null> {
        try {
            return this.prisma.scoringConfig.findUnique({
                where: { id },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getScoringConfigWithJob(
        id: string,
    ): Promise<ScoringConfigWithJob | null> {
        try {
            const config = await this.prisma.scoringConfig.findUnique({
                where: { id },
                include: {
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
                },
            })

            return config
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getScoringConfigByJobId(
        jobId: string,
    ): Promise<ScoringConfig | null> {
        try {
            return this.prisma.scoringConfig.findUnique({
                where: { jobId },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getDefaultScoringConfig(): Promise<ScoringConfig | null> {
        try {
            return this.prisma.scoringConfig.findFirst({
                where: { isDefault: true },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getScoringConfigsByCompanyId(
        companyId: string,
    ): Promise<ScoringConfigWithJob[]> {
        try {
            return this.prisma.scoringConfig.findMany({
                where: {
                    job: {
                        branch: {
                            companyId,
                        },
                    },
                },
                include: {
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
                },
                orderBy: { createdAt: "desc" },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async createScoringConfig(
        config: ScoringConfigCreate,
    ): Promise<ScoringConfig> {
        try {
            // If setting as default, unset all other defaults first
            if (config.isDefault) {
                await this.prisma.scoringConfig.updateMany({
                    where: { isDefault: true },
                    data: { isDefault: false },
                })
            }

            return this.prisma.scoringConfig.create({
                data: config,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async deleteScoringConfig(id: string): Promise<void> {
        try {
            await this.prisma.scoringConfig.delete({
                where: { id },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getScoringConfigs(
        limit: number = 50,
        offset: number = 0,
    ): Promise<ScoringConfigWithJob[]> {
        try {
            return this.prisma.scoringConfig.findMany({
                include: {
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
                },
                orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
                take: limit,
                skip: offset,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async updateScoringConfig(
        id: string,
        config: ScoringConfigUpdate,
    ): Promise<ScoringConfig> {
        try {
            // If setting as default, unset all other defaults first
            if (config.isDefault) {
                await this.prisma.scoringConfig.updateMany({
                    where: { isDefault: true, id: { not: id } },
                    data: { isDefault: false },
                })
            }

            return this.prisma.scoringConfig.update({
                where: { id },
                data: config,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async setAsDefault(id: string): Promise<ScoringConfig> {
        try {
            // Use transaction to ensure atomicity
            const result = await this.prisma.$transaction(async (tx) => {
                // Unset all other defaults
                await tx.scoringConfig.updateMany({
                    where: { isDefault: true },
                    data: { isDefault: false },
                })

                // Set this config as default
                return tx.scoringConfig.update({
                    where: { id },
                    data: { isDefault: true },
                })
            })

            return result
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getOrCreateScoringConfigForJob(
        jobId: string,
    ): Promise<ScoringConfig> {
        try {
            // First try to get job-specific config
            let config = await this.prisma.scoringConfig.findUnique({
                where: { jobId },
            })

            if (!config) {
                // If no job-specific config, get default
                config = await this.prisma.scoringConfig.findFirst({
                    where: { isDefault: true },
                })

                if (!config) {
                    // If no default, create one
                    config = await this.prisma.scoringConfig.create({
                        data: {
                            negativeMarkingFraction: 0.0,
                            isDefault: true,
                        },
                    })
                }
            }

            return config
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async calculateAssessmentScore(
        configId: string,
        assessmentId: string,
    ): Promise<AssessmentScoreBreakdown> {
        try {
            const [config, assessment] = await Promise.all([
                this.prisma.scoringConfig.findUnique({
                    where: { id: configId },
                }),
                this.prisma.applicantAssessment.findUnique({
                    where: { id: assessmentId },
                    include: {
                        answers: {
                            include: {
                                question: {
                                    select: {
                                        weight: true,
                                        negativeWeight: true,
                                    },
                                },
                            },
                        },
                    },
                }),
            ])

            if (!config || !assessment) {
                throw new Error("Config or assessment not found")
            }

            let score = 0
            let maxScore = 0
            let correctAnswers = 0
            let incorrectAnswers = 0
            let negativeMarking = 0

            // Calculate base score
            for (const answer of assessment.answers) {
                const weight = answer.question.weight
                maxScore += weight

                if (answer.isCorrect) {
                    score += weight
                    correctAnswers++
                } else {
                    incorrectAnswers++
                    // Apply negative marking
                    const negativeWeight =
                        answer.question.negativeWeight ||
                        weight * config.negativeMarkingFraction
                    score -= negativeWeight
                    negativeMarking += negativeWeight
                }
            }

            // Apply recency boost if configured
            let recencyBoost = 0
            if (config.recencyWindowDays && config.recencyBoostPercent) {
                const cutoffDate = new Date()
                cutoffDate.setDate(
                    cutoffDate.getDate() - config.recencyWindowDays,
                )

                if (assessment.submittedAt >= cutoffDate) {
                    recencyBoost = score * (config.recencyBoostPercent / 100)
                    score += recencyBoost
                }
            }

            // Ensure score doesn't go below 0
            score = Math.max(0, score)

            const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0

            return {
                score,
                maxScore,
                percentage,
                breakdown: {
                    totalQuestions: assessment.answers.length,
                    correctAnswers,
                    incorrectAnswers,
                    negativeMarking,
                    recencyBoost,
                },
            }
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async bulkCalculateScores(
        configId: string,
        assessmentIds: string[],
    ): Promise<ScoringResult[]> {
        try {
            const results = []

            for (const assessmentId of assessmentIds) {
                const scoreResult = await this.calculateAssessmentScore(
                    configId,
                    assessmentId,
                )
                results.push({
                    assessmentId,
                    score: scoreResult.score,
                    percentage: scoreResult.percentage,
                })
            }

            return results
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }
}

export default function getScoringConfigPool(
    prisma: PrismaClient,
    logger: Logger,
): ScoringConfigPool {
    return new ScoringConfigPoolImpl(prisma, logger)
}
