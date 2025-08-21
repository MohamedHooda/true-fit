import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import {
    User,
    UserCreate,
    UserCreateResponse,
    UserUpdate,
    UserWithSessions,
    UserSession,
} from "types/user"
import { Logger } from "types/logging"
import { handleDBError } from "helpers/serviceError"

export interface UserPool {
    /**
     * Get a user by ID
     * @param {string} id - The ID of the user to get
     * @returns {Promise<UserWithSessions | null>} - The user with sessions
     */
    getUserById(id: string): Promise<UserWithSessions | null>

    /**
     * Get a user by email
     * @param {string} email - The email of the user to get
     * @returns {Promise<User | null>} - The user
     */
    getUserByEmail(email: string): Promise<User | null>

    /**
     * Create a user
     * @param {UserCreate} user - The user to create
     * @returns {Promise<UserCreateResponse>} - The created user
     */
    createUser(user: UserCreate): Promise<UserCreateResponse>

    /**
     * Delete a user
     * @param {string} id - The ID of the user to delete
     * @returns {Promise<void>}
     */
    deleteUser(id: string): Promise<void>

    /**
     * Get all users
     * @returns {Promise<UserWithSessions[]>} - The users
     */
    getUsers(): Promise<UserWithSessions[]>

    /**
     * Update a user
     * @param {string} id - The ID of the user to update
     * @param {UserUpdate} user - The user data to update
     * @returns {Promise<User>} - The updated user
     */
    updateUser(id: string, user: UserUpdate): Promise<User>

    /**
     * Authenticate user credentials
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<User | null>} - The authenticated user or null
     */
    authenticateUser(email: string, password: string): Promise<User | null>

    /**
     * Create a user session
     * @param {string} userId - The user ID
     * @param {string} sessionId - The session ID
     * @param {Date} expiresAt - Session expiration
     * @param {string} userAgent - User agent string
     * @param {string} ipAddress - User IP address
     * @returns {Promise<UserSession>} - The created session
     */
    createSession(
        userId: string,
        sessionId: string,
        expiresAt: Date,
        userAgent?: string,
        ipAddress?: string,
    ): Promise<UserSession>

    /**
     * Get session by token/ID
     * @param {string} sessionId - The session ID
     * @returns {Promise<UserSession & { user: User } | null>} - The session with user
     */
    getSessionWithUser(
        sessionId: string,
    ): Promise<(UserSession & { user: User }) | null>

    /**
     * Deactivate a session
     * @param {string} sessionId - The session ID to deactivate
     * @returns {Promise<void>}
     */
    deactivateSession(sessionId: string): Promise<void>

    /**
     * Deactivate all sessions for a user
     * @param {string} userId - The user ID
     * @returns {Promise<void>}
     */
    deactivateAllUserSessions(userId: string): Promise<void>

    /**
     * Update last login time
     * @param {string} userId - The user ID
     * @returns {Promise<void>}
     */
    updateLastLogin(userId: string): Promise<void>
}

class UserPoolImpl implements UserPool {
    constructor(
        private readonly prisma: PrismaClient,
        private readonly logger: Logger,
    ) {}

    async getUserById(id: string): Promise<UserWithSessions | null> {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id },
                include: {
                    sessions: {
                        where: { isActive: true },
                        orderBy: { createdAt: "desc" },
                    },
                },
            })

            return user
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getUserByEmail(email: string): Promise<User | null> {
        try {
            return this.prisma.user.findUnique({
                where: { email },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async createUser(user: UserCreate): Promise<UserCreateResponse> {
        try {
            const created = await this.prisma.user.create({
                data: user,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    companyId: true,
                    createdAt: true,
                },
            })

            return created
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async deleteUser(id: string): Promise<void> {
        try {
            await this.prisma.user.delete({
                where: { id },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getUsers(): Promise<UserWithSessions[]> {
        try {
            return this.prisma.user.findMany({
                include: {
                    sessions: {
                        where: { isActive: true },
                        orderBy: { createdAt: "desc" },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: 50,
                skip: 0,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async updateUser(id: string, user: UserUpdate): Promise<User> {
        try {
            return this.prisma.user.update({
                where: { id },
                data: user,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async authenticateUser(
        email: string,
        password: string,
    ): Promise<User | null> {
        try {
            const user = await this.prisma.user.findUnique({
                where: { email },
            })

            if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
                return null
            }

            return user
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async createSession(
        userId: string,
        sessionId: string,
        expiresAt: Date,
        userAgent?: string,
        ipAddress?: string,
    ): Promise<UserSession> {
        try {
            return this.prisma.userSession.create({
                data: {
                    token: sessionId,
                    userId,
                    expiresAt,
                    userAgent,
                    ipAddress,
                },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getSessionWithUser(
        sessionId: string,
    ): Promise<(UserSession & { user: User }) | null> {
        try {
            return this.prisma.userSession.findFirst({
                where: {
                    token: sessionId,
                    isActive: true,
                    expiresAt: { gt: new Date() },
                },
                include: {
                    user: true,
                },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async deactivateSession(sessionId: string): Promise<void> {
        try {
            await this.prisma.userSession.update({
                where: { id: sessionId },
                data: { isActive: false },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async deactivateAllUserSessions(userId: string): Promise<void> {
        try {
            await this.prisma.userSession.updateMany({
                where: { userId },
                data: { isActive: false },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async updateLastLogin(userId: string): Promise<void> {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: { lastLoginAt: new Date() },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }
}

export default function getUserPool(
    prisma: PrismaClient,
    logger: Logger,
): UserPool {
    return new UserPoolImpl(prisma, logger)
}
