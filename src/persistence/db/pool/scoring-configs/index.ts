import { PrismaClient } from "@prisma/client"
import { handleDBError } from "helpers/serviceError"
import { Logger } from "types/logging"
import {
    ScoringConfigCreate,
    ScoringConfigUpdate,
    ScoringConfigWithDetails,
    ScoringPreview,
} from "types/scoring"

export interface ScoringConfigPool {
    /**
     * Get a scoring config by ID
     * @param {string} id - The ID of the config to get
     * @returns {Promise<ScoringConfigWithDetails | null>} - The config with details
     */
    getScoringConfigById(id: string): Promise<ScoringConfigWithDetails | null>

    /**
     * Get all scoring configs with optional filters
     * @param {boolean} isDefault - Filter by default status
     * @param {string} jobId - Filter by job ID
     * @returns {Promise<ScoringConfigWithDetails[]>} - The configs with details
     */
    getScoringConfigs(
        isDefault?: boolean,
        jobId?: string,
    ): Promise<ScoringConfigWithDetails[]>

    /**
     * Create a scoring config
     * @param {ScoringConfigCreate} config - The config to create
     * @returns {Promise<ScoringConfigWithDetails>} - The created config
     */
    createScoringConfig(
        config: ScoringConfigCreate,
    ): Promise<ScoringConfigWithDetails>

    /**
     * Update a scoring config
     * @param {string} id - The ID of the config to update
     * @param {ScoringConfigUpdate} config - The config data to update
     * @returns {Promise<ScoringConfigWithDetails>} - The updated config
     */
    updateScoringConfig(
        id: string,
        config: ScoringConfigUpdate,
    ): Promise<ScoringConfigWithDetails>

    /**
     * Delete a scoring config
     * @param {string} id - The ID of the config to delete
     * @returns {Promise<void>}
     */
    deleteScoringConfig(id: string): Promise<void>

    /**
     * Apply scoring config to a job
     * @param {string} configId - The ID of the config to apply
     * @param {string} jobId - The ID of the job to apply to
     * @returns {Promise<ScoringConfigWithDetails>} - The applied config
     */
    applyScoringConfig(
        configId: string,
        jobId: string,
    ): Promise<ScoringConfigWithDetails>

    /**
     * Preview impact of applying a scoring config
     * @param {string} configId - The ID of the config to preview
     * @param {string} jobId - The ID of the job to preview for
     * @returns {Promise<ScoringPreview>} - The preview results
     */
    previewScoringConfig(
        configId: string,
        jobId: string,
    ): Promise<ScoringPreview>
}

class ScoringConfigPoolImpl implements ScoringConfigPool {
    constructor(
        private readonly prisma: PrismaClient,
        private readonly logger: Logger,
    ) {}

