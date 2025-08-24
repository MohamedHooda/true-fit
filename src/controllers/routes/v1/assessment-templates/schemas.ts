import { FastifySchema } from "fastify"
import { QuestionType } from "@prisma/client"

const templateProperties = {
    id: { type: "string" },
    name: { type: "string" },
    description: { type: "string", nullable: true },
    jobId: { type: "string", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
}

const jobProperties = {
    id: { type: "string" },
    title: { type: "string" },
    status: { type: "string" },
    branch: {
        type: "object",
        properties: {
            id: { type: "string" },
            name: { type: "string" },
            company: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                },
                required: ["id", "name"],
            },
        },
        required: ["id", "name", "company"],
    },
}

const questionProperties = {
    id: { type: "string" },
    text: { type: "string" },
    type: { type: "string", enum: Object.values(QuestionType) },
    weight: { type: "number" },
    order: { type: "number" },
    correctAnswer: { type: "string", nullable: true },
    negativeWeight: { type: "number", nullable: true },
}

const assessmentProperties = {
    id: { type: "string" },
    submittedAt: { type: "string", format: "date-time" },
    applicant: {
        type: "object",
        properties: {
            id: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string" },
        },
        required: ["id", "firstName", "lastName", "email"],
    },
}

export const getAssessmentTemplatesSchema: FastifySchema = {
    querystring: {
        type: "object",
        properties: {
            limit: { type: "number" },
            offset: { type: "number" },
            jobId: { type: "string" },
            search: { type: "string" },
            hasQuestions: { type: "boolean" },
            hasAssessments: { type: "boolean" },
        },
    },
    response: {
        200: {
            type: "object",
            properties: {
                templates: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            ...templateProperties,
                            job: {
                                type: "object",
                                properties: jobProperties,
                                required: ["id", "title", "status", "branch"],
                                nullable: true,
                            },
                            questions: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: questionProperties,
                                    required: [
                                        "id",
                                        "text",
                                        "type",
                                        "weight",
                                        "order",
                                    ],
                                },
                            },
                            assessments: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: assessmentProperties,
                                    required: [
                                        "id",
                                        "submittedAt",
                                        "applicant",
                                    ],
                                },
                            },
                        },
                        required: [
                            "id",
                            "name",
                            "createdAt",
                            "updatedAt",
                            "questions",
                            "assessments",
                        ],
                    },
                },
            },
            required: ["templates"],
        },
    },
}

export const getAssessmentTemplateByIdSchema: FastifySchema = {
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
                template: {
                    type: "object",
                    properties: {
                        ...templateProperties,
                        job: {
                            type: "object",
                            properties: jobProperties,
                            required: ["id", "title", "status", "branch"],
                            nullable: true,
                        },
                        questions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: questionProperties,
                                required: [
                                    "id",
                                    "text",
                                    "type",
                                    "weight",
                                    "order",
                                ],
                            },
                        },
                        assessments: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: assessmentProperties,
                                required: ["id", "submittedAt", "applicant"],
                            },
                        },
                    },
                    required: [
                        "id",
                        "name",
                        "createdAt",
                        "updatedAt",
                        "questions",
                        "assessments",
                    ],
                },
            },
            required: ["template"],
        },
    },
}

export const createAssessmentTemplateSchema: FastifySchema = {
    body: {
        type: "object",
        properties: {
            name: { type: "string" },
            description: { type: "string", nullable: true },
            jobId: { type: "string", nullable: true },
        },
        required: ["name"],
    },
    response: {
        201: {
            type: "object",
            properties: {
                template: {
                    type: "object",
                    properties: templateProperties,
                    required: ["id", "name", "createdAt", "updatedAt"],
                },
            },
            required: ["template"],
        },
    },
}

export const updateAssessmentTemplateSchema: FastifySchema = {
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
            name: { type: "string" },
            description: { type: "string", nullable: true },
        },
        minProperties: 1,
    },
    response: {
        200: {
            type: "object",
            properties: {
                template: {
                    type: "object",
                    properties: templateProperties,
                    required: ["id", "name", "createdAt", "updatedAt"],
                },
            },
            required: ["template"],
        },
    },
}

export const deleteAssessmentTemplateSchema: FastifySchema = {
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
                message: { type: "string" },
            },
            required: ["message"],
        },
    },
}

export const cloneAssessmentTemplateSchema: FastifySchema = {
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
            name: { type: "string" },
            jobId: { type: "string", nullable: true },
        },
        required: ["name"],
    },
    response: {
        200: {
            type: "object",
            properties: {
                template: {
                    type: "object",
                    properties: templateProperties,
                    required: ["id", "name", "createdAt", "updatedAt"],
                },
            },
            required: ["template"],
        },
    },
}

export const getAssessmentTemplateStatsSchema: FastifySchema = {
    querystring: {
        type: "object",
        properties: {
            companyId: { type: "string" },
        },
    },
    response: {
        200: {
            type: "object",
            properties: {
                stats: {
                    type: "object",
                    properties: {
                        total: { type: "number" },
                        withQuestions: { type: "number" },
                        withAssessments: { type: "number" },
                    },
                    required: ["total", "withQuestions", "withAssessments"],
                },
            },
            required: ["stats"],
        },
    },
}
