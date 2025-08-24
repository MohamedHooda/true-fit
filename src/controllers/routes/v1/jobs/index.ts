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
}

export default jobs
