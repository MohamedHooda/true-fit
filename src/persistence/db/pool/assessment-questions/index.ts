import { PrismaClient } from "@prisma/client"
import { handleDBError } from "helpers/serviceError"
import { Logger } from "types/logging"
import {
    AssessmentQuestion,
    AssessmentQuestionWithDetails,
    AssessmentQuestionCreate,
    AssessmentQuestionUpdate,
    AnswerDistribution,
} from "types/assessment"

export interface AssessmentQuestionPool {
    /**
     * Get an assessment question by ID
     * @param {string} id - The ID of the question to get
     * @returns {Promise<AssessmentQuestion | null>} - The assessment question
     */
    getAssessmentQuestionById(id: string): Promise<AssessmentQuestion | null>

    /**
     * Get an assessment question with details
     * @param {string} id - The ID of the question to get
     * @returns {Promise<AssessmentQuestionWithDetails | null>} - The question with details
     */
    getAssessmentQuestionWithDetails(
        id: string,
    ): Promise<AssessmentQuestionWithDetails | null>

    /**
     * Get assessment questions by template ID
     * @param {string} templateId - The ID of the template
     * @returns {Promise<AssessmentQuestion[]>} - The questions for the template
     */
    getAssessmentQuestionsByTemplateId(
        templateId: string,
    ): Promise<AssessmentQuestion[]>

    /**
     * Create an assessment question
     * @param {AssessmentQuestionCreate} question - The question to create
     * @returns {Promise<AssessmentQuestion>} - The created question
     */
    createAssessmentQuestion(
        question: AssessmentQuestionCreate,
    ): Promise<AssessmentQuestion>

    /**
     * Create multiple assessment questions
     * @param {AssessmentQuestionCreate[]} questions - The questions to create
     * @returns {Promise<AssessmentQuestion[]>} - The created questions
     */
    createAssessmentQuestions(
        questions: AssessmentQuestionCreate[],
    ): Promise<AssessmentQuestion[]>

    /**
     * Delete an assessment question
     * @param {string} id - The ID of the question to delete
     * @returns {Promise<void>}
     */
    deleteAssessmentQuestion(id: string): Promise<void>

    /**
     * Update an assessment question
     * @param {string} id - The ID of the question to update
     * @param {AssessmentQuestionUpdate} question - The question data to update
     * @returns {Promise<AssessmentQuestion>} - The updated question
     */
    updateAssessmentQuestion(
        id: string,
        question: AssessmentQuestionUpdate,
    ): Promise<AssessmentQuestion>

    /**
     * Reorder questions within a template
     * @param {string} templateId - The template ID
     * @param {Array<{id: string, order: number}>} questionOrders - Array of question IDs and their new orders
     * @returns {Promise<void>}
     */
    reorderQuestions(
        templateId: string,
        questionOrders: Array<{ id: string; order: number }>,
    ): Promise<void>

    /**
     * Get the next order number for a template
     * @param {string} templateId - The template ID
     * @returns {Promise<number>} - The next order number
     */
    getNextOrderForTemplate(templateId: string): Promise<number>

    /**
     * Check if a question order exists in template
     * @param {string} templateId - The template ID
     * @param {number} order - The order to check
     * @param {string} excludeId - Optional question ID to exclude from check
     * @returns {Promise<boolean>} - Whether the order exists
     */
    questionOrderExistsInTemplate(
        templateId: string,
        order: number,
        excludeId?: string,
    ): Promise<boolean>

    /**
     * Get answer distribution for an assessment question
     * @param {string} id - The ID of the question
     * @returns {Promise<AnswerDistribution>} - The answer distribution
     */
    getAnswerDistribution(id: string): Promise<AnswerDistribution>
}

class AssessmentQuestionPoolImpl implements AssessmentQuestionPool {
    constructor(
        private readonly prisma: PrismaClient,
        private readonly logger: Logger,
    ) {}

