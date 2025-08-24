import { PrismaClient } from "@prisma/client"
import { handleDBError } from "helpers/serviceError"
import { Logger } from "types/logging"
import {
    Applicant,
    ApplicantWithAssessments,
    ApplicantCreate,
    ApplicantUpdate,
    ApplicantFilters,
    ApplicantStats,
} from "types/applicant"

export interface ApplicantPool {
    /**
     * Get an applicant by ID
     * @param {string} id - The ID of the applicant to get
     * @returns {Promise<Applicant | null>} - The applicant
     */
    getApplicantById(id: string): Promise<Applicant | null>

    /**
     * Get an applicant with full details (assessments, applications)
     * @param {string} id - The ID of the applicant to get
     * @returns {Promise<ApplicantWithAssessments | null>} - The applicant with details
     */
    getApplicantWithDetails(
        id: string,
    ): Promise<ApplicantWithAssessments | null>

    /**
     * Get an applicant by email
     * @param {string} email - The email of the applicant to get
     * @returns {Promise<Applicant | null>} - The applicant
     */
    getApplicantByEmail(email: string): Promise<Applicant | null>

    /**
     * Create an applicant
     * @param {ApplicantCreate} applicant - The applicant to create
     * @returns {Promise<Applicant>} - The created applicant
     */
    createApplicant(applicant: ApplicantCreate): Promise<Applicant>

    /**
     * Delete an applicant
     * @param {string} id - The ID of the applicant to delete
     * @returns {Promise<void>}
     */
    deleteApplicant(id: string): Promise<void>

    /**
     * Get all applicants with filtering and search
     * @param {ApplicantFilters} filters - Filters to apply
     * @param {number} limit - Maximum number of applicants to return
     * @param {number} offset - Number of applicants to skip
     * @returns {Promise<Applicant[]>} - The applicants
     */
    getApplicants(
        filters?: ApplicantFilters,
        limit?: number,
        offset?: number,
    ): Promise<Applicant[]>

    /**
     * Update an applicant
     * @param {string} id - The ID of the applicant to update
     * @param {ApplicantUpdate} applicant - The applicant data to update
     * @returns {Promise<Applicant>} - The updated applicant
     */
    updateApplicant(id: string, applicant: ApplicantUpdate): Promise<Applicant>

    /**
     * Search applicants by name, email, or location
     * @param {string} query - The search query
     * @param {number} limit - Maximum number of results
     * @returns {Promise<Applicant[]>} - The matching applicants
     */
    searchApplicants(query: string, limit?: number): Promise<Applicant[]>

    /**
     * Get applicants who applied to jobs at a specific company
     * @param {string} companyId - The company ID
     * @param {number} limit - Maximum number of applicants to return
     * @param {number} offset - Number of applicants to skip
     * @returns {Promise<ApplicantWithAssessments[]>} - The applicants with details
     */
    getApplicantsByCompany(
        companyId: string,
        limit?: number,
        offset?: number,
    ): Promise<ApplicantWithAssessments[]>

    /**
     * Get applicant statistics
     * @returns {Promise<ApplicantStats>}
     */
    getApplicantStats(): Promise<ApplicantStats>
}

class ApplicantPoolImpl implements ApplicantPool {
    constructor(
        private readonly prisma: PrismaClient,
        private readonly logger: Logger,
    ) {}

    async getApplicantById(id: string): Promise<Applicant | null> {
        try {
            return this.prisma.applicant.findUnique({
                where: { id },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getApplicantWithDetails(
        id: string,
    ): Promise<ApplicantWithAssessments | null> {
        try {
            const applicant = await this.prisma.applicant.findUnique({
                where: { id },
                include: {
                    assessments: {
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
                        },
                        orderBy: { submittedAt: "desc" },
                    },
                    jobApplications: {
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
                        orderBy: { appliedAt: "desc" },
                    },
                },
            })

            return applicant
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getApplicantByEmail(email: string): Promise<Applicant | null> {
        try {
            return this.prisma.applicant.findUnique({
                where: { email },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async createApplicant(applicant: ApplicantCreate): Promise<Applicant> {
        try {
            return this.prisma.applicant.create({
                data: applicant,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async deleteApplicant(id: string): Promise<void> {
        try {
            await this.prisma.applicant.delete({
                where: { id },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getApplicants(
        filters: ApplicantFilters = {},
        limit: number = 50,
        offset: number = 0,
    ): Promise<Applicant[]> {
        try {
            const where: any = {}

            if (filters.search) {
                where.OR = [
                    {
                        firstName: {
                            contains: filters.search,
                            mode: "insensitive",
                        },
                    },
                    {
                        lastName: {
                            contains: filters.search,
                            mode: "insensitive",
                        },
                    },
                    {
                        email: {
                            contains: filters.search,
                            mode: "insensitive",
                        },
                    },
                ]
            }

            if (filters.city) {
                where.city = { contains: filters.city, mode: "insensitive" }
            }

            if (filters.country) {
                where.country = {
                    contains: filters.country,
                    mode: "insensitive",
                }
            }

            if (filters.hasAssessments !== undefined) {
                if (filters.hasAssessments) {
                    where.assessments = { some: {} }
                } else {
                    where.assessments = { none: {} }
                }
            }

            if (filters.hasApplications !== undefined) {
                if (filters.hasApplications) {
                    where.jobApplications = { some: {} }
                } else {
                    where.jobApplications = { none: {} }
                }
            }

            return this.prisma.applicant.findMany({
                where,
                orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
                take: limit,
                skip: offset,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async updateApplicant(
        id: string,
        applicant: ApplicantUpdate,
    ): Promise<Applicant> {
        try {
            return this.prisma.applicant.update({
                where: { id },
                data: applicant,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async searchApplicants(
        query: string,
        limit: number = 20,
    ): Promise<Applicant[]> {
        try {
            return this.prisma.applicant.findMany({
                where: {
                    OR: [
                        { firstName: { contains: query, mode: "insensitive" } },
                        { lastName: { contains: query, mode: "insensitive" } },
                        { email: { contains: query, mode: "insensitive" } },
                        { city: { contains: query, mode: "insensitive" } },
                        { country: { contains: query, mode: "insensitive" } },
                    ],
                },
                orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
                take: limit,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getApplicantsByCompany(
        companyId: string,
        limit: number = 50,
        offset: number = 0,
    ): Promise<ApplicantWithAssessments[]> {
        try {
            return this.prisma.applicant.findMany({
                where: {
                    OR: [
                        {
                            jobApplications: {
                                some: {
                                    job: {
                                        branch: {
                                            companyId,
                                        },
                                    },
                                },
                            },
                        },
                        {
                            assessments: {
                                some: {
                                    template: {
                                        job: {
                                            branch: {
                                                companyId,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    ],
                },
                include: {
                    assessments: {
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
                        },
                    },
                    jobApplications: {
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
                },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: offset,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getApplicantStats(): Promise<ApplicantStats> {
        try {
            const [total, withAssessments, withApplications] =
                await Promise.all([
                    this.prisma.applicant.count(),
                    this.prisma.applicant.count({
                        where: { assessments: { some: {} } },
                    }),
                    this.prisma.applicant.count({
                        where: { jobApplications: { some: {} } },
                    }),
                ])

            return { total, withAssessments, withApplications }
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }
}

export default function getApplicantPool(
    prisma: PrismaClient,
    logger: Logger,
): ApplicantPool {
    return new ApplicantPoolImpl(prisma, logger)
}
