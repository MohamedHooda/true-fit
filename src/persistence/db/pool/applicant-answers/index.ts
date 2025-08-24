import { PrismaClient } from "@prisma/client"
import { handleDBError } from "helpers/serviceError"
import { Logger } from "types/logging"
import {
    ApplicantAnswer,
    ApplicantAnswerWithDetails,
    ApplicantAnswerCreate,
    ApplicantAnswerUpdate,
    QuestionAnswerStats,
    CommonAnswer,
} from "types/assessment"

export interface ApplicantAnswerPool {
    /**
     * Get an applicant answer by ID
     * @param {string} id - The ID of the answer to get
     * @returns {Promise<ApplicantAnswer | null>} - The applicant answer
     */
    getApplicantAnswerById(id: string): Promise<ApplicantAnswer | null>

    /**
     * Get an applicant answer with details
     * @param {string} id - The ID of the answer to get
     * @returns {Promise<ApplicantAnswerWithDetails | null>} - The answer with details
     */
    getApplicantAnswerWithDetails(
        id: string,
    ): Promise<ApplicantAnswerWithDetails | null>

    /**
     * Get answers by assessment ID
     * @param {string} assessmentId - The ID of the assessment
     * @returns {Promise<ApplicantAnswerWithDetails[]>} - The answers for the assessment
     */
    getApplicantAnswersByAssessmentId(
        assessmentId: string,
    ): Promise<ApplicantAnswerWithDetails[]>

    /**
     * Get answers by question ID
     * @param {string} questionId - The ID of the question
     * @returns {Promise<ApplicantAnswerWithDetails[]>} - The answers for the question
     */
    getApplicantAnswersByQuestionId(
        questionId: string,
    ): Promise<ApplicantAnswerWithDetails[]>

    /**
     * Create an applicant answer
     * @param {ApplicantAnswerCreate} answer - The answer to create
     * @returns {Promise<ApplicantAnswer>} - The created answer
     */
    createApplicantAnswer(
        answer: ApplicantAnswerCreate,
    ): Promise<ApplicantAnswer>

    /**
     * Create multiple applicant answers
     * @param {ApplicantAnswerCreate[]} answers - The answers to create
     * @returns {Promise<ApplicantAnswer[]>} - The created answers
     */
    createApplicantAnswers(
        answers: ApplicantAnswerCreate[],
    ): Promise<ApplicantAnswer[]>

    /**
     * Delete an applicant answer
     * @param {string} id - The ID of the answer to delete
     * @returns {Promise<void>}
     */
    deleteApplicantAnswer(id: string): Promise<void>

    /**
     * Update an applicant answer
     * @param {string} id - The ID of the answer to update
     * @param {ApplicantAnswerUpdate} answer - The answer data to update
     * @returns {Promise<ApplicantAnswer>} - The updated answer
     */
    updateApplicantAnswer(
        id: string,
        answer: ApplicantAnswerUpdate,
    ): Promise<ApplicantAnswer>

    /**
     * Get answer statistics for a question
     * @param {string} questionId - The question ID
     * @returns {Promise<QuestionAnswerStats>}
     */
    getQuestionAnswerStats(questionId: string): Promise<QuestionAnswerStats>

    /**
     * Get most common answers for a question
     * @param {string} questionId - The question ID
     * @param {number} limit - Maximum number of answers to return
     * @returns {Promise<Array<{answer: string, count: number}>>}
     */
    getMostCommonAnswers(
        questionId: string,
        limit?: number,
    ): Promise<CommonAnswer[]>

    /**
     * Check answer correctness against question
     * @param {string} questionId - The question ID
     * @param {string} answer - The answer to check
     * @returns {Promise<boolean>} - Whether the answer is correct
     */
    checkAnswerCorrectness(questionId: string, answer: string): Promise<boolean>

    /**
     * Bulk update answer correctness for a question
     * @param {string} questionId - The question ID
     * @param {string} correctAnswer - The correct answer
     * @returns {Promise<number>} - Number of answers updated
     */
    bulkUpdateAnswerCorrectness(
        questionId: string,
        correctAnswer: string,
    ): Promise<number>
}

class ApplicantAnswerPoolImpl implements ApplicantAnswerPool {
    constructor(
        private readonly prisma: PrismaClient,
        private readonly logger: Logger,
    ) {}

