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
    constructor(private readonly prisma: PrismaClient) {}

    async getUserById(id: string): Promise<UserWithSessions | null> {
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
    }

    async getUserByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
        })
    }

    async createUser(user: UserCreate): Promise<UserCreateResponse> {
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
    }

    async deleteUser(id: string): Promise<void> {
        await this.prisma.user.delete({
            where: { id },
        })
    }

    async getUsers(): Promise<UserWithSessions[]> {
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
    }

    async updateUser(id: string, user: UserUpdate): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data: user,
        })
    }

    async authenticateUser(
        email: string,
        password: string,
    ): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { email },
        })

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return null
        }

        return user
    }

    async createSession(
        userId: string,
        sessionId: string,
        expiresAt: Date,
        userAgent?: string,
        ipAddress?: string,
    ): Promise<UserSession> {
        return this.prisma.userSession.create({
            data: {
                token: sessionId,
                userId,
                expiresAt,
                userAgent,
                ipAddress,
            },
        })
    }

    async getSessionWithUser(
        sessionId: string,
    ): Promise<(UserSession & { user: User }) | null> {
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
    }

    async deactivateSession(sessionId: string): Promise<void> {
        await this.prisma.userSession.update({
            where: { id: sessionId },
            data: { isActive: false },
        })
    }

    async deactivateAllUserSessions(userId: string): Promise<void> {
        await this.prisma.userSession.updateMany({
            where: { userId },
            data: { isActive: false },
        })
    }

    async updateLastLogin(userId: string): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: { lastLoginAt: new Date() },
        })
    }
}

export default function getUserPool(prisma: PrismaClient): UserPool {
    return new UserPoolImpl(prisma)
}