    async getAssessmentQuestionById(
        id: string,
    ): Promise<AssessmentQuestion | null> {
        try {
            return this.prisma.assessmentQuestion.findUnique({
                where: { id },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getAssessmentQuestionWithDetails(
        id: string,
    ): Promise<AssessmentQuestionWithDetails | null> {
        try {
            const question = await this.prisma.assessmentQuestion.findUnique({
                where: { id },
                include: {
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
                        select: {
                            id: true,
                            answer: true,
                            isCorrect: true,
                            assessment: {
                                select: {
                                    id: true,
                                    applicant: {
                                        select: {
                                            id: true,
                                            firstName: true,
                                            lastName: true,
                                            email: true,
                                        },
                                    },
                                },
                            },
                        },
                        orderBy: { createdAt: "desc" },
                    },
                },
            })

            return question
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getAssessmentQuestionsByTemplateId(
        templateId: string,
    ): Promise<AssessmentQuestion[]> {
        try {
            return this.prisma.assessmentQuestion.findMany({
                where: { templateId },
                orderBy: { order: "asc" },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async createAssessmentQuestion(
        question: AssessmentQuestionCreate,
    ): Promise<AssessmentQuestion> {
        try {
            // If no order is specified, get the next available order
            if (question.order === undefined) {
                const nextOrder = await this.getNextOrderForTemplate(
                    question.templateId,
                )
                question.order = nextOrder
            }

            return this.prisma.assessmentQuestion.create({
                data: question,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async createAssessmentQuestions(
        questions: AssessmentQuestionCreate[],
    ): Promise<AssessmentQuestion[]> {
        try {
            // Use transaction to create multiple questions
            const result = await this.prisma.$transaction(async (tx) => {
                const createdQuestions: AssessmentQuestion[] = []

                for (const question of questions) {
                    // If no order is specified, get the next available order
                    if (question.order === undefined) {
                        const existingCount = await tx.assessmentQuestion.count(
                            {
                                where: { templateId: question.templateId },
                            },
                        )
                        question.order = existingCount
                    }

                    const created = await tx.assessmentQuestion.create({
                        data: question,
                    })

                    createdQuestions.push(created)
                }

                return createdQuestions
            })

            return result
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async deleteAssessmentQuestion(id: string): Promise<void> {
        try {
            await this.prisma.assessmentQuestion.delete({
                where: { id },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async updateAssessmentQuestion(
        id: string,
        question: AssessmentQuestionUpdate,
    ): Promise<AssessmentQuestion> {
        try {
            return this.prisma.assessmentQuestion.update({
                where: { id },
                data: question,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async reorderQuestions(
        templateId: string,
        questionOrders: Array<{ id: string; order: number }>,
    ): Promise<void> {
        try {
            // Use transaction to update all question orders
            await this.prisma.$transaction(async (tx) => {
                for (const { id, order } of questionOrders) {
                    await tx.assessmentQuestion.update({
                        where: { id },
                        data: { order },
                    })
                }
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getNextOrderForTemplate(templateId: string): Promise<number> {
        try {
            const maxOrder = await this.prisma.assessmentQuestion.findFirst({
                where: { templateId },
                select: { order: true },
                orderBy: { order: "desc" },
            })

            return (maxOrder?.order ?? -1) + 1
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async questionOrderExistsInTemplate(
        templateId: string,
        order: number,
        excludeId?: string,
    ): Promise<boolean> {
        try {
            const existing = await this.prisma.assessmentQuestion.findFirst({
                where: {
                    templateId,
                    order,
                    ...(excludeId && { id: { not: excludeId } }),
                },
            })

            return !!existing
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getAnswerDistribution(id: string): Promise<AnswerDistribution> {
        try {
            // Get all answers for this question
            const answers = await this.prisma.applicantAnswer.findMany({
                where: { questionId: id },
                select: {
                    answer: true,
                    isCorrect: true,
                },
            })

            const totalResponses = answers.length
            if (totalResponses === 0) {
                return {
                    questionId: id,
                    totalResponses: 0,
                    distribution: [],
                    commonMistakes: [],
                }
            }

            // Group answers by their value
            const answerCounts = new Map<
                string | null,
                { count: number; isCorrect: boolean }
            >()

            for (const answer of answers) {
                const key = answer.answer
                const existing = answerCounts.get(key) || {
                    count: 0,
                    isCorrect: answer.isCorrect,
                }
                answerCounts.set(key, {
                    count: existing.count + 1,
                    isCorrect: answer.isCorrect,
                })
            }

            // Create distribution array
            const distribution = Array.from(answerCounts.entries())
                .map(([answer, data]) => ({
                    answer,
                    count: data.count,
                    percentage:
                        Math.round((data.count / totalResponses) * 100 * 100) /
                        100,
                    isCorrect: data.isCorrect,
                }))
                .sort((a, b) => b.count - a.count)

            // Get common mistakes (incorrect answers sorted by frequency)
            const commonMistakes = distribution
                .filter((item) => !item.isCorrect)
                .slice(0, 5) // Top 5 mistakes
                .map((item) => ({
                    answer: item.answer,
                    count: item.count,
                    percentage: item.percentage,
                }))

            return {
                questionId: id,
                totalResponses,
                distribution,
                commonMistakes,
            }
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }
}

export default function getAssessmentQuestionPool(
    prisma: PrismaClient,
    logger: Logger,
): AssessmentQuestionPool {
    return new AssessmentQuestionPoolImpl(prisma, logger)
}
