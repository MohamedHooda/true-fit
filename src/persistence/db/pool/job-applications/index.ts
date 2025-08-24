import { PrismaClient, ApplicationStatus } from "@prisma/client"
import { handleDBError } from "helpers/serviceError"
import { Logger } from "types/logging"
import {
    JobApplication,
    JobApplicationWithDetails,
    JobApplicationCreate,
    JobApplicationUpdate,
    JobApplicationFilters,
    JobApplicationStats,
} from "types/jobApplication"

export interface JobApplicationPool {
    /**
     * Get a job application by ID
     * @param {string} id - The ID of the job application to get
     * @returns {Promise<JobApplicationWithDetails | null>} - The job application with details
     */
    getJobApplicationById(id: string): Promise<JobApplicationWithDetails | null>

    /**
     * Get job applications by job ID
     * @param {string} jobId - The ID of the job
     * @returns {Promise<JobApplicationWithDetails[]>} - The job applications for the job
     */
    getJobApplicationsByJobId(
        jobId: string,
    ): Promise<JobApplicationWithDetails[]>

    /**
     * Get job applications by applicant ID
     * @param {string} applicantId - The ID of the applicant
     * @returns {Promise<JobApplicationWithDetails[]>} - The job applications for the applicant
     */
    getJobApplicationsByApplicantId(
        applicantId: string,
    ): Promise<JobApplicationWithDetails[]>

    /**
     * Get job applications by company ID
     * @param {string} companyId - The ID of the company
     * @returns {Promise<JobApplicationWithDetails[]>} - The job applications for the company
     */
    getJobApplicationsByCompanyId(
        companyId: string,
    ): Promise<JobApplicationWithDetails[]>

    /**
     * Create a job application
     * @param {JobApplicationCreate} application - The job application to create
     * @returns {Promise<JobApplication>} - The created job application
     */
    createJobApplication(
        application: JobApplicationCreate,
    ): Promise<JobApplication>

    /**
     * Delete a job application
     * @param {string} id - The ID of the job application to delete
     * @returns {Promise<void>}
     */
    deleteJobApplication(id: string): Promise<void>

    /**
     * Get all job applications with filtering
     * @param {JobApplicationFilters} filters - Filters to apply
     * @param {number} limit - Maximum number of applications to return
     * @param {number} offset - Number of applications to skip
     * @returns {Promise<JobApplicationWithDetails[]>} - The job applications with details
     */
    getJobApplications(
        filters?: JobApplicationFilters,
        limit?: number,
        offset?: number,
    ): Promise<JobApplicationWithDetails[]>

    /**
     * Update a job application status
     * @param {string} id - The ID of the job application to update
     * @param {JobApplicationUpdate} application - The job application data to update
     * @returns {Promise<JobApplication>} - The updated job application
     */
    updateJobApplication(
        id: string,
        application: JobApplicationUpdate,
    ): Promise<JobApplication>

    /**
     * Check if an applicant has already applied to a job
     * @param {string} applicantId - The applicant ID
     * @param {string} jobId - The job ID
     * @returns {Promise<boolean>} - Whether the applicant has applied
     */
    hasApplicantAppliedToJob(
        applicantId: string,
        jobId: string,
    ): Promise<boolean>

    /**
     * Get job application statistics for a company
     * @param {string} companyId - The company ID
     * @returns {Promise<JobApplicationStats>}
     */
    getJobApplicationStats(companyId: string): Promise<JobApplicationStats>

    /**
     * Get recent job applications
     * @param {number} limit - Maximum number of applications to return
     * @param {string} companyId - Optional company ID to filter by
     * @returns {Promise<JobApplicationWithDetails[]>} - The recent job applications
     */
    getRecentJobApplications(
        limit?: number,
        companyId?: string,
    ): Promise<JobApplicationWithDetails[]>

    /**
     * Bulk update job application statuses
     * @param {string[]} ids - Array of job application IDs
     * @param {ApplicationStatus} status - The new status
     * @returns {Promise<number>} - Number of updated applications
     */
    bulkUpdateJobApplicationStatus(
        ids: string[],
        status: ApplicationStatus,
    ): Promise<number>
}

class JobApplicationPoolImpl implements JobApplicationPool {
    constructor(
        private readonly prisma: PrismaClient,
        private readonly logger: Logger,
    ) {}

