import { FastifyPluginAsync } from "fastify"
import {
    recalculateJobRankings,
    processBulkRankings,
    invalidateRankings,
    scheduleStaleRecalculations,
} from "./ranking-handlers"
import {
    RankingCalculationRequestSchema,
    RankingCalculationResultSchema,
    BulkRankingRequestSchema,
    InvalidationRequestSchema,
    ErrorResponseSchema,
} from "./ranking-schemas"

const rankings: FastifyPluginAsync = async (fastify): Promise<void> => {
    // POST /calculate - Recalculate rankings for a job
    fastify.post<{
        Body: any
        Reply: any
    }>("/calculate", {
        schema: {
            description: "Trigger recalculation of rankings for a specific job",
            tags: ["Candidate Rankings"],
            body: RankingCalculationRequestSchema,
            response: {
                200: RankingCalculationResultSchema,
                400: ErrorResponseSchema,
                409: ErrorResponseSchema,
                500: ErrorResponseSchema,
            },
        },
        handler: recalculateJobRankings,
    })

    // POST /bulk - Process multiple job rankings
    fastify.post<{
        Body: any
        Reply: any
    }>("/bulk", {
        schema: {
            description: "Process bulk ranking calculations for multiple jobs",
            tags: ["Candidate Rankings"],
            body: BulkRankingRequestSchema,
            response: {
                200: {
                    type: "object",
                    properties: {
                        totalJobs: { type: "integer", minimum: 0 },
                        successful: { type: "integer", minimum: 0 },
                        failed: { type: "integer", minimum: 0 },
                        results: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    jobId: {
                                        type: "string",
                                        format: "uuid",
                                    },
                                    totalCandidates: {
                                        type: "integer",
                                        minimum: 0,
                                    },
                                    calculationDuration: {
                                        type: "integer",
                                        minimum: 0,
                                    },
                                },
                            },
                        },
                    },
                },
                400: ErrorResponseSchema,
                500: ErrorResponseSchema,
            },
        },
        handler: processBulkRankings,
    })

    // POST /invalidate - Invalidate rankings
    fastify.post<{
        Body: any
        Reply: any
    }>("/invalidate", {
        schema: {
            description: "Invalidate rankings based on various criteria",
            tags: ["Candidate Rankings"],
            body: InvalidationRequestSchema,
            response: {
                200: {
                    type: "object",
                    properties: {
                        message: { type: "string" },
                        triggerEvent: { type: "string" },
                    },
                },
                400: ErrorResponseSchema,
                500: ErrorResponseSchema,
            },
        },
        handler: invalidateRankings,
    })

    // POST /schedule-stale - Schedule recalculation for stale jobs
    fastify.post<{
        Reply: any
    }>("/schedule-stale", {
        schema: {
            description: "Schedule recalculation for jobs with stale rankings",
            tags: ["Candidate Rankings"],
            response: {
                200: {
                    type: "object",
                    properties: {
                        message: { type: "string" },
                    },
                },
                500: ErrorResponseSchema,
            },
        },
        handler: scheduleStaleRecalculations,
    })
}

export default rankings
