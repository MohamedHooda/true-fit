import { PrismaClient } from "@prisma/client"
import { handleDBError } from "helpers/serviceError"
import { Logger } from "types/logging"
import {
    ApplicantAssessment,
    ApplicantAssessmentWithDetails,
    ApplicantAssessmentCreate,
    AssessmentSubmission,
    ApplicantAssessmentFilters,
    AssessmentScore,
    AssessmentStats,
} from "types/assessment"

export interface ApplicantAssessmentPool {
    /**
     * Get an applicant assessment by ID
     * @param {string} id - The ID of the assessment to get
     * @returns {Promise<ApplicantAssessment | null>} - The applicant assessment
     */
    getApplicantAssessmentById(id: string): Promise<ApplicantAssessment | null>

    /**
     * Get an applicant assessment with full details
     * @param {string} id - The ID of the assessment to get
     * @returns {Promise<ApplicantAssessmentWithDetails | null>} - The assessment with details
     */
    getApplicantAssessmentWithDetails(
        id: string,
    ): Promise<ApplicantAssessmentWithDetails | null>

    /**
     * Get assessments by applicant ID
     * @param {string} applicantId - The ID of the applicant
     * @returns {Promise<ApplicantAssessmentWithDetails[]>} - The assessments for the applicant
     */
    getApplicantAssessmentsByApplicantId(
        applicantId: string,
    ): Promise<ApplicantAssessmentWithDetails[]>

    /**
     * Get assessments by template ID
     * @param {string} templateId - The ID of the template
     * @returns {Promise<ApplicantAssessmentWithDetails[]>} - The assessments for the template
     */
    getApplicantAssessmentsByTemplateId(
        templateId: string,
    ): Promise<ApplicantAssessmentWithDetails[]>

    /**
     * Get assessments by company ID
     * @param {string} companyId - The ID of the company
     * @returns {Promise<ApplicantAssessmentWithDetails[]>} - The assessments for the company
     */
    getApplicantAssessmentsByCompanyId(
        companyId: string,
    ): Promise<ApplicantAssessmentWithDetails[]>

    /**
     * Create an applicant assessment
     * @param {ApplicantAssessmentCreate} assessment - The assessment to create
     * @returns {Promise<ApplicantAssessment>} - The created assessment
     */
    createApplicantAssessment(
        assessment: ApplicantAssessmentCreate,
    ): Promise<ApplicantAssessment>

    /**
     * Submit a complete assessment with answers
     * @param {AssessmentSubmission} submission - The assessment submission
     * @returns {Promise<ApplicantAssessmentWithDetails>} - The created assessment with details
     */
    submitAssessment(
        submission: AssessmentSubmission,
    ): Promise<ApplicantAssessmentWithDetails>

    /**
     * Delete an applicant assessment
     * @param {string} id - The ID of the assessment to delete
     * @returns {Promise<void>}
     */
    deleteApplicantAssessment(id: string): Promise<void>

    /**
     * Get all applicant assessments with filtering
     * @param {ApplicantAssessmentFilters} filters - Filters to apply
     * @param {number} limit - Maximum number of assessments to return
     * @param {number} offset - Number of assessments to skip
     * @returns {Promise<ApplicantAssessmentWithDetails[]>} - The assessments with details
     */
    getApplicantAssessments(
        filters?: ApplicantAssessmentFilters,
        limit?: number,
        offset?: number,
    ): Promise<ApplicantAssessmentWithDetails[]>

    /**
     * Check if an applicant has completed a template
     * @param {string} applicantId - The applicant ID
     * @param {string} templateId - The template ID
     * @returns {Promise<boolean>} - Whether the applicant has completed the template
     */
    hasApplicantCompletedTemplate(
        applicantId: string,
        templateId: string,
    ): Promise<boolean>

    /**
     * Calculate assessment score
     * @param {string} id - The assessment ID
     * @returns {Promise<AssessmentScore>} - The calculated score
     */
    calculateAssessmentScore(id: string): Promise<AssessmentScore>

    /**
     * Get assessment statistics
     * @param {string} companyId - Optional company ID to filter by
     * @returns {Promise<AssessmentStats>}
     */
    getAssessmentStats(companyId?: string): Promise<AssessmentStats>
}

class ApplicantAssessmentPoolImpl implements ApplicantAssessmentPool {
    constructor(
        private readonly prisma: PrismaClient,
        private readonly logger: Logger,
    ) {}

