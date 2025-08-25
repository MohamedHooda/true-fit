import { FastifySchema } from "fastify"
import { JobStatus } from "@prisma/client"

const jobProperties = {
    id: { type: "string" },
    title: { type: "string" },
    description: { type: "string", nullable: true },
    requirements: { type: "string", nullable: true },
    status: { type: "string", enum: Object.values(JobStatus) },
    openPositions: { type: "number", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    branchId: { type: "string" },
}

const branchProperties = {
    id: { type: "string" },
    name: { type: "string" },
    city: { type: "string", nullable: true },
    country: { type: "string", nullable: true },
    company: {
        type: "object",
        properties: {
            id: { type: "string" },
            name: { type: "string" },
        },
        required: ["id", "name"],
    },
}

const templateProperties = {
    id: { type: "string" },
    name: { type: "string" },
    description: { type: "string", nullable: true },
}

const jobApplicationProperties = {
    id: { type: "string" },
    status: { type: "string" },
    appliedAt: { type: "string", format: "date-time" },
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

const scoringConfigProperties = {
    id: { type: "string" },
    negativeMarkingFraction: { type: "number" },
    recencyWindowDays: { type: "number", nullable: true },
    recencyBoostPercent: { type: "number", nullable: true },
    isDefault: { type: "boolean" },
}

export const getJobsSchema: FastifySchema = {
    querystring: {
        type: "object",
        properties: {
            limit: { type: "number" },
            offset: { type: "number" },
            status: { type: "string", enum: Object.values(JobStatus) },
            branchId: { type: "string" },
            companyId: { type: "string" },
            search: { type: "string" },
        },
    },
    response: {
        200: {
            type: "object",
            properties: {
                jobs: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            ...jobProperties,
                            branch: {
                                type: "object",
                                properties: branchProperties,
                                required: ["id", "name", "company"],
                            },
                        },
                        required: [
                            "id",
                            "title",
                            "status",
                            "branchId",
                            "branch",
                        ],
                    },
                },
            },
            required: ["jobs"],
        },
    },
}

export const getJobByIdSchema: FastifySchema = {
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
                job: {
                    type: "object",
                    properties: {
                        ...jobProperties,
                        branch: {
                            type: "object",
                            properties: branchProperties,
                            required: ["id", "name", "company"],
                        },
                        templates: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: templateProperties,
                                required: ["id", "name"],
                            },
                        },
                        jobApplications: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: jobApplicationProperties,
                                required: [
                                    "id",
                                    "status",
                                    "appliedAt",
                                    "applicant",
                                ],
                            },
                        },
                        scoringConfig: {
                            type: "object",
                            properties: scoringConfigProperties,
                            required: [
                                "id",
                                "negativeMarkingFraction",
                                "isDefault",
                            ],
                            nullable: true,
                        },
                    },
                    required: [
                        "id",
                        "title",
                        "status",
                        "branchId",
                        "branch",
                        "templates",
                        "jobApplications",
                    ],
                },
            },
            required: ["job"],
        },
    },
}

export const createJobSchema: FastifySchema = {
    body: {
        type: "object",
        properties: {
            title: { type: "string" },
            description: { type: "string", nullable: true },
            requirements: { type: "string", nullable: true },
            status: { type: "string", enum: Object.values(JobStatus) },
            openPositions: { type: "number", nullable: true },
            branchId: { type: "string" },
        },
        required: ["title", "branchId"],
    },
    response: {
        201: {
            type: "object",
            properties: {
                job: {
                    type: "object",
                    properties: jobProperties,
                    required: ["id", "title", "status", "branchId"],
                },
            },
            required: ["job"],
        },
    },
}

export const updateJobSchema: FastifySchema = {
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
            title: { type: "string" },
            description: { type: "string", nullable: true },
            requirements: { type: "string", nullable: true },
            status: { type: "string", enum: Object.values(JobStatus) },
            openPositions: { type: "number", nullable: true },
        },
        minProperties: 1,
    },
    response: {
        200: {
            type: "object",
            properties: {
                job: {
                    type: "object",
                    properties: jobProperties,
                    required: ["id", "title", "status", "branchId"],
                },
            },
            required: ["job"],
        },
    },
}

export const deleteJobSchema: FastifySchema = {
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

export const getJobStatsSchema: FastifySchema = {
    querystring: {
        type: "object",
        properties: {
            companyId: { type: "string" },
        },
        required: ["companyId"],
    },
    response: {
        200: {
            type: "object",
            properties: {
                stats: {
                    type: "object",
                    properties: {
                        total: { type: "number" },
                        open: { type: "number" },
                        closed: { type: "number" },
                        draft: { type: "number" },
                    },
                    required: ["total", "open", "closed", "draft"],
                },
            },
            required: ["stats"],
        },
    },
}
