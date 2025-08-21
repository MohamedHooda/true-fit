import { FastifyPluginAsync } from "fastify"
import {
    CompanySchema,
    CompanyWithBranchesSchema,
    CreateCompanyRequestSchema,
    CreateCompanyResponseSchema,
    UpdateCompanyRequestSchema,
    SuccessResponseSchema,
    ErrorResponseSchema,
} from "./schemas"
import {
    getCompanies,
    getCompanyById,
    createCompany,
    updateCompany,
    deleteCompany,
} from "./handlers"

import jwtAuth from "auth/jwtAuth"
import Authorisation from "auth/authorisation"

const companiesRoutes: FastifyPluginAsync = async (fastify) => {
    // Register authentication and authorization middleware
    fastify.register(jwtAuth)
    fastify.register(Authorisation)

    // Company management routes (authenticated)
    fastify.get(
        "/",
        {
            schema: {
                tags: ["Companies"],
                summary: "Get all companies",
                querystring: {
                    type: "object",
                    properties: {
                        limit: {
                            type: "number",
                            minimum: 1,
                            maximum: 100,
                            default: 50,
                        },
                        offset: { type: "number", minimum: 0, default: 0 },
                    },
                },
                response: {
                    200: {
                        companies: {
                            type: "array",
                            items: CompanyWithBranchesSchema,
                        },
                    },
                    401: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        getCompanies,
    )

    fastify.get(
        "/:id",
        {
            schema: {
                tags: ["Companies"],
                summary: "Get company by ID",
                params: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                    },
                    required: ["id"],
                },
                response: {
                    200: { company: CompanyWithBranchesSchema },
                    401: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        getCompanyById,
    )

    fastify.post(
        "/",
        {
            schema: {
                tags: ["Companies"],
                summary: "Create new company",
                body: CreateCompanyRequestSchema,
                response: {
                    201: { company: CreateCompanyResponseSchema },
                    400: ErrorResponseSchema,
                    401: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    409: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        createCompany,
    )

    fastify.put(
        "/:id",
        {
            schema: {
                tags: ["Companies"],
                summary: "Update company",
                params: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                    },
                    required: ["id"],
                },
                body: UpdateCompanyRequestSchema,
                response: {
                    200: { company: CompanySchema },
                    401: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    409: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        updateCompany,
    )

    fastify.delete(
        "/:id",
        {
            schema: {
                tags: ["Companies"],
                summary: "Delete company",
                params: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                    },
                    required: ["id"],
                },
                response: {
                    200: SuccessResponseSchema,
                    401: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        deleteCompany,
    )
}

export default companiesRoutes