    async getApplicantAssessmentById(
        id: string,
    ): Promise<ApplicantAssessment | null> {
        try {
            return this.prisma.applicantAssessment.findUnique({
                where: { id },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getApplicantAssessmentWithDetails(
        id: string,
    ): Promise<ApplicantAssessmentWithDetails | null> {
        try {
            const assessment = await this.prisma.applicantAssessment.findUnique(
                {
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
                            orderBy: { question: { order: "asc" } },
                        },
                    },
                },
            )

            return assessment
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getApplicantAssessmentsByApplicantId(
        applicantId: string,
    ): Promise<ApplicantAssessmentWithDetails[]> {
        try {
            return this.prisma.applicantAssessment.findMany({
                where: { applicantId },
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
                        orderBy: { question: { order: "asc" } },
                    },
                },
                orderBy: { submittedAt: "desc" },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getApplicantAssessmentsByTemplateId(
        templateId: string,
    ): Promise<ApplicantAssessmentWithDetails[]> {
        try {
            return this.prisma.applicantAssessment.findMany({
                where: { templateId },
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
                        orderBy: { question: { order: "asc" } },
                    },
                },
                orderBy: { submittedAt: "desc" },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getApplicantAssessmentsByCompanyId(
        companyId: string,
    ): Promise<ApplicantAssessmentWithDetails[]> {
        try {
            return this.prisma.applicantAssessment.findMany({
                where: {
                    template: {
                        job: {
                            branch: {
                                companyId,
                            },
                        },
                    },
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
                        orderBy: { question: { order: "asc" } },
                    },
                },
                orderBy: { submittedAt: "desc" },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async createApplicantAssessment(
        assessment: ApplicantAssessmentCreate,
    ): Promise<ApplicantAssessment> {
        try {
            return this.prisma.applicantAssessment.create({
                data: assessment,
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
                // Create the assessment
                const assessment = await tx.applicantAssessment.create({
                    data: {
                        applicantId: submission.applicantId,
                        templateId: submission.templateId,
                        submittedAt: new Date(),
                    },
                })

                // Get template questions to validate answers
                const questions = await tx.assessmentQuestion.findMany({
                    where: { templateId: submission.templateId },
                })

                const questionMap = new Map(questions.map((q) => [q.id, q]))

                // Create answers and check correctness
                for (const answerData of submission.answers) {
                    const question = questionMap.get(answerData.questionId)
                    if (!question) continue

                    const isCorrect = question.correctAnswer
                        ? answerData.answer === question.correctAnswer
                        : false

                    await tx.applicantAnswer.create({
                        data: {
                            assessmentId: assessment.id,
                            questionId: answerData.questionId,
                            answer: answerData.answer,
                            isCorrect,
                        },
                    })
                }

                // Return the assessment with details
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
                            orderBy: { question: { order: "asc" } },
                        },
                    },
                })
            })

            return result!
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async deleteApplicantAssessment(id: string): Promise<void> {
        try {
            await this.prisma.applicantAssessment.delete({
                where: { id },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getApplicantAssessments(
        filters: ApplicantAssessmentFilters = {},
        limit: number = 50,
        offset: number = 0,
    ): Promise<ApplicantAssessmentWithDetails[]> {
        try {
            const where: any = {}

            if (filters.applicantId) {
                where.applicantId = filters.applicantId
            }

            if (filters.templateId) {
                where.templateId = filters.templateId
            }

            if (filters.jobId) {
                where.template = {
                    jobId: filters.jobId,
                }
            }

            if (filters.companyId) {
                where.template = {
                    job: {
                        branch: {
                            companyId: filters.companyId,
                        },
                    },
                }
            }

            if (filters.dateFrom || filters.dateTo) {
                where.submittedAt = {}
                if (filters.dateFrom) {
                    where.submittedAt.gte = filters.dateFrom
                }
                if (filters.dateTo) {
                    where.submittedAt.lte = filters.dateTo
                }
            }

            return this.prisma.applicantAssessment.findMany({
                where,
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
                        orderBy: { question: { order: "asc" } },
                    },
                },
                orderBy: { submittedAt: "desc" },
                take: limit,
                skip: offset,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async hasApplicantCompletedTemplate(
        applicantId: string,
        templateId: string,
    ): Promise<boolean> {
        try {
            const existing = await this.prisma.applicantAssessment.findFirst({
                where: {
                    applicantId,
                    templateId,
                },
            })

            return !!existing
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async calculateAssessmentScore(id: string): Promise<AssessmentScore> {
        try {
            const assessment = await this.prisma.applicantAssessment.findUnique(
                {
                    where: { id },
                    include: {
                        answers: {
                            include: {
                                question: {
                                    select: {
                                        weight: true,
                                    },
                                },
                            },
                        },
                    },
                },
            )

            if (!assessment) {
                throw new Error("Assessment not found")
            }

            let score = 0
            let maxScore = 0

            for (const answer of assessment.answers) {
                const weight = answer.question.weight
                maxScore += weight

                if (answer.isCorrect) {
                    score += weight
                }
            }

            const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0

            return { score, maxScore, percentage }
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getAssessmentStats(companyId?: string): Promise<AssessmentStats> {
        try {
            const where: any = {}

            if (companyId) {
                where.template = {
                    job: {
                        branch: {
                            companyId,
                        },
                    },
                }
            }

            const assessments = await this.prisma.applicantAssessment.findMany({
                where,
                include: {
                    answers: {
                        include: {
                            question: {
                                select: {
                                    weight: true,
                                },
                            },
                        },
                    },
                },
            })

            const total = assessments.length
            let totalPercentage = 0

            for (const assessment of assessments) {
                let score = 0
                let maxScore = 0

                for (const answer of assessment.answers) {
                    const weight = answer.question.weight
                    maxScore += weight

                    if (answer.isCorrect) {
                        score += weight
                    }
                }

                const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0
                totalPercentage += percentage
            }

            const averageScore = total > 0 ? totalPercentage / total : 0
            const completionRate = 100 // All retrieved assessments are completed

            return { total, averageScore, completionRate }
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
