import { FastifyPluginAsync } from "fastify"
import {
    getTopCandidates,
    recalculateJobRankings,
    getJobRankingStatus,
    processBulkRankings,
    invalidateRankings,
    scheduleStaleRecalculations,
    getCandidateRank,
} from "./handlers"
import {
    TopCandidatesResponseSchema,
    TopCandidatesQuerySchema,
    JobIdParamSchema,
    RankingCalculationRequestSchema,
    RankingCalculationResultSchema,
    JobRankingStatusSchema,
    JobRankingStatusQuerySchema,
    BulkRankingRequestSchema,
    InvalidationRequestSchema,
    ErrorResponseSchema,
    CandidateRankingWithDetailsSchema,
    ApplicantIdParamSchema,
} from "./schemas"

const candidateRankingsRoutes: FastifyPluginAsync = async function (
    fastify,
    opts,
) {
    // GET /jobs/:jobId/candidates/top - Get top candidates for a job
    fastify.get<{
        Params: { jobId: string }
        Querystring: { limit?: number }
        Reply: any
    }>(
        "/jobs/:jobId/candidates/top",
        {
            schema: {
                description: "Get top candidates for a specific job",
                tags: ["Candidate Rankings"],
                params: JobIdParamSchema,
                querystring: TopCandidatesQuerySchema,
                response: {
                    200: TopCandidatesResponseSchema,
                    400: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        getTopCandidates,
    )

    // POST /rankings/calculate - Recalculate rankings for a job
    fastify.post<{
        Body: any
        Reply: any
    }>(
        "/rankings/calculate",
        {
            schema: {
                description:
                    "Trigger recalculation of rankings for a specific job",
                tags: ["Candidate Rankings"],
                body: RankingCalculationRequestSchema,
                response: {
                    200: RankingCalculationResultSchema,
                    400: ErrorResponseSchema,
                    409: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        recalculateJobRankings,
    )

    // GET /jobs/:jobId/rankings/status - Get ranking status for a job
    fastify.get<{
        Params: { jobId: string }
        Querystring: { includeMetrics?: boolean }
        Reply: any
    }>(
        "/jobs/:jobId/rankings/status",
        {
            schema: {
                description:
                    "Get ranking calculation status for a specific job",
                tags: ["Candidate Rankings"],
                params: JobIdParamSchema,
                querystring: JobRankingStatusQuerySchema,
                response: {
                    200: JobRankingStatusSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        getJobRankingStatus,
    )

    // POST /rankings/bulk - Process multiple job rankings
    fastify.post<{
        Body: any
        Reply: any
    }>(
        "/rankings/bulk",
        {
            schema: {
                description:
                    "Process bulk ranking calculations for multiple jobs",
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
        },
        processBulkRankings,
    )

    // POST /rankings/invalidate - Invalidate rankings
    fastify.post<{
        Body: any
        Reply: any
    }>(
        "/rankings/invalidate",
        {
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
        },
        invalidateRankings,
    )

    // POST /rankings/schedule-stale - Schedule recalculation for stale jobs
    fastify.post<{
        Reply: any
    }>(
        "/rankings/schedule-stale",
        {
            schema: {
                description:
                    "Schedule recalculation for jobs with stale rankings",
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
        },
        scheduleStaleRecalculations,
    )

    // GET /jobs/:jobId/candidates/:applicantId/rank - Get specific candidate's rank
    fastify.get<{
        Params: { jobId: string; applicantId: string }
        Reply: any
    }>(
        "/jobs/:jobId/candidates/:applicantId/rank",
        {
            schema: {
                description: "Get a specific candidate's rank for a job",
                tags: ["Candidate Rankings"],
                params: {
                    type: "object",
                    properties: {
                        jobId: { type: "string", format: "uuid" },
                        applicantId: { type: "string", format: "uuid" },
                    },
                    required: ["jobId", "applicantId"],
                },
                response: {
                    200: {
                        type: "object",
                        properties: {
                            candidate: CandidateRankingWithDetailsSchema,
                            jobMetadata: {
                                type: "object",
                                properties: {
                                    totalCandidates: {
                                        type: "integer",
                                        minimum: 0,
                                    },
                                    lastCalculatedAt: {
                                        anyOf: [
                                            {
                                                type: "string",
                                                format: "date-time",
                                            },
                                            { type: "null" },
                                        ],
                                    },
                                    calculationDuration: {
                                        anyOf: [
                                            { type: "integer", minimum: 0 },
                                            { type: "null" },
                                        ],
                                    },
                                    status: {
                                        type: "string",
                                        enum: [
                                            "CALCULATING",
                                            "COMPLETED",
                                            "STALE",
                                            "ERROR",
                                        ],
                                    },
                                },
                            },
                        },
                    },
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        getCandidateRank,
    )
}

export default candidateRankingsRoutes
