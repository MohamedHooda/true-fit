import { FastifyPluginAsync } from "fastify"
import {
    ScoringConfigSchema,
    ScoringConfigWithDetailsSchema,
    CreateScoringConfigRequestSchema,
    UpdateScoringConfigRequestSchema,
    ScoringPreviewSchema,
    SuccessResponseSchema,
    ErrorResponseSchema,
} from "./schemas"
import {
    getScoringConfigs,
    getScoringConfigById,
    createScoringConfig,
    updateScoringConfig,
    deleteScoringConfig,
    applyScoringConfig,
    previewScoringConfig,
} from "./handlers"

const scoringConfigsRoutes: FastifyPluginAsync = async (fastify) => {
    // Get all scoring configs
    fastify.get(
        "/",
        {
            schema: {
                tags: ["Scoring Configs"],
                summary: "List scoring configurations",
                querystring: {
                    type: "object",
                    properties: {
                        isDefault: { type: "boolean" },
                        jobId: { type: "string" },
                    },
                },
                response: {
                    200: {
                        type: "object",
                        properties: {
                            configs: {
                                type: "array",
                                items: ScoringConfigWithDetailsSchema,
                            },
                        },
                    },
                    500: ErrorResponseSchema,
                },
            },
        },
        getScoringConfigs,
    )

    // Get scoring config by ID
    fastify.get(
        "/:id",
        {
            schema: {
                tags: ["Scoring Configs"],
                summary: "Get scoring configuration details",
                params: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                    },
                    required: ["id"],
                },
                response: {
                    200: {
                        type: "object",
                        properties: {
                            config: ScoringConfigWithDetailsSchema,
                        },
                    },
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        getScoringConfigById,
    )

    // Create scoring config
    fastify.post(
        "/",
        {
            schema: {
                tags: ["Scoring Configs"],
                summary: "Create scoring configuration",
                body: CreateScoringConfigRequestSchema,
                response: {
                    201: {
                        type: "object",
                        properties: {
                            config: ScoringConfigWithDetailsSchema,
                        },
                    },
                    400: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        createScoringConfig,
    )

    // Update scoring config
    fastify.put(
        "/:id",
        {
            schema: {
                tags: ["Scoring Configs"],
                summary: "Update scoring configuration",
                params: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                    },
                    required: ["id"],
                },
                body: UpdateScoringConfigRequestSchema,
                response: {
                    200: {
                        type: "object",
                        properties: {
                            config: ScoringConfigWithDetailsSchema,
                        },
                    },
                    400: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        updateScoringConfig,
    )

    // Delete scoring config
    fastify.delete(
        "/:id",
        {
            schema: {
                tags: ["Scoring Configs"],
                summary: "Delete scoring configuration",
                params: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                    },
                    required: ["id"],
                },
                response: {
                    200: SuccessResponseSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        deleteScoringConfig,
    )

    // Apply scoring config to job
    fastify.post(
        "/:id/apply",
        {
            schema: {
                tags: ["Scoring Configs"],
                summary: "Apply scoring configuration to job",
                params: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                    },
                    required: ["id"],
                },
                body: {
                    type: "object",
                    properties: {
                        jobId: { type: "string" },
                    },
                    required: ["jobId"],
                },
                response: {
                    200: {
                        type: "object",
                        properties: {
                            config: ScoringConfigWithDetailsSchema,
                        },
                    },
                    400: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        applyScoringConfig,
    )

    // Preview scoring config impact
    fastify.get(
        "/:id/preview",
        {
            schema: {
                tags: ["Scoring Configs"],
                summary: "Preview scoring configuration impact",
                params: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                    },
                    required: ["id"],
                },
                querystring: {
                    type: "object",
                    properties: {
                        jobId: { type: "string" },
                    },
                    required: ["jobId"],
                },
                response: {
                    200: {
                        type: "object",
                        properties: {
                            preview: ScoringPreviewSchema,
                        },
                    },
                    400: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        previewScoringConfig,
    )
}

export default scoringConfigsRoutes