    async getJobApplicationById(
        id: string,
    ): Promise<JobApplicationWithDetails | null> {
        try {
            const application = await this.prisma.jobApplication.findUnique({
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
                            resumeUrl: true,
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
                },
            })

            return application
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getJobApplicationsByJobId(
        jobId: string,
    ): Promise<JobApplicationWithDetails[]> {
        try {
            return this.prisma.jobApplication.findMany({
                where: { jobId },
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
                            resumeUrl: true,
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
                },
                orderBy: { appliedAt: "desc" },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getJobApplicationsByApplicantId(
        applicantId: string,
    ): Promise<JobApplicationWithDetails[]> {
        try {
            return this.prisma.jobApplication.findMany({
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
                            resumeUrl: true,
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
                },
                orderBy: { appliedAt: "desc" },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getJobApplicationsByCompanyId(
        companyId: string,
    ): Promise<JobApplicationWithDetails[]> {
        try {
            return this.prisma.jobApplication.findMany({
                where: {
                    job: {
                        branch: {
                            companyId,
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
                            resumeUrl: true,
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
                },
                orderBy: { appliedAt: "desc" },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async createJobApplication(
        application: JobApplicationCreate,
    ): Promise<JobApplication> {
        try {
            return this.prisma.jobApplication.create({
                data: application,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async deleteJobApplication(id: string): Promise<void> {
        try {
            await this.prisma.jobApplication.delete({
                where: { id },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getJobApplications(
        filters: JobApplicationFilters = {},
        limit: number = 50,
        offset: number = 0,
    ): Promise<JobApplicationWithDetails[]> {
        try {
            const where: any = {}

            if (filters.status) {
                where.status = filters.status
            }

            if (filters.jobId) {
                where.jobId = filters.jobId
            }

            if (filters.applicantId) {
                where.applicantId = filters.applicantId
            }

            if (filters.branchId) {
                where.job = {
                    branchId: filters.branchId,
                }
            }

            if (filters.companyId) {
                where.job = {
                    branch: {
                        companyId: filters.companyId,
                    },
                }
            }

            if (filters.dateFrom || filters.dateTo) {
                where.appliedAt = {}
                if (filters.dateFrom) {
                    where.appliedAt.gte = filters.dateFrom
                }
                if (filters.dateTo) {
                    where.appliedAt.lte = filters.dateTo
                }
            }

            return this.prisma.jobApplication.findMany({
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
                            resumeUrl: true,
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
                },
                orderBy: { appliedAt: "desc" },
                take: limit,
                skip: offset,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async updateJobApplication(
        id: string,
        application: JobApplicationUpdate,
    ): Promise<JobApplication> {
        try {
            return this.prisma.jobApplication.update({
                where: { id },
                data: application,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async hasApplicantAppliedToJob(
        applicantId: string,
        jobId: string,
    ): Promise<boolean> {
        try {
            const existing = await this.prisma.jobApplication.findFirst({
                where: {
                    applicantId,
                    jobId,
                },
            })

            return !!existing
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getJobApplicationStats(
        companyId: string,
    ): Promise<JobApplicationStats> {
        try {
            const [total, applied, reviewing, rejected, hired] =
                await Promise.all([
                    this.prisma.jobApplication.count({
                        where: { job: { branch: { companyId } } },
                    }),
                    this.prisma.jobApplication.count({
                        where: {
                            job: { branch: { companyId } },
                            status: "APPLIED",
                        },
                    }),
                    this.prisma.jobApplication.count({
                        where: {
                            job: { branch: { companyId } },
                            status: "REVIEWING",
                        },
                    }),
                    this.prisma.jobApplication.count({
                        where: {
                            job: { branch: { companyId } },
                            status: "REJECTED",
                        },
                    }),
                    this.prisma.jobApplication.count({
                        where: {
                            job: { branch: { companyId } },
                            status: "HIRED",
                        },
                    }),
                ])

            return { total, applied, reviewing, rejected, hired }
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getRecentJobApplications(
        limit: number = 10,
        companyId?: string,
    ): Promise<JobApplicationWithDetails[]> {
        try {
            const where: any = {}

            if (companyId) {
                where.job = {
                    branch: {
                        companyId,
                    },
                }
            }

            return this.prisma.jobApplication.findMany({
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
                            resumeUrl: true,
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
                },
                orderBy: { appliedAt: "desc" },
                take: limit,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async bulkUpdateJobApplicationStatus(
        ids: string[],
        status: ApplicationStatus,
    ): Promise<number> {
        try {
            const result = await this.prisma.jobApplication.updateMany({
                where: {
                    id: {
                        in: ids,
                    },
                },
                data: {
                    status,
                },
            })

            return result.count
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }
}

export default function getJobApplicationPool(
    prisma: PrismaClient,
    logger: Logger,
): JobApplicationPool {
    return new JobApplicationPoolImpl(prisma, logger)
}
