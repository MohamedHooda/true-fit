import { FastifyPluginAsync } from "fastify"
import {
    BranchSchema,
    BranchWithCompanySchema,
    CreateBranchRequestSchema,
    CreateBranchResponseSchema,
    UpdateBranchRequestSchema,
    SuccessResponseSchema,
    ErrorResponseSchema,
} from "./schemas"
import {
    getBranches,
    getBranchById,
    createBranch,
    updateBranch,
    deleteBranch,
} from "./handlers"

import jwtAuth from "auth/jwtAuth"
import Authorisation from "auth/authorisation"

const branchesRoutes: FastifyPluginAsync = async (fastify) => {
    // Register authentication and authorization middleware
    fastify.register(jwtAuth)
    fastify.register(Authorisation)

    // Branch management routes (authenticated)
    fastify.get(
        "/",
        {
            schema: {
                tags: ["Branches"],
                summary: "Get all branches or branches for a specific company",
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
                        companyId: {
                            type: "string",
                            description: "Filter branches by company ID",
                        },
                    },
                },
                response: {
                    200: {
                        branches: {
                            type: "array",
                            items: BranchWithCompanySchema,
                        },
                    },
                    401: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        getBranches,
    )

    fastify.get(
        "/:id",
        {
            schema: {
                tags: ["Branches"],
                summary: "Get branch by ID",
                params: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                    },
                    required: ["id"],
                },
                response: {
                    200: { branch: BranchWithCompanySchema },
                    401: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        getBranchById,
    )

    fastify.post(
        "/",
        {
            schema: {
                tags: ["Branches"],
                summary: "Create new branch",
                body: CreateBranchRequestSchema,
                response: {
                    201: { branch: CreateBranchResponseSchema },
                    400: ErrorResponseSchema,
                    401: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    409: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        createBranch,
    )

    fastify.put(
        "/:id",
        {
            schema: {
                tags: ["Branches"],
                summary: "Update branch",
                params: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                    },
                    required: ["id"],
                },
                body: UpdateBranchRequestSchema,
                response: {
                    200: { branch: BranchSchema },
                    401: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    409: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        updateBranch,
    )

    fastify.delete(
        "/:id",
        {
            schema: {
                tags: ["Branches"],
                summary: "Delete branch",
                params: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                    },
                    required: ["id"],
                },
                response: {
                    200: SuccessResponseSchema,
                    400: ErrorResponseSchema,
                    401: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        deleteBranch,
    )
}

export default branchesRoutes
