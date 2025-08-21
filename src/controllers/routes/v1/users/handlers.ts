import { FastifyRequest, FastifyReply } from "fastify"
import { UserCreateRequest, UserUpdate, LoginRequest } from "types/user"
import { mapToErrorResponse } from "controllers/errors"
import { ServiceError, ServiceErrorType } from "types/serviceError"
import { RouteHandler } from "fastify"

// Get all users
export const getUsers: RouteHandler = async function (request, reply) {
    const service = this.services.getUserService()
    try {
        const users = await service.getUsers()
        return { users }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to get users")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Get user by ID
export const getUserById: RouteHandler<{
    Params: { id: string }
}> = async function (request, reply) {
    const service = this.services.getUserService()
    try {
        const user = await service.getUserById(request.params.id)

        if (!user) {
            const resp = mapToErrorResponse(
                new ServiceError(ServiceErrorType.NotFound, "User not found"),
                "User not found",
            )
            return reply.code(resp.code).send(resp.returnError())
        }

        return { user }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to get user")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Create user
export const createUser: RouteHandler<{
    Body: UserCreateRequest
}> = async function (request, reply) {
    const service = this.services.getUserService()
    try {
        const user = await service.createUser(request.body)
        return reply.code(201).send({ user })
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to create user")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Update user
export const updateUser: RouteHandler<{
    Params: { id: string }
    Body: UserUpdate
}> = async function (request, reply) {
    const service = this.services.getUserService()
    try {
        const user = await service.updateUser(request.params.id, request.body)
        return { user }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to update user")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Delete user
export const deleteUser: RouteHandler<{
    Params: { id: string }
}> = async function (request, reply) {
    const service = this.services.getUserService()
    try {
        await service.deleteUser(request.params.id)
        return { message: "User deleted successfully" }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to delete user")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Login
export const login: RouteHandler<{
    Body: LoginRequest
}> = async function (request, reply) {
    const service = this.services.getUserService()
    try {
        const result = await service.login(
            request.body,
            request.headers["user-agent"],
            request.ip,
        )
        return result
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to login")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Get current user (me)
export const getMe: RouteHandler = async function (request, reply) {
    const service = this.services.getUserService()
    try {
        if (!request.user) {
            const resp = mapToErrorResponse(
                new ServiceError(
                    ServiceErrorType.Forbidden,
                    "Not authenticated",
                ),
                "Not authenticated",
            )
            return reply.code(resp.code).send(resp.returnError())
        }

        const user = await service.getUserById(request.user.id)

        if (!user) {
            const resp = mapToErrorResponse(
                new ServiceError(ServiceErrorType.NotFound, "User not found"),
                "User not found",
            )
            return reply.code(resp.code).send(resp.returnError())
        }

        return { user }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to get current user")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Logout
export const logout: RouteHandler = async function (request, reply) {
    const service = this.services.getUserService()
    try {
        if (!request.user) {
            const resp = mapToErrorResponse(
                new ServiceError(
                    ServiceErrorType.Forbidden,
                    "Not authenticated",
                ),
                "Not authenticated",
            )
            return reply.code(resp.code).send(resp.returnError())
        }

        await service.logout(request.user.sessionId)
        return { message: "Logged out successfully" }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to logout")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Logout all sessions
export const logoutAll: RouteHandler = async function (request, reply) {
    const service = this.services.getUserService()
    try {
        if (!request.user) {
            const resp = mapToErrorResponse(
                new ServiceError(
                    ServiceErrorType.Forbidden,
                    "Not authenticated",
                ),
                "Not authenticated",
            )
            return reply.code(resp.code).send(resp.returnError())
        }

        await service.logoutAll(request.user.id)
        return { message: "Logged out from all devices successfully" }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to logout all")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Change password
export const changePassword: RouteHandler<{
    Body: {
        currentPassword: string
        newPassword: string
    }
}> = async function (request, reply) {
    const service = this.services.getUserService()
    try {
        if (!request.user) {
            const resp = mapToErrorResponse(
                new ServiceError(
                    ServiceErrorType.Forbidden,
                    "Not authenticated",
                ),
                "Not authenticated",
            )
            return reply.code(resp.code).send(resp.returnError())
        }

        await service.changePassword(
            request.user.id,
            request.body.currentPassword,
            request.body.newPassword,
        )

        return { message: "Password changed successfully" }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to change password")
        return reply.code(resp.code).send(resp.returnError())
    }
}
