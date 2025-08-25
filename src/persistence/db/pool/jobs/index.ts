import { PrismaClient } from "@prisma/client"
import { handleDBError } from "helpers/serviceError"
import { Logger } from "types/logging"
import {
    Job,
    JobWithBranch,
    JobWithDetails,
    JobCreate,
    JobUpdate,
    JobFilters,
    JobStats,
} from "types/job"

export interface JobPool {
    /**
     * Get a job by ID
     * @param {string} id - The ID of the job to get
     * @returns {Promise<JobWithBranch | null>} - The job with branch info
     */
    getJobById(id: string): Promise<JobWithBranch | null>

    /**
     * Get a job with full details (templates, applications, scoring config)
     * @param {string} id - The ID of the job to get
     * @returns {Promise<JobWithDetails | null>} - The job with full details
     */
    getJobWithDetails(id: string): Promise<JobWithDetails | null>

    /**
     * Get jobs by branch ID
     * @param {string} branchId - The ID of the branch
     * @returns {Promise<Job[]>} - The jobs for the branch
     */
    getJobsByBranchId(branchId: string): Promise<Job[]>

    /**
     * Get jobs by company ID
     * @param {string} companyId - The ID of the company
     * @returns {Promise<JobWithBranch[]>} - The jobs for the company
     */
    getJobsByCompanyId(companyId: string): Promise<JobWithBranch[]>

    /**
     * Create a job
     * @param {JobCreate} job - The job to create
     * @returns {Promise<Job>} - The created job
     */
    createJob(job: JobCreate): Promise<Job>

    /**
     * Delete a job
     * @param {string} id - The ID of the job to delete
     * @returns {Promise<void>}
     */
    deleteJob(id: string): Promise<void>

    /**
     * Get all jobs with filtering
     * @param {JobFilters} filters - Filters to apply
     * @param {number} limit - Maximum number of jobs to return
     * @param {number} offset - Number of jobs to skip
     * @returns {Promise<JobWithBranch[]>} - The jobs with branch info
     */
    getJobs(
        filters?: JobFilters,
        limit?: number,
        offset?: number,
    ): Promise<JobWithBranch[]>

    /**
     * Update a job
     * @param {string} id - The ID of the job to update
     * @param {JobUpdate} job - The job data to update
     * @returns {Promise<Job>} - The updated job
     */
    updateJob(id: string, job: JobUpdate): Promise<Job>

    /**
     * Check if a job title exists for a branch
     * @param {string} branchId - The branch ID
     * @param {string} title - The job title
     * @param {string} excludeId - Optional job ID to exclude from check (for updates)
     * @returns {Promise<boolean>} - Whether the job title exists
     */
    jobTitleExistsForBranch(
        branchId: string,
        title: string,
        excludeId?: string,
    ): Promise<boolean>

    /**
     * Get jobs statistics for a company
     * @param {string} companyId - The company ID
     * @returns {Promise<JobStats>}
     */
    getJobsStats(companyId: string): Promise<JobStats>
}

class JobPoolImpl implements JobPool {
    constructor(
        private readonly prisma: PrismaClient,
        private readonly logger: Logger,
    ) {}

    async getJobById(id: string): Promise<JobWithBranch | null> {
        try {
            const job = await this.prisma.job.findUnique({
                where: { id },
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
            })

            return job
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getJobWithDetails(id: string): Promise<JobWithDetails | null> {
        try {
            const job = await this.prisma.job.findUnique({
                where: { id },
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
                    templates: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                        },
                    },
                    jobApplications: {
                        select: {
                            id: true,
                            status: true,
                            appliedAt: true,
                            applicant: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                        },
                        orderBy: { appliedAt: "desc" },
                    },
                    scoringConfig: {
                        select: {
                            id: true,
                            negativeMarkingFraction: true,
                            recencyWindowDays: true,
                            recencyBoostPercent: true,
                            isDefault: true,
                        },
                    },
                },
            })

            return job
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getJobsByBranchId(branchId: string): Promise<Job[]> {
        try {
            return this.prisma.job.findMany({
                where: { branchId },
                orderBy: { createdAt: "desc" },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getJobsByCompanyId(companyId: string): Promise<JobWithBranch[]> {
        try {
            return this.prisma.job.findMany({
                where: {
                    branch: {
                        companyId,
                    },
                },
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
                orderBy: { createdAt: "desc" },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async createJob(job: JobCreate): Promise<Job> {
        try {
            return this.prisma.job.create({
                data: job,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async deleteJob(id: string): Promise<void> {
        try {
            await this.prisma.job.delete({
                where: { id },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getJobs(
        filters: JobFilters = {},
        limit: number = 50,
        offset: number = 0,
    ): Promise<JobWithBranch[]> {
        try {
            const where: any = {}

            if (filters.status) {
                where.status = filters.status
            }

            if (filters.branchId) {
                where.branchId = filters.branchId
            }

            if (filters.companyId) {
                where.branch = {
                    companyId: filters.companyId,
                }
            }

            if (filters.search) {
                where.OR = [
                    {
                        title: {
                            contains: filters.search,
                            mode: "insensitive",
                        },
                    },
                    {
                        description: {
                            contains: filters.search,
                            mode: "insensitive",
                        },
                    },
                    {
                        requirements: {
                            contains: filters.search,
                            mode: "insensitive",
                        },
                    },
                ]
            }

            return this.prisma.job.findMany({
                where,
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
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: offset,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async updateJob(id: string, job: JobUpdate): Promise<Job> {
        try {
            return this.prisma.job.update({
                where: { id },
                data: job,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async jobTitleExistsForBranch(
        branchId: string,
        title: string,
        excludeId?: string,
    ): Promise<boolean> {
        try {
            const existing = await this.prisma.job.findFirst({
                where: {
                    branchId,
                    title,
                    ...(excludeId && { id: { not: excludeId } }),
                },
            })

            return !!existing
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getJobsStats(companyId: string): Promise<JobStats> {
        try {
            const [total, open, closed, draft] = await Promise.all([
                this.prisma.job.count({
                    where: { branch: { companyId } },
                }),
                this.prisma.job.count({
                    where: { branch: { companyId }, status: "OPEN" },
                }),
                this.prisma.job.count({
                    where: { branch: { companyId }, status: "CLOSED" },
                }),
                this.prisma.job.count({
                    where: { branch: { companyId }, status: "DRAFT" },
                }),
            ])

            return { total, open, closed, draft }
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }
}

export default function getJobPool(
    prisma: PrismaClient,
    logger: Logger,
): JobPool {
    return new JobPoolImpl(prisma, logger)
}
