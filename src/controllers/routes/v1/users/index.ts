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
    createUserHandlers,
    getUsersHandler,
    getUserByIdHandler,
    createUserHandler,
    updateUserHandler,
    deleteUserHandler,
    loginHandler,
    getMeHandler,
    logoutHandler,
    logoutAllHandler,
    changePasswordHandler,
} from "./handlers"
import getUserService from "services/users"
import getUserPool from "persistence/db/pool/users"
import jwtAuth from "auth/jwtAuth"

const usersRoutes: FastifyPluginAsync = async (fastify) => {
    // Initialize dependencies
    const userPool = getUserPool(fastify.db)
    const userService = getUserService(userPool, fastify.events)
    const handlers = createUserHandlers(userService)
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
        loginHandler.bind(handlers),
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
        getMeHandler.bind(handlers),
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
        logoutHandler.bind(handlers),
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
        logoutAllHandler.bind(handlers),
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
        changePasswordHandler.bind(handlers),
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
        getUsersHandler.bind(handlers),
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
        getUserByIdHandler.bind(handlers),
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
        createUserHandler.bind(handlers),
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
        updateUserHandler.bind(handlers),
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
        deleteUserHandler.bind(handlers),
    )
}

export default usersRoutes
