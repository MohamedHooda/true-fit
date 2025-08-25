import { FastifyPluginAsync } from "fastify"
import {
    getJobs,
    getJobById,
    createJob,
    updateJob,
    deleteJob,
    getJobStats,
} from "./handlers"
import {
    getJobsSchema,
    getJobByIdSchema,
    createJobSchema,
    updateJobSchema,
    deleteJobSchema,
    getJobStatsSchema,
} from "./schemas"
import {
    getTopCandidates,
    recalculateJobRankings,
    getJobRankingStatus,
} from "./ranking-handlers"
import {
    TopCandidatesResponseSchema,
    TopCandidatesQuerySchema,
    JobIdParamsSchema,
    RankingCalculationRequestSchema,
    RankingCalculationResultSchema,
    JobRankingStatusSchema,
    JobRankingStatusQuerySchema,
    ErrorResponseSchema,
    CandidateRankingWithDetailsSchema,
} from "./ranking-schemas"

const jobs: FastifyPluginAsync = async (fastify): Promise<void> => {
    // Get all jobs with filters
    fastify.get("/", {
        schema: {
            ...getJobsSchema,
            tags: ["Jobs"],
            summary: "List jobs with advanced search & filters",
        },
        handler: getJobs,
    })

    // Get job statistics
    fastify.get("/stats", {
        schema: {
            ...getJobStatsSchema,
            tags: ["Jobs"],
            summary: "Get job statistics",
        },
        handler: getJobStats,
    })

    // Get job by ID
    fastify.get("/:id", {
        schema: {
            ...getJobByIdSchema,
            tags: ["Jobs"],
            summary: "Get job details",
        },
        handler: getJobById,
    })

    // Create job
    fastify.post("/", {
        schema: {
            ...createJobSchema,
            tags: ["Jobs"],
            summary: "Create new job",
        },
        handler: createJob,
    })

    // Update job
    fastify.put("/:id", {
        schema: {
            ...updateJobSchema,
            tags: ["Jobs"],
            summary: "Update job",
        },
        handler: updateJob,
    })

    // Delete job
    fastify.delete("/:id", {
        schema: {
            ...deleteJobSchema,
            tags: ["Jobs"],
            summary: "Delete job",
        },
        handler: deleteJob,
    })

    // Candidate ranking routes
    // GET /:jobId/candidates/top - Get top candidates for a job
    fastify.get<{
        Params: { jobId: string }
        Querystring: { limit?: number }
        Reply: any
    }>("/:jobId/candidates/top", {
        schema: {
            description: "Get top candidates for a specific job",
            tags: ["Candidate Rankings"],
            params: JobIdParamsSchema,
            querystring: TopCandidatesQuerySchema,
            response: {
                200: TopCandidatesResponseSchema,
                400: ErrorResponseSchema,
                404: ErrorResponseSchema,
                500: ErrorResponseSchema,
            },
        },
        handler: getTopCandidates,
    })

    // GET /:jobId/rankings/status - Get ranking status for a job
    fastify.get<{
        Params: { jobId: string }
        Querystring: { includeMetrics?: boolean }
        Reply: any
    }>("/:jobId/rankings/status", {
        schema: {
            description: "Get ranking calculation status for a specific job",
            tags: ["Candidate Rankings"],
            params: JobIdParamsSchema,
            querystring: JobRankingStatusQuerySchema,
            response: {
                200: JobRankingStatusSchema,
                404: ErrorResponseSchema,
                500: ErrorResponseSchema,
            },
        },
        handler: getJobRankingStatus,
    })
}

export default jobs
