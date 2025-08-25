import { FastifySchema } from "fastify"

const applicantProperties = {
    id: { type: "string" },
    email: { type: "string" },
    firstName: { type: "string" },
    lastName: { type: "string" },
    phone: { type: "string", nullable: true },
    city: { type: "string", nullable: true },
    country: { type: "string", nullable: true },
    address: { type: "string", nullable: true },
    resumeUrl: { type: "string", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
}

const assessmentProperties = {
    id: { type: "string" },
    submittedAt: { type: "string", format: "date-time" },
    template: {
        type: "object",
        properties: {
            id: { type: "string" },
            name: { type: "string" },
            job: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    title: { type: "string" },
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
                },
                required: ["id", "title", "branch"],
                nullable: true,
            },
        },
        required: ["id", "name"],
    },
}

const jobApplicationProperties = {
    id: { type: "string" },
    status: { type: "string" },
    appliedAt: { type: "string", format: "date-time" },
    job: {
        type: "object",
        properties: {
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
        },
        required: ["id", "title", "status", "branch"],
    },
}

export const getApplicantsSchema: FastifySchema = {
    querystring: {
        type: "object",
        properties: {
            limit: { type: "number" },
            offset: { type: "number" },
            search: { type: "string" },
            city: { type: "string" },
            country: { type: "string" },
            hasAssessments: { type: "boolean" },
            hasApplications: { type: "boolean" },
        },
    },
    response: {
        200: {
            type: "object",
            properties: {
                applicants: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: applicantProperties,
                        required: [
                            "id",
                            "email",
                            "firstName",
                            "lastName",
                            "createdAt",
                            "updatedAt",
                        ],
                    },
                },
            },
            required: ["applicants"],
        },
    },
}

export const getApplicantByIdSchema: FastifySchema = {
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
                applicant: {
                    type: "object",
                    properties: {
                        ...applicantProperties,
                        assessments: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: assessmentProperties,
                                required: ["id", "submittedAt", "template"],
                            },
                        },
                        jobApplications: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: jobApplicationProperties,
                                required: ["id", "status", "appliedAt", "job"],
                            },
                        },
                    },
                    required: [
                        "id",
                        "email",
                        "firstName",
                        "lastName",
                        "createdAt",
                        "updatedAt",
                        "assessments",
                        "jobApplications",
                    ],
                },
            },
            required: ["applicant"],
        },
    },
}

export const createApplicantSchema: FastifySchema = {
    body: {
        type: "object",
        properties: {
            email: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            phone: { type: "string", nullable: true },
            city: { type: "string", nullable: true },
            country: { type: "string", nullable: true },
            address: { type: "string", nullable: true },
            resumeUrl: { type: "string", nullable: true },
        },
        required: ["email", "firstName", "lastName"],
    },
    response: {
        201: {
            type: "object",
            properties: {
                applicant: {
                    type: "object",
                    properties: applicantProperties,
                    required: [
                        "id",
                        "email",
                        "firstName",
                        "lastName",
                        "createdAt",
                        "updatedAt",
                    ],
                },
            },
            required: ["applicant"],
        },
    },
}

export const updateApplicantSchema: FastifySchema = {
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
            firstName: { type: "string" },
            lastName: { type: "string" },
            phone: { type: "string", nullable: true },
            city: { type: "string", nullable: true },
            country: { type: "string", nullable: true },
            address: { type: "string", nullable: true },
            resumeUrl: { type: "string", nullable: true },
        },
        minProperties: 1,
    },
    response: {
        200: {
            type: "object",
            properties: {
                applicant: {
                    type: "object",
                    properties: applicantProperties,
                    required: [
                        "id",
                        "email",
                        "firstName",
                        "lastName",
                        "createdAt",
                        "updatedAt",
                    ],
                },
            },
            required: ["applicant"],
        },
    },
}

export const deleteApplicantSchema: FastifySchema = {
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
