import { FastifyPluginAsync } from "fastify"
import {
    AssessmentQuestionSchema,
    AssessmentQuestionWithDetailsSchema,
    CreateAssessmentQuestionRequestSchema,
    UpdateAssessmentQuestionRequestSchema,
    SuccessResponseSchema,
    ErrorResponseSchema,
} from "./schemas"
import {
    getQuestions,
    getQuestionById,
    createQuestion,
    updateQuestion,
    deleteQuestion,
} from "./handlers"

const assessmentQuestionsRoutes: FastifyPluginAsync = async (fastify) => {
    // Get all questions (with optional templateId filter)
    fastify.get(
        "/",
        {
            schema: {
                tags: ["Assessment Questions"],
                summary: "Get all questions",
                querystring: {
                    type: "object",
                    properties: {
                        templateId: { type: "string" },
                    },
                },
                response: {
                    200: {
                        type: "object",
                        properties: {
                            questions: {
                                type: "array",
                                items: AssessmentQuestionSchema,
                            },
                        },
                    },
                    400: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        getQuestions,
    )

    // Get question by ID
    fastify.get(
        "/:id",
        {
            schema: {
                tags: ["Assessment Questions"],
                summary: "Get question by ID",
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
                            question: AssessmentQuestionWithDetailsSchema,
                        },
                    },
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        getQuestionById,
    )

    // Create question
    fastify.post(
        "/",
        {
            schema: {
                tags: ["Assessment Questions"],
                summary: "Create question",
                body: CreateAssessmentQuestionRequestSchema,
                response: {
                    200: {
                        type: "object",
                        properties: {
                            question: AssessmentQuestionSchema,
                        },
                    },
                    400: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        createQuestion,
    )

    // Update question
    fastify.put(
        "/:id",
        {
            schema: {
                tags: ["Assessment Questions"],
                summary: "Update question",
                params: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                    },
                    required: ["id"],
                },
                body: UpdateAssessmentQuestionRequestSchema,
                response: {
                    200: {
                        type: "object",
                        properties: {
                            question: AssessmentQuestionSchema,
                        },
                    },
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        updateQuestion,
    )

    // Delete question
    fastify.delete(
        "/:id",
        {
            schema: {
                tags: ["Assessment Questions"],
                summary: "Delete question",
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
        deleteQuestion,
    )
}

export default assessmentQuestionsRoutes