    async getApplicantAnswerById(id: string): Promise<ApplicantAnswer | null> {
        try {
            return this.prisma.applicantAnswer.findUnique({
                where: { id },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getApplicantAnswerWithDetails(
        id: string,
    ): Promise<ApplicantAnswerWithDetails | null> {
        try {
            const answer = await this.prisma.applicantAnswer.findUnique({
                where: { id },
                include: {
                    assessment: {
                        include: {
                            applicant: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                            template: {
                                include: {
                                    job: {
                                        select: {
                                            id: true,
                                            title: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    question: {
                        select: {
                            id: true,
                            text: true,
                            type: true,
                            weight: true,
                            correctAnswer: true,
                            negativeWeight: true,
                        },
                    },
                },
            })

            return answer
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getApplicantAnswersByAssessmentId(
        assessmentId: string,
    ): Promise<ApplicantAnswerWithDetails[]> {
        try {
            return this.prisma.applicantAnswer.findMany({
                where: { assessmentId },
                include: {
                    assessment: {
                        include: {
                            applicant: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                            template: {
                                include: {
                                    job: {
                                        select: {
                                            id: true,
                                            title: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    question: {
                        select: {
                            id: true,
                            text: true,
                            type: true,
                            weight: true,
                            correctAnswer: true,
                            negativeWeight: true,
                        },
                    },
                },
                orderBy: { question: { order: "asc" } },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getApplicantAnswersByQuestionId(
        questionId: string,
    ): Promise<ApplicantAnswerWithDetails[]> {
        try {
            return this.prisma.applicantAnswer.findMany({
                where: { questionId },
                include: {
                    assessment: {
                        include: {
                            applicant: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                            template: {
                                include: {
                                    job: {
                                        select: {
                                            id: true,
                                            title: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    question: {
                        select: {
                            id: true,
                            text: true,
                            type: true,
                            weight: true,
                            correctAnswer: true,
                            negativeWeight: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async createApplicantAnswer(
        answer: ApplicantAnswerCreate,
    ): Promise<ApplicantAnswer> {
        try {
            // If isCorrect is not provided, check against the question's correct answer
            if (answer.isCorrect === undefined && answer.answer) {
                const question =
                    await this.prisma.assessmentQuestion.findUnique({
                        where: { id: answer.questionId },
                        select: { correctAnswer: true },
                    })

                if (question?.correctAnswer) {
                    answer.isCorrect = answer.answer === question.correctAnswer
                }
            }

            return this.prisma.applicantAnswer.create({
                data: answer,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async createApplicantAnswers(
        answers: ApplicantAnswerCreate[],
    ): Promise<ApplicantAnswer[]> {
        try {
            // Use transaction to create multiple answers
            const result = await this.prisma.$transaction(async (tx) => {
                const createdAnswers: ApplicantAnswer[] = []

                for (const answer of answers) {
                    // If isCorrect is not provided, check against the question's correct answer
                    if (answer.isCorrect === undefined && answer.answer) {
                        const question = await tx.assessmentQuestion.findUnique(
                            {
                                where: { id: answer.questionId },
                                select: { correctAnswer: true },
                            },
                        )

                        if (question?.correctAnswer) {
                            answer.isCorrect =
                                answer.answer === question.correctAnswer
                        }
                    }

                    const created = await tx.applicantAnswer.create({
                        data: answer,
                    })

                    createdAnswers.push(created)
                }

                return createdAnswers
            })

            return result
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async deleteApplicantAnswer(id: string): Promise<void> {
        try {
            await this.prisma.applicantAnswer.delete({
                where: { id },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async updateApplicantAnswer(
        id: string,
        answer: ApplicantAnswerUpdate,
    ): Promise<ApplicantAnswer> {
        try {
            // If updating the answer but not the correctness, recalculate correctness
            if (answer.answer && answer.isCorrect === undefined) {
                const existingAnswer =
                    await this.prisma.applicantAnswer.findUnique({
                        where: { id },
                        include: {
                            question: {
                                select: { correctAnswer: true },
                            },
                        },
                    })

                if (existingAnswer?.question.correctAnswer) {
                    answer.isCorrect =
                        answer.answer === existingAnswer.question.correctAnswer
                }
            }

            return this.prisma.applicantAnswer.update({
                where: { id },
                data: answer,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getQuestionAnswerStats(
        questionId: string,
    ): Promise<QuestionAnswerStats> {
        try {
            const [total, correct] = await Promise.all([
                this.prisma.applicantAnswer.count({
                    where: { questionId },
                }),
                this.prisma.applicantAnswer.count({
                    where: { questionId, isCorrect: true },
                }),
            ])

            const incorrect = total - correct
            const accuracy = total > 0 ? (correct / total) * 100 : 0

            return { total, correct, incorrect, accuracy }
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getMostCommonAnswers(
        questionId: string,
        limit: number = 10,
    ): Promise<CommonAnswer[]> {
        try {
            const result = await this.prisma.applicantAnswer.groupBy({
                by: ["answer"],
                where: {
                    questionId,
                    answer: { not: null },
                },
                _count: {
                    answer: true,
                },
                orderBy: {
                    _count: {
                        answer: "desc",
                    },
                },
                take: limit,
            })

            return result.map((item) => ({
                answer: item.answer || "",
                count: item._count.answer,
            }))
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async checkAnswerCorrectness(
        questionId: string,
        answer: string,
    ): Promise<boolean> {
        try {
            const question = await this.prisma.assessmentQuestion.findUnique({
                where: { id: questionId },
                select: { correctAnswer: true },
            })

            return question?.correctAnswer === answer || false
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async bulkUpdateAnswerCorrectness(
        questionId: string,
        correctAnswer: string,
    ): Promise<number> {
        try {
            // Update all answers for this question to set isCorrect based on the new correct answer
            const [correctUpdate, incorrectUpdate] = await Promise.all([
                this.prisma.applicantAnswer.updateMany({
                    where: {
                        questionId,
                        answer: correctAnswer,
                    },
                    data: {
                        isCorrect: true,
                    },
                }),
                this.prisma.applicantAnswer.updateMany({
                    where: {
                        questionId,
                        answer: { not: correctAnswer },
                    },
                    data: {
                        isCorrect: false,
                    },
                }),
            ])

            return correctUpdate.count + incorrectUpdate.count
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }
}

export default function getApplicantAnswerPool(
    prisma: PrismaClient,
    logger: Logger,
): ApplicantAnswerPool {
    return new ApplicantAnswerPoolImpl(prisma, logger)
}
