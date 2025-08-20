import { FastifyRequest, FastifyReply } from "fastify"
import { IUserService } from "services/users"
import { UserCreateRequest, UserUpdate, LoginRequest } from "types/user"

export interface UserHandlers {
    userService: IUserService
}

export function createUserHandlers(userService: IUserService): UserHandlers {
    return { userService }
}

// Get all users
export async function getUsersHandler(
    this: UserHandlers,
    request: FastifyRequest,
    reply: FastifyReply,
) {
    try {
        const users = await this.userService.getUsers()
        return { users }
    } catch (error) {
        request.log.error(error, "Failed to get users")
        return reply.code(500).send({ error: "Failed to get users" })
    }
}

// Get user by ID
export async function getUserByIdHandler(
    this: UserHandlers,
    request: FastifyRequest<{
        Params: { id: string }
    }>,
    reply: FastifyReply,
) {
    try {
        const user = await this.userService.getUserById(request.params.id)

        if (!user) {
            return reply.code(404).send({ error: "User not found" })
        }

        return { user }
    } catch (error) {
        request.log.error(error, "Failed to get user")
        return reply.code(500).send({ error: "Failed to get user" })
    }
}

// Create user
export async function createUserHandler(
    this: UserHandlers,
    request: FastifyRequest<{
        Body: UserCreateRequest
    }>,
    reply: FastifyReply,
) {
    try {
        const user = await this.userService.createUser(request.body)
        return reply.code(201).send({ user })
    } catch (error) {
        request.log.error(error, "Failed to create user")

        if (
            error instanceof Error &&
            error.message.includes("unique constraint")
        ) {
            return reply
                .code(409)
                .send({ error: "User with this email already exists" })
        }

        return reply.code(500).send({ error: "Failed to create user" })
    }
}

// Update user
export async function updateUserHandler(
    this: UserHandlers,
    request: FastifyRequest<{
        Params: { id: string }
        Body: UserUpdate
    }>,
    reply: FastifyReply,
) {
    try {
        const user = await this.userService.updateUser(
            request.params.id,
            request.body,
        )
        return { user }
    } catch (error) {
        request.log.error(error, "Failed to update user")
        return reply.code(500).send({ error: "Failed to update user" })
    }
}

// Delete user
export async function deleteUserHandler(
    this: UserHandlers,
    request: FastifyRequest<{
        Params: { id: string }
    }>,
    reply: FastifyReply,
) {
    try {
        await this.userService.deleteUser(request.params.id)
        return { message: "User deleted successfully" }
    } catch (error) {
        request.log.error(error, "Failed to delete user")
        return reply.code(500).send({ error: "Failed to delete user" })
    }
}

// Login
export async function loginHandler(
    this: UserHandlers,
    request: FastifyRequest<{
        Body: LoginRequest
    }>,
    reply: FastifyReply,
) {
    try {
        const result = await this.userService.login(
            request.body,
            request.headers["user-agent"],
            request.ip,
        )
        return result
    } catch (error) {
        request.log.error(error, "Failed to login")

        if (error instanceof Error && error.message === "Invalid credentials") {
            return reply.code(401).send({ error: "Invalid credentials" })
        }

        return reply.code(500).send({ error: "Login failed" })
    }
}

// Get current user (me)
export async function getMeHandler(
    this: UserHandlers,
    request: FastifyRequest,
    reply: FastifyReply,
) {
    try {
        if (!request.user) {
            return reply.code(401).send({ error: "Not authenticated" })
        }

        const user = await this.userService.getUserById(request.user.id)

        if (!user) {
            return reply.code(404).send({ error: "User not found" })
        }

        return { user }
    } catch (error) {
        request.log.error(error, "Failed to get current user")
        return reply.code(500).send({ error: "Failed to get current user" })
    }
}

// Logout
export async function logoutHandler(
    this: UserHandlers,
    request: FastifyRequest,
    reply: FastifyReply,
) {
    try {
        if (!request.user) {
            return reply.code(401).send({ error: "Not authenticated" })
        }

        await this.userService.logout(request.user.sessionId)
        return { message: "Logged out successfully" }
    } catch (error) {
        request.log.error(error, "Failed to logout")
        return reply.code(500).send({ error: "Logout failed" })
    }
}

// Logout all sessions
export async function logoutAllHandler(
    this: UserHandlers,
    request: FastifyRequest,
    reply: FastifyReply,
) {
    try {
        if (!request.user) {
            return reply.code(401).send({ error: "Not authenticated" })
        }

        await this.userService.logoutAll(request.user.id)
        return { message: "Logged out from all devices successfully" }
    } catch (error) {
        request.log.error(error, "Failed to logout all")
        return reply.code(500).send({ error: "Logout all failed" })
    }
}

// Change password
export async function changePasswordHandler(
    this: UserHandlers,
    request: FastifyRequest<{
        Body: {
            currentPassword: string
            newPassword: string
        }
    }>,
    reply: FastifyReply,
) {
    try {
        if (!request.user) {
            return reply.code(401).send({ error: "Not authenticated" })
        }

        await this.userService.changePassword(
            request.user.id,
            request.body.currentPassword,
            request.body.newPassword,
        )

        return { message: "Password changed successfully" }
    } catch (error) {
        request.log.error(error, "Failed to change password")

        if (
            error instanceof Error &&
            error.message === "Current password is incorrect"
        ) {
            return reply
                .code(400)
                .send({ error: "Current password is incorrect" })
        }

        return reply.code(500).send({ error: "Failed to change password" })
    }
}
