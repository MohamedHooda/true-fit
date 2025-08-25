import { PrismaClient } from "@prisma/client"
import { handleDBError } from "helpers/serviceError"
import { Logger } from "types/logging"
import {
    AssessmentTemplate,
    AssessmentTemplateWithDetails,
    AssessmentTemplateCreate,
    AssessmentTemplateUpdate,
    AssessmentTemplateFilters,
    AssessmentTemplateStats,
} from "types/assessment"

export interface AssessmentTemplatePool {
    /**
     * Get an assessment template by ID
     * @param {string} id - The ID of the template to get
     * @returns {Promise<AssessmentTemplate | null>} - The assessment template
     */
    getAssessmentTemplateById(id: string): Promise<AssessmentTemplate | null>

    /**
     * Get an assessment template with full details
     * @param {string} id - The ID of the template to get
     * @returns {Promise<AssessmentTemplateWithDetails | null>} - The template with details
     */
    getAssessmentTemplateWithDetails(
        id: string,
    ): Promise<AssessmentTemplateWithDetails | null>

    /**
     * Get assessment templates by job ID
     * @param {string} jobId - The ID of the job
     * @returns {Promise<AssessmentTemplate[]>} - The templates for the job
     */
    getAssessmentTemplatesByJobId(jobId: string): Promise<AssessmentTemplate[]>

    /**
     * Get assessment templates by company ID
     * @param {string} companyId - The ID of the company
     * @returns {Promise<AssessmentTemplateWithDetails[]>} - The templates for the company
     */
    getAssessmentTemplatesByCompanyId(
        companyId: string,
    ): Promise<AssessmentTemplateWithDetails[]>

    /**
     * Create an assessment template
     * @param {AssessmentTemplateCreate} template - The template to create
     * @returns {Promise<AssessmentTemplate>} - The created template
     */
    createAssessmentTemplate(
        template: AssessmentTemplateCreate,
    ): Promise<AssessmentTemplate>

    /**
     * Delete an assessment template
     * @param {string} id - The ID of the template to delete
     * @returns {Promise<void>}
     */
    deleteAssessmentTemplate(id: string): Promise<void>

    /**
     * Get all assessment templates with filtering
     * @param {AssessmentTemplateFilters} filters - Filters to apply
     * @param {number} limit - Maximum number of templates to return
     * @param {number} offset - Number of templates to skip
     * @returns {Promise<AssessmentTemplateWithDetails[]>} - The templates with details
     */
    getAssessmentTemplates(
        filters?: AssessmentTemplateFilters,
        limit?: number,
        offset?: number,
    ): Promise<AssessmentTemplateWithDetails[]>

    /**
     * Update an assessment template
     * @param {string} id - The ID of the template to update
     * @param {AssessmentTemplateUpdate} template - The template data to update
     * @returns {Promise<AssessmentTemplate>} - The updated template
     */
    updateAssessmentTemplate(
        id: string,
        template: AssessmentTemplateUpdate,
    ): Promise<AssessmentTemplate>

    /**
     * Check if a template name exists for a job
     * @param {string} jobId - The job ID (null for global templates)
     * @param {string} name - The template name
     * @param {string} excludeId - Optional template ID to exclude from check (for updates)
     * @returns {Promise<boolean>} - Whether the template name exists
     */
    templateNameExistsForJob(
        jobId: string | null,
        name: string,
        excludeId?: string,
    ): Promise<boolean>

    /**
     * Duplicate an assessment template
     * @param {string} id - The ID of the template to duplicate
     * @param {string} newName - The name for the new template
     * @param {string} newJobId - Optional new job ID for the duplicated template
     * @returns {Promise<AssessmentTemplate>} - The duplicated template
     */
    duplicateAssessmentTemplate(
        id: string,
        newName: string,
        newJobId?: string,
    ): Promise<AssessmentTemplate>

    /**
     * Get assessment template statistics
     * @param {string} companyId - Optional company ID to filter by
     * @returns {Promise<AssessmentTemplateStats>}
     */
    getAssessmentTemplateStats(
        companyId?: string,
    ): Promise<AssessmentTemplateStats>
}

class AssessmentTemplatePoolImpl implements AssessmentTemplatePool {
    constructor(
        private readonly prisma: PrismaClient,
        private readonly logger: Logger,
    ) {}

