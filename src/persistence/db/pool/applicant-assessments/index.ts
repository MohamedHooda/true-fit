import { PrismaClient } from "@prisma/client"
import { handleDBError } from "helpers/serviceError"
import { Logger } from "types/logging"
import {
    ApplicantAssessmentWithDetails,
    AssessmentSubmission,
    AssessmentScore,
    AssessmentScoreWithDetails,
    AssessmentExplanation,
    AssessmentFilters,
    AssessmentStats,
} from "types/applicant-assessment"
import { ServiceError, ServiceErrorType } from "types/serviceError"

export interface ApplicantAssessmentPool {
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

class ApplicantAssessmentPoolImpl implements ApplicantAssessmentPool {
    constructor(
        private readonly prisma: PrismaClient,
        private readonly logger: Logger,
    ) {}

    async getAssessmentById(
        id: string,
    ): Promise<ApplicantAssessmentWithDetails | null> {
        try {
            return this.prisma.applicantAssessment.findUnique({
                where: { id },
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
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                    template: {
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
                    },
                    answers: {
                        include: {
                            question: {
                                select: {
                                    id: true,
                                    text: true,
                                    type: true,
                                    weight: true,
                                    correctAnswer: true,
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

    async getAssessments(
        filters?: AssessmentFilters,
        limit?: number,
        offset?: number,
    ): Promise<ApplicantAssessmentWithDetails[]> {
        try {
            return this.prisma.applicantAssessment.findMany({
                where: {
                    ...(filters?.applicantId && {
                        applicantId: filters.applicantId,
                    }),
                    ...(filters?.templateId && {
                        templateId: filters.templateId,
                    }),
                    ...(filters?.jobId && {
                        template: { jobId: filters.jobId },
                    }),
                    ...(filters?.companyId && {
                        template: {
                            job: { branch: { companyId: filters.companyId } },
                        },
                    }),
                    ...(filters?.submittedAfter && {
                        submittedAt: { gte: filters.submittedAfter },
                    }),
                    ...(filters?.submittedBefore && {
                        submittedAt: { lte: filters.submittedBefore },
                    }),
                    ...(filters?.isCorrect !== undefined && {
                        answers: { some: { isCorrect: filters.isCorrect } },
                    }),
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
                    template: {
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
                    },
                    answers: {
                        include: {
                            question: {
                                select: {
                                    id: true,
                                    text: true,
                                    type: true,
                                    weight: true,
                                    correctAnswer: true,
                                },
                            },
                        },
                    },
                },
                take: limit,
                skip: offset,
                orderBy: { submittedAt: "desc" },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async submitAssessment(
        submission: AssessmentSubmission,
    ): Promise<ApplicantAssessmentWithDetails> {
        try {
            // Use transaction to create assessment and answers
            const result = await this.prisma.$transaction(async (tx) => {
                // Create assessment
                const assessment = await tx.applicantAssessment.create({
                    data: {
                        applicantId: submission.applicantId,
                        templateId: submission.templateId,
                        jobId: submission.jobId,
                        submittedAt: new Date(),
                    },
                })

                // Get questions for validation and scoring
                const questions = await tx.assessmentQuestion.findMany({
                    where: { templateId: submission.templateId },
                })

                // Create answers with correctness check
                const answers = await Promise.all(
                    submission.answers.map(async (answer) => {
                        const question = questions.find(
                            (q) => q.id === answer.questionId,
                        )
                        if (!question) {
                            throw new ServiceError(
                                ServiceErrorType.NotFound,
                                `Question ${answer.questionId} not found`,
                            )
                        }

                        return tx.applicantAnswer.create({
                            data: {
                                assessmentId: assessment.id,
                                questionId: answer.questionId,
                                answer: answer.answer,
                                isCorrect:
                                    answer.answer === question.correctAnswer,
                            },
                        })
                    }),
                )

                // Return assessment with details
                return tx.applicantAssessment.findUnique({
                    where: { id: assessment.id },
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
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                        template: {
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
                        },
                        answers: {
                            include: {
                                question: {
                                    select: {
                                        id: true,
                                        text: true,
                                        type: true,
                                        weight: true,
                                        correctAnswer: true,
                                    },
                                },
                            },
                        },
                    },
                })
            })

            if (!result) {
                throw new ServiceError(
                    ServiceErrorType.InternalError,
                    "Failed to create assessment",
                )
            }

            return result
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getAssessmentScore(id: string): Promise<AssessmentScoreWithDetails> {
        try {
            const assessment = await this.prisma.applicantAssessment.findUnique(
                {
                    where: { id },
                    include: {
                        applicant: true,
                        template: {
                            include: {
                                job: {
                                    include: {
                                        scoringConfig: true,
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
                        },
                        answers: {
                            include: {
                                question: true,
                            },
                        },
                    },
                },
            )

            if (!assessment) {
                throw new ServiceError(
                    ServiceErrorType.NotFound,
                    "Assessment not found",
                )
            }

            // Get scoring config (job-specific or default)
            const scoringConfig =
                assessment.template.job?.scoringConfig ||
                (await this.prisma.scoringConfig.findFirst({
                    where: { isDefault: true },
                }))

            if (!scoringConfig) {
                throw new ServiceError(
                    ServiceErrorType.NotFound,
                    "No scoring configuration found",
                )
            }

            // Calculate base score
            let totalPoints = 0
            let maxPossiblePoints = 0
            let correctAnswers = 0
            let incorrectAnswers = 0

            assessment.answers.forEach((answer) => {
                const weight = answer.question.weight
                maxPossiblePoints += weight

                if (answer.isCorrect) {
                    totalPoints += weight
                    correctAnswers++
                } else {
                    totalPoints -=
                        weight * scoringConfig.negativeMarkingFraction
                    incorrectAnswers++
                }
            })

            // Apply recency boost if configured
            let recencyBonus = 0
            if (
                scoringConfig.recencyBoostPercent &&
                scoringConfig.recencyWindowDays
            ) {
                const submissionDate = assessment.submittedAt
                const now = new Date()
                const daysDiff = Math.floor(
                    (now.getTime() - submissionDate.getTime()) /
                        (1000 * 60 * 60 * 24),
                )

                if (daysDiff <= scoringConfig.recencyWindowDays) {
                    recencyBonus =
                        (totalPoints * scoringConfig.recencyBoostPercent) / 100
                    totalPoints += recencyBonus
                }
            }

            return {
                assessmentId: assessment.id,
                applicantId: assessment.applicantId,
                templateId: assessment.templateId,
                submittedAt: assessment.submittedAt,
                scoredAt: new Date(),
                scoringConfigId: scoringConfig.id,
                score: totalPoints,
                maxPossibleScore: maxPossiblePoints,
                percentage: (totalPoints / maxPossiblePoints) * 100,
                breakdown: {
                    correctAnswers: {
                        count: correctAnswers,
                        points:
                            correctAnswers *
                            assessment.answers[0].question.weight,
                    },
                    incorrectAnswers: {
                        count: incorrectAnswers,
                        points:
                            -incorrectAnswers *
                            assessment.answers[0].question.weight *
                            scoringConfig.negativeMarkingFraction,
                    },
                    recencyBonus: recencyBonus
                        ? {
                              percentage: scoringConfig.recencyBoostPercent!,
                              points: recencyBonus,
                          }
                        : undefined,
                },
                explanation: [
                    `Correct answers: ${correctAnswers} (+${
                        correctAnswers * assessment.answers[0].question.weight
                    } points)`,
                    `Incorrect answers: ${incorrectAnswers} (${
                        -incorrectAnswers *
                        assessment.answers[0].question.weight *
                        scoringConfig.negativeMarkingFraction
                    } points)`,
                    ...(recencyBonus
                        ? [
                              `Recency bonus: +${recencyBonus.toFixed(
                                  2,
                              )} points (${
                                  scoringConfig.recencyBoostPercent
                              }% boost)`,
                          ]
                        : []),
                ],
                assessment: assessment as ApplicantAssessmentWithDetails,
                scoringConfig,
            }
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getAssessmentExplanation(id: string): Promise<AssessmentExplanation> {
        try {
            const score = await this.getAssessmentScore(id)
            const assessment = score.assessment

            return {
                assessmentId: assessment.id,
                applicantId: assessment.applicantId,
                templateId: assessment.templateId,
                submittedAt: assessment.submittedAt,
                scoredAt: score.scoredAt,
                scoringConfigId: score.scoringConfigId,
                config: {
                    negativeMarking:
                        score.scoringConfig.negativeMarkingFraction > 0,
                    negativeMarkingFraction:
                        score.scoringConfig.negativeMarkingFraction,
                    recencyBoost: !!score.scoringConfig.recencyBoostPercent,
                    recencyWindowDays:
                        score.scoringConfig.recencyWindowDays || undefined,
                    recencyBoostPercent:
                        score.scoringConfig.recencyBoostPercent || undefined,
                },
                assessment: {
                    totalQuestions: assessment.answers.length,
                    answeredQuestions: assessment.answers.filter(
                        (a) => a.answer !== null,
                    ).length,
                    correctAnswers: assessment.answers.filter(
                        (a) => a.isCorrect,
                    ).length,
                    incorrectAnswers: assessment.answers.filter(
                        (a) => !a.isCorrect,
                    ).length,
                    timeTaken: 0, // Not tracking time yet
                    submittedAt: assessment.submittedAt,
                },
                scoring: {
                    baseScore:
                        score.breakdown.correctAnswers.points +
                        score.breakdown.incorrectAnswers.points,
                    negativeMarking: Math.abs(
                        score.breakdown.incorrectAnswers.points,
                    ),
                    recencyBonus: score.breakdown.recencyBonus?.points || 0,
                    finalScore: score.score,
                    maxPossibleScore: score.maxPossibleScore,
                },
                breakdown: assessment.answers.map((answer) => ({
                    questionId: answer.question.id,
                    weight: answer.question.weight,
                    answer: answer.answer || "",
                    isCorrect: answer.isCorrect,
                    points: answer.isCorrect
                        ? answer.question.weight
                        : -answer.question.weight *
                          score.scoringConfig.negativeMarkingFraction,
                    explanation: answer.isCorrect
                        ? `Correct answer (+${answer.question.weight} points)`
                        : `Incorrect answer (-${
                              answer.question.weight *
                              score.scoringConfig.negativeMarkingFraction
                          } points)`,
                })),
            }
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getAssessmentStats(
        templateId?: string,
        jobId?: string,
    ): Promise<AssessmentStats> {
        try {
            // Base query conditions
            const where = {
                ...(templateId && { templateId }),
                ...(jobId && { template: { jobId } }),
            }

            // Get all assessments matching criteria
            const assessments = await this.prisma.applicantAssessment.findMany({
                where,
                include: {
                    answers: true,
                    template: {
                        include: {
                            questions: true,
                        },
                    },
                },
            })

            if (assessments.length === 0) {
                return {
                    totalAssessments: 0,
                    averageScore: 0,
                    medianScore: 0,
                    completionRate: 0,
                    averageTimeSpent: 0,
                    scoreDistribution: [],
                    correctAnswerRate: 0,
                    questionStats: [],
                }
            }

            // Calculate scores
            const scores = assessments.map((assessment) => {
                const totalQuestions = assessment.template.questions.length
                const answeredQuestions = assessment.answers.length
                const correctAnswers = assessment.answers.filter(
                    (a) => a.isCorrect,
                ).length

                return {
                    score: (correctAnswers / totalQuestions) * 100,
                    completed: answeredQuestions === totalQuestions,
                    correctAnswers,
                    totalAnswers: answeredQuestions,
                }
            })

            // Sort scores for median calculation
            const sortedScores = [...scores].sort((a, b) => a.score - b.score)
            const midPoint = Math.floor(sortedScores.length / 2)

            // Calculate score distribution
            const distribution = new Map<string, number>()
            scores.forEach((score) => {
                const range = `${Math.floor(score.score / 10) * 10}-${
                    Math.floor(score.score / 10) * 10 + 10
                }`
                distribution.set(range, (distribution.get(range) || 0) + 1)
            })

            // Calculate question statistics
            const questionStats = new Map<
                string,
                { correct: number; total: number; text: string }
            >()
            assessments.forEach((assessment) => {
                assessment.answers.forEach((answer) => {
                    const stats = questionStats.get(answer.questionId) || {
                        correct: 0,
                        total: 0,
                        text: "",
                    }
                    if (answer.isCorrect) stats.correct++
                    stats.total++
                    questionStats.set(answer.questionId, stats)
                })
            })

            return {
                totalAssessments: assessments.length,
                averageScore:
                    scores.reduce((sum, s) => sum + s.score, 0) / scores.length,
                medianScore:
                    scores.length % 2 === 0
                        ? (sortedScores[midPoint - 1].score +
                              sortedScores[midPoint].score) /
                          2
                        : sortedScores[midPoint].score,
                completionRate:
                    (scores.filter((s) => s.completed).length / scores.length) *
                    100,
                averageTimeSpent: 0, // Not tracking time yet
                scoreDistribution: Array.from(distribution.entries()).map(
                    ([range, count]) => ({
                        range,
                        count,
                        percentage: (count / scores.length) * 100,
                    }),
                ),
                correctAnswerRate:
                    (scores.reduce((sum, s) => sum + s.correctAnswers, 0) /
                        scores.reduce((sum, s) => sum + s.totalAnswers, 0)) *
                    100,
                questionStats: Array.from(questionStats.entries()).map(
                    ([id, stats]) => ({
                        questionId: id,
                        text: stats.text,
                        correctAnswers: stats.correct,
                        totalAnswers: stats.total,
                        accuracyRate: (stats.correct / stats.total) * 100,
                    }),
                ),
            }
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }
}

export default function getApplicantAssessmentPool(
    prisma: PrismaClient,
    logger: Logger,
): ApplicantAssessmentPool {
    return new ApplicantAssessmentPoolImpl(prisma, logger)
}
