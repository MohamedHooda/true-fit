import { FastifyPluginAsync } from "fastify"
import {
    UserSchema,
    UserWithSessionsSchema,
    CreateUserRequestSchema,
    CreateUserResponseSchema,
    UpdateUserRequestSchema,
    LoginRequestSchema,
    LoginResponseSchema,
    ChangePasswordRequestSchema,
    SuccessResponseSchema,
    ErrorResponseSchema,
} from "./schemas"
import {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    login,
    getMe,
    logout,
    logoutAll,
    changePassword,
} from "./handlers"

import jwtAuth from "auth/jwtAuth"

const usersRoutes: FastifyPluginAsync = async (fastify) => {
    // Register authentication middleware
    fastify.register(jwtAuth)

    // Authentication routes (no auth required)
    fastify.post(
        "/login",
        {
            config: { public: true },
            schema: {
                tags: ["Authentication"],
                summary: "User login",
                body: LoginRequestSchema,
                response: {
                    200: LoginResponseSchema,
                    401: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        login,
    )

    // Current user routes (auth required)
    fastify.get(
        "/me",
        {
            schema: {
                tags: ["Authentication"],
                summary: "Get current user",
                security: [{ bearerAuth: [] }],

                response: {
                    200: { user: UserSchema },
                    401: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        getMe,
    )

    fastify.post(
        "/logout",
        {
            schema: {
                tags: ["Authentication"],
                summary: "Logout current session",

                response: {
                    200: SuccessResponseSchema,
                    401: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        logout,
    )

    fastify.post(
        "/logout-all",
        {
            schema: {
                tags: ["Authentication"],
                summary: "Logout all sessions",

                response: {
                    200: SuccessResponseSchema,
                    401: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        logoutAll,
    )

    fastify.post(
        "/change-password",
        {
            schema: {
                tags: ["Authentication"],
                summary: "Change user password",

                body: ChangePasswordRequestSchema,
                response: {
                    200: SuccessResponseSchema,
                    400: ErrorResponseSchema,
                    401: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        changePassword,
    )

    // User management routes (admin/recruiter access)
    fastify.get(
        "/",
        {
            schema: {
                tags: ["Users"],
                summary: "Get all users",
                response: {
                    200: {
                        users: {
                            type: "array",
                            items: UserWithSessionsSchema,
                        },
                    },
                    401: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        getUsers,
    )

    fastify.get(
        "/:id",
        {
            schema: {
                tags: ["Users"],
                summary: "Get user by ID",

                params: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                    },
                    required: ["id"],
                },
                response: {
                    200: { user: UserWithSessionsSchema },
                    401: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        getUserById,
    )

    fastify.post(
        "/",
        {
            config: { public: true },
            schema: {
                tags: ["Users"],
                summary: "Create new user",

                body: CreateUserRequestSchema,
                response: {
                    201: { user: CreateUserResponseSchema },
                    401: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    409: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        createUser,
    )

    fastify.put(
        "/:id",
        {
            schema: {
                tags: ["Users"],
                summary: "Update user",

                params: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                    },
                    required: ["id"],
                },
                body: UpdateUserRequestSchema,
                response: {
                    200: { user: UserSchema },
                    401: ErrorResponseSchema,
                    403: ErrorResponseSchema,
                    404: ErrorResponseSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        updateUser,
    )

    fastify.delete(
        "/:id",
        {
            schema: {
                tags: ["Users"],
                summary: "Delete user",

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
        deleteUser,
    )
}

export default usersRoutes