    async getScoringConfigById(
        id: string,
    ): Promise<ScoringConfigWithDetails | null> {
        try {
            return this.prisma.scoringConfig.findUnique({
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
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getScoringConfigs(
        isDefault?: boolean,
        jobId?: string,
    ): Promise<ScoringConfigWithDetails[]> {
        try {
            return this.prisma.scoringConfig.findMany({
                where: {
                    ...(isDefault !== undefined && { isDefault }),
                    ...(jobId && { jobId }),
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
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async createScoringConfig(
        config: ScoringConfigCreate,
    ): Promise<ScoringConfigWithDetails> {
        try {
            // If setting as default, unset any existing default
            if (config.isDefault) {
                await this.prisma.scoringConfig.updateMany({
                    where: { isDefault: true },
                    data: { isDefault: false },
                })
            }

            return this.prisma.scoringConfig.create({
                data: config,
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
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async updateScoringConfig(
        id: string,
        config: ScoringConfigUpdate,
    ): Promise<ScoringConfigWithDetails> {
        try {
            // If setting as default, unset any existing default
            if (config.isDefault) {
                await this.prisma.scoringConfig.updateMany({
                    where: { isDefault: true },
                    data: { isDefault: false },
                })
            }

            return this.prisma.scoringConfig.update({
                where: { id },
                data: config,
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

    async applyScoringConfig(
        configId: string,
        jobId: string,
    ): Promise<ScoringConfigWithDetails> {
        try {
            // First, remove any existing config from the job
            await this.prisma.scoringConfig.update({
                where: { jobId },
                data: { jobId: null },
            })

            // Then apply the new config
            return this.prisma.scoringConfig.update({
                where: { id: configId },
                data: { jobId },
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
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async previewScoringConfig(
        configId: string,
        jobId: string,
    ): Promise<ScoringPreview> {
        try {
            // Get current config scores
            const currentScores = await this.prisma.$queryRaw`
                WITH RankedScores AS (
                    SELECT 
                        aa.id,
                        aa."applicantId",
                        COALESCE(SUM(CASE 
                            WHEN aw."isCorrect" THEN aq.weight 
                            ELSE -aq.weight * sc."negativeMarkingFraction"
                        END), 0) as score,
                        ROW_NUMBER() OVER (ORDER BY SUM(CASE 
                            WHEN aw."isCorrect" THEN aq.weight 
                            ELSE -aq.weight * sc."negativeMarkingFraction"
                        END) DESC) as rank,
                        COUNT(*) OVER () as total
                    FROM "applicant_assessments" aa
                    JOIN "assessment_templates" at ON aa."templateId" = at.id
                    JOIN "applicant_answers" aw ON aa.id = aw."assessmentId"
                    JOIN "assessment_questions" aq ON aw."questionId" = aq.id
                    LEFT JOIN "scoring_configs" sc ON sc."jobId" = at."jobId"
                    WHERE at."jobId" = ${jobId}
                    GROUP BY aa.id, aa."applicantId"
                )
                SELECT 
                    AVG(score) as score,
                    AVG(rank) as rank,
                    MAX(total) as total_candidates
                FROM RankedScores
            `

            // Get new config scores
            const newConfig = await this.prisma.scoringConfig.findUnique({
                where: { id: configId },
            })

            const newScores = await this.prisma.$queryRaw`
                WITH RankedScores AS (
                    SELECT 
                        aa.id,
                        aa."applicantId",
                        COALESCE(SUM(CASE 
                            WHEN aw."isCorrect" THEN aq.weight 
                            ELSE -aq.weight * ${
                                newConfig!.negativeMarkingFraction
                            }
                        END), 0) as score,
                        ROW_NUMBER() OVER (ORDER BY SUM(CASE 
                            WHEN aw."isCorrect" THEN aq.weight 
                            ELSE -aq.weight * ${
                                newConfig!.negativeMarkingFraction
                            }
                        END) DESC) as rank,
                        COUNT(*) OVER () as total
                    FROM "applicant_assessments" aa
                    JOIN "assessment_templates" at ON aa."templateId" = at.id
                    JOIN "applicant_answers" aw ON aa.id = aw."assessmentId"
                    JOIN "assessment_questions" aq ON aw."questionId" = aq.id
                    WHERE at."jobId" = ${jobId}
                    GROUP BY aa.id, aa."applicantId"
                )
                SELECT 
                    AVG(score) as score,
                    AVG(rank) as rank,
                    MAX(total) as total_candidates
                FROM RankedScores
            `

            type ScoreResult = {
                score: number
                rank: number
                total_candidates: number
            }

            const [current, newScore] = [
                (currentScores as unknown as ScoreResult[])[0],
                (newScores as unknown as ScoreResult[])[0],
            ]

            const currentScore = current?.score || 0
            const currentRank = current?.rank || 0
            const currentTotal = current?.total_candidates || 0
            const newScoreValue = newScore?.score || 0
            const newRank = newScore?.rank || 0
            const newTotal = newScore?.total_candidates || 0

            return {
                currentConfig: {
                    score: currentScore,
                    rank: currentRank,
                    totalCandidates: currentTotal,
                },
                newConfig: {
                    score: newScoreValue,
                    rank: newRank,
                    totalCandidates: newTotal,
                },
                changes: {
                    scoreChange: newScoreValue - currentScore,
                    rankChange: newRank - currentRank,
                    explanation: [
                        `Score will ${
                            newScoreValue > currentScore
                                ? "increase"
                                : "decrease"
                        } by ${Math.abs(newScoreValue - currentScore).toFixed(
                            2,
                        )} points`,
                        `Rank will ${
                            newRank < currentRank ? "improve" : "drop"
                        } by ${Math.abs(newRank - currentRank)} positions`,
                    ],
                },
            }
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
