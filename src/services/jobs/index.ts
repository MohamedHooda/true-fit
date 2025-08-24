import {
    Job,
    JobWithBranch,
    JobWithDetails,
    JobCreate,
    JobUpdate,
    JobFilters,
    JobStats,
} from "types/job"
import { JobPool } from "persistence/db/pool/jobs"
import { ITrueFitEventRelaying } from "services/events"

export interface IJobService {
    /**
     * Get a job by ID
     * @param {string} id - The ID of the job to get
     * @returns {Promise<JobWithDetails | null>} - The job with details
     */
    getJobById(id: string): Promise<JobWithDetails | null>

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
     * Get all jobs with filters
     * @param {JobFilters} filters - Filters to apply
     * @param {number} limit - Maximum number of jobs to return
     * @param {number} offset - Number of jobs to skip
     * @returns {Promise<JobWithBranch[]>} - The jobs with branch details
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
     * Get job statistics
     * @param {string} branchId - Optional branch ID to filter stats
     * @param {string} companyId - Optional company ID to filter stats
     * @returns {Promise<JobStats>} - The job statistics
     */
    getJobStats(branchId?: string, companyId?: string): Promise<JobStats>
}

class JobService implements IJobService {
    constructor(
        private readonly pool: JobPool,
        private readonly events: ITrueFitEventRelaying,
    ) {}

    async getJobById(id: string): Promise<JobWithDetails | null> {
        return this.pool.getJobWithDetails(id)
    }

    async createJob(job: JobCreate): Promise<Job> {
        const createdJob = await this.pool.createJob(job)

        // TODO: Add JOB event types
        // await this.events.dispatchEvent({
        //     type: "JOB_CREATED",
        //     payload: {
        //         jobId: createdJob.id,
        //         title: createdJob.title,
        //         branchId: createdJob.branchId
        //     }
        // })

        return createdJob
    }

    async deleteJob(id: string): Promise<void> {
        // Get job before deletion for event
        const job = await this.pool.getJobById(id)

        await this.pool.deleteJob(id)

        if (job) {
            // TODO: Add JOB event types
            // await this.events.dispatchEvent({
            //     type: "JOB_DELETED",
            //     payload: {
            //         jobId: id,
            //         title: job.title,
            //         branchId: job.branchId
            //     }
            // })
        }
    }

    async getJobs(
        filters?: JobFilters,
        limit?: number,
        offset?: number,
    ): Promise<JobWithBranch[]> {
        return this.pool.getJobs(filters, limit, offset)
    }

    async updateJob(id: string, job: JobUpdate): Promise<Job> {
        const updatedJob = await this.pool.updateJob(id, job)

        // TODO: Add JOB event types
        // await this.events.dispatchEvent({
        //     type: "JOB_UPDATED",
        //     payload: {
        //         jobId: id,
        //         changes: job,
        //     }
        // })

        return updatedJob
    }

    async getJobStats(companyId: string): Promise<JobStats> {
        return this.pool.getJobsStats(companyId)
    }
}

export default function getJobService(
    pool: JobPool,
    events: ITrueFitEventRelaying,
): IJobService {
    return new JobService(pool, events)
}