    async getAssessmentTemplateById(
        id: string,
    ): Promise<AssessmentTemplate | null> {
        try {
            return this.prisma.assessmentTemplate.findUnique({
                where: { id },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getAssessmentTemplateWithDetails(
        id: string,
    ): Promise<AssessmentTemplateWithDetails | null> {
        try {
            const template = await this.prisma.assessmentTemplate.findUnique({
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
                    questions: {
                        select: {
                            id: true,
                            text: true,
                            type: true,
                            weight: true,
                            order: true,
                            correctAnswer: true,
                            negativeWeight: true,
                        },
                        orderBy: { order: "asc" },
                    },
                    assessments: {
                        select: {
                            id: true,
                            submittedAt: true,
                            applicant: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                        },
                        orderBy: { submittedAt: "desc" },
                    },
                },
            })

            return template
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getAssessmentTemplatesByJobId(
        jobId: string,
    ): Promise<AssessmentTemplate[]> {
        try {
            return this.prisma.assessmentTemplate.findMany({
                where: { jobId },
                orderBy: { createdAt: "desc" },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getAssessmentTemplatesByCompanyId(
        companyId: string,
    ): Promise<AssessmentTemplateWithDetails[]> {
        try {
            return this.prisma.assessmentTemplate.findMany({
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
                    questions: {
                        select: {
                            id: true,
                            text: true,
                            type: true,
                            weight: true,
                            order: true,
                            correctAnswer: true,
                            negativeWeight: true,
                        },
                        orderBy: { order: "asc" },
                    },
                    assessments: {
                        select: {
                            id: true,
                            submittedAt: true,
                            applicant: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                        },
                        orderBy: { submittedAt: "desc" },
                        take: 5, // Limit recent assessments
                    },
                },
                orderBy: { createdAt: "desc" },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async createAssessmentTemplate(
        template: AssessmentTemplateCreate,
    ): Promise<AssessmentTemplate> {
        try {
            return this.prisma.assessmentTemplate.create({
                data: template,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async deleteAssessmentTemplate(id: string): Promise<void> {
        try {
            await this.prisma.assessmentTemplate.delete({
                where: { id },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getAssessmentTemplates(
        filters: AssessmentTemplateFilters = {},
        limit: number = 50,
        offset: number = 0,
    ): Promise<AssessmentTemplateWithDetails[]> {
        try {
            const where: any = {}

            if (filters.jobId) {
                where.jobId = filters.jobId
            }

            if (filters.search) {
                where.OR = [
                    { name: { contains: filters.search, mode: "insensitive" } },
                    {
                        description: {
                            contains: filters.search,
                            mode: "insensitive",
                        },
                    },
                ]
            }

            if (filters.hasQuestions !== undefined) {
                if (filters.hasQuestions) {
                    where.questions = { some: {} }
                } else {
                    where.questions = { none: {} }
                }
            }

            if (filters.hasAssessments !== undefined) {
                if (filters.hasAssessments) {
                    where.assessments = { some: {} }
                } else {
                    where.assessments = { none: {} }
                }
            }

            return this.prisma.assessmentTemplate.findMany({
                where,
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
                    questions: {
                        select: {
                            id: true,
                            text: true,
                            type: true,
                            weight: true,
                            order: true,
                            correctAnswer: true,
                            negativeWeight: true,
                        },
                        orderBy: { order: "asc" },
                    },
                    assessments: {
                        select: {
                            id: true,
                            submittedAt: true,
                            applicant: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                        },
                        orderBy: { submittedAt: "desc" },
                        take: 5,
                    },
                },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: offset,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async updateAssessmentTemplate(
        id: string,
        template: AssessmentTemplateUpdate,
    ): Promise<AssessmentTemplate> {
        try {
            return this.prisma.assessmentTemplate.update({
                where: { id },
                data: template,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async templateNameExistsForJob(
        jobId: string | null,
        name: string,
        excludeId?: string,
    ): Promise<boolean> {
        try {
            const existing = await this.prisma.assessmentTemplate.findFirst({
                where: {
                    jobId,
                    name,
                    ...(excludeId && { id: { not: excludeId } }),
                },
            })

            return !!existing
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async duplicateAssessmentTemplate(
        id: string,
        newName: string,
        newJobId?: string,
    ): Promise<AssessmentTemplate> {
        try {
            // Use transaction to copy template and its questions
            const result = await this.prisma.$transaction(async (tx) => {
                // Get the original template with questions
                const originalTemplate = await tx.assessmentTemplate.findUnique(
                    {
                        where: { id },
                        include: {
                            questions: true,
                        },
                    },
                )

                if (!originalTemplate) {
                    throw new Error("Template not found")
                }

                // Create the new template
                const newTemplate = await tx.assessmentTemplate.create({
                    data: {
                        name: newName,
                        description: originalTemplate.description,
                        jobId: newJobId || originalTemplate.jobId,
                    },
                })

                // Copy all questions
                if (originalTemplate.questions.length > 0) {
                    await tx.assessmentQuestion.createMany({
                        data: originalTemplate.questions.map((question) => ({
                            templateId: newTemplate.id,
                            text: question.text,
                            type: question.type,
                            weight: question.weight,
                            order: question.order,
                            correctAnswer: question.correctAnswer,
                            negativeWeight: question.negativeWeight,
                        })),
                    })
                }

                return newTemplate
            })

            return result
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getAssessmentTemplateStats(
        companyId?: string,
    ): Promise<AssessmentTemplateStats> {
        try {
            const where: any = {}

            if (companyId) {
                where.job = {
                    branch: {
                        companyId,
                    },
                }
            }

            const [total, withQuestions, withAssessments] = await Promise.all([
                this.prisma.assessmentTemplate.count({ where }),
                this.prisma.assessmentTemplate.count({
                    where: {
                        ...where,
                        questions: { some: {} },
                    },
                }),
                this.prisma.assessmentTemplate.count({
                    where: {
                        ...where,
                        assessments: { some: {} },
                    },
                }),
            ])

            return { total, withQuestions, withAssessments }
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }
}

export default function getAssessmentTemplatePool(
    prisma: PrismaClient,
    logger: Logger,
): AssessmentTemplatePool {
    return new AssessmentTemplatePoolImpl(prisma, logger)
}
