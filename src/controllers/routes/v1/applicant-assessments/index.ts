import { FastifyPluginAsync } from "fastify"
import {
    ApplicantAssessmentWithDetailsSchema,
    AssessmentSubmissionSchema,
    AssessmentScoreWithDetailsSchema,
    AssessmentExplanationSchema,
    AssessmentStatsSchema,
    AssessmentFiltersSchema,
    SuccessResponseSchema,
    ErrorResponseSchema,
} from "./schemas"
import {
    getAssessments,
    getAssessmentById,
    submitAssessment,
    getAssessmentScore,
    getAssessmentExplanation,
    getAssessmentStats,
} from "./handlers"

const applicantAssessmentsRoutes: FastifyPluginAsync = async (fastify) => {
    // Get all assessments
    fastify.get(
        "/",
        {
            schema: {
                tags: ["Applicant Assessments"],
                summary: "List assessments",
                querystring: {
                    type: "object",
                    properties: {
                        ...AssessmentFiltersSchema.properties,
                        limit: { type: "number" },
                        offset: { type: "number" },
                    },
                },
                response: {
                    200: {
                        type: "object",
                        properties: {
                            assessments: {
                                type: "array",
                                items: ApplicantAssessmentWithDetailsSchema,
                            },
                        },
                    },
                    400: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        getAssessments,
    )

    // Get assessment by ID
    fastify.get(
        "/:id",
        {
            schema: {
                tags: ["Applicant Assessments"],
                summary: "Get assessment details",
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
                            assessment: ApplicantAssessmentWithDetailsSchema,
                        },
                    },
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        getAssessmentById,
    )

    // Submit assessment
    fastify.post(
        "/",
        {
            schema: {
                tags: ["Applicant Assessments"],
                summary: "Submit assessment",
                body: AssessmentSubmissionSchema,
                response: {
                    201: {
                        type: "object",
                        properties: {
                            assessment: ApplicantAssessmentWithDetailsSchema,
                        },
                    },
                    400: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        submitAssessment,
    )

    // Get assessment score
    fastify.get(
        "/:id/score",
        {
            schema: {
                tags: ["Applicant Assessments"],
                summary: "Get assessment score",
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
                            score: AssessmentScoreWithDetailsSchema,
                        },
                    },
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        getAssessmentScore,
    )

    // Get assessment explanation
    fastify.get(
        "/:id/explanation",
        {
            schema: {
                tags: ["Applicant Assessments"],
                summary: "Get assessment explanation",
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
                            explanation: AssessmentExplanationSchema,
                        },
                    },
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        getAssessmentExplanation,
    )

    // Get assessment stats
    fastify.get(
        "/stats",
        {
            schema: {
                tags: ["Applicant Assessments"],
                summary: "Get assessment statistics",
                querystring: {
                    type: "object",
                    properties: {
                        templateId: { type: "string" },
                        jobId: { type: "string" },
                    },
                },
                response: {
                    200: {
                        type: "object",
                        properties: {
                            stats: AssessmentStatsSchema,
                        },
                    },
                    500: ErrorResponseSchema,
                },
            },
        },
        getAssessmentStats,
    )
}

export default applicantAssessmentsRoutes
