import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { randomUUID } from "crypto"
import {
    User,
    UserCreateRequest,
    UserCreateResponse,
    UserUpdate,
    UserWithSessions,
    LoginRequest,
    LoginResponse,
    AuthenticatedUser,
} from "types/user"
import { UserPool } from "persistence/db/pool/users"
import { ITrueFitEventRelaying } from "services/events"
import { ServiceError, ServiceErrorType } from "types/serviceError"

export interface IUserService {
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
     * @param {UserCreateRequest} user - The user to create
     * @returns {Promise<UserCreateResponse>} - The created user
     */
    createUser(user: UserCreateRequest): Promise<UserCreateResponse>

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
     * Login user with email and password
     * @param {LoginRequest} credentials - Login credentials
     * @param {string} userAgent - User agent string
     * @param {string} ipAddress - User IP address
     * @returns {Promise<LoginResponse>} - Login response with token
     */
    login(
        credentials: LoginRequest,
        userAgent?: string,
        ipAddress?: string,
    ): Promise<LoginResponse>

    /**
     * Verify JWT token and return user
     * @param {string} token - JWT token
     * @returns {Promise<AuthenticatedUser>} - Authenticated user info
     */
    verifyToken(token: string): Promise<AuthenticatedUser>

    /**
     * Logout user (deactivate session)
     * @param {string} sessionId - Session ID to logout
     * @returns {Promise<void>}
     */
    logout(sessionId: string): Promise<void>

    /**
     * Logout all sessions for a user
     * @param {string} userId - User ID
     * @returns {Promise<void>}
     */
    logoutAll(userId: string): Promise<void>

    /**
     * Change user password
     * @param {string} userId - User ID
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise<void>}
     */
    changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string,
    ): Promise<void>
}

class UserService implements IUserService {
    constructor(
        private readonly pool: UserPool,
        private readonly events: ITrueFitEventRelaying,
    ) {}

    async getUserById(id: string): Promise<UserWithSessions | null> {
        return this.pool.getUserById(id)
    }

    async getUserByEmail(email: string): Promise<User | null> {
        return this.pool.getUserByEmail(email)
    }

    async createUser(user: UserCreateRequest): Promise<UserCreateResponse> {
        // Hash the password
        const passwordHash = await bcrypt.hash(user.password, 12)

        // Create user without password in request
        const { password, ...userData } = user
        const userToCreate = {
            ...userData,
            passwordHash,
        }

        const createdUser = await this.pool.createUser(userToCreate)

        return createdUser
    }

    async deleteUser(id: string): Promise<void> {
        // Get user before deletion for event
        const user = await this.pool.getUserById(id)

        await this.pool.deleteUser(id)

        if (user) {
            // Emit user deleted event
            // await this.events.dispatchEvent({
            //     type: "USER_DELETED",
            //     payload: {
            //         userId: id,
            //         email: user.email,
            //     }
            // })
        }
    }

    async getUsers(): Promise<UserWithSessions[]> {
        return this.pool.getUsers()
    }

    async updateUser(id: string, user: UserUpdate): Promise<User> {
        const updatedUser = await this.pool.updateUser(id, user)

        // Emit user updated event

        // await this.events.dispatchEvent({
        //     type: "USER_UPDATED",
        //     payload: {
        //         userId: id,
        //         changes: user,
        //     }
        // })

        return updatedUser
    }

    async login(
        credentials: LoginRequest,
        userAgent?: string,
        ipAddress?: string,
    ): Promise<LoginResponse> {
        const { email, password } = credentials

        // Authenticate user
        const user = await this.pool.authenticateUser(email, password)
        if (!user) {
            throw new ServiceError(
                ServiceErrorType.Forbidden,
                "Invalid credentials",
            )
        }

        // Create session
        const sessionId = randomUUID()
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

        await this.pool.createSession(
            user.id,
            sessionId,
            expiresAt,
            userAgent,
            ipAddress,
        )

        // Create JWT token
        const tokenPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
            jti: sessionId, // JWT ID for session tracking
        }

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET!, {
            expiresIn: "7d",
        })

        // Update last login
        await this.pool.updateLastLogin(user.id)

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                companyId: user.companyId,
            },
        }
    }

    async verifyToken(token: string): Promise<AuthenticatedUser> {
        try {
            // Verify JWT
            const payload = jwt.verify(token, process.env.JWT_SECRET!) as any

            console.log(payload)
            // Check session in database
            const session = await this.pool.getSessionWithUser(payload.jti)
            if (!session) {
                throw new ServiceError(
                    ServiceErrorType.Forbidden,
                    "Invalid or expired session",
                )
            }

            return {
                id: session.user.id,
                email: session.user.email,
                firstName: session.user.firstName,
                lastName: session.user.lastName,
                role: session.user.role,
                companyId: session.user.companyId,
                sessionId: session.id,
            }
        } catch (error) {
            console.log(error)
            throw new ServiceError(
                ServiceErrorType.Forbidden,
                "Invalid or expired token",
            )
        }
    }

    async logout(sessionId: string): Promise<void> {
        await this.pool.deactivateSession(sessionId)

        // Emit logout event

        // await this.events.dispatchEvent({
        //     type: "USER_LOGOUT",
        //     payload: {
        //         sessionId,
        //     }
        // })
    }

    async logoutAll(userId: string): Promise<void> {
        await this.pool.deactivateAllUserSessions(userId)

        // Emit logout all event

        // await this.events.dispatchEvent({
        //     type: "USER_LOGOUT_ALL",
        //     payload: {
        //         userId,
        //     }
        // })
    }

    async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string,
    ): Promise<void> {
        // Get user to verify they exist and get their email
        const userWithSessions = await this.pool.getUserById(userId)
        if (!userWithSessions) {
            throw new ServiceError(ServiceErrorType.NotFound, "User not found")
        }

        // Get user with password hash for verification
        const user = await this.pool.getUserByEmail(userWithSessions.email)
        if (!user) {
            throw new ServiceError(ServiceErrorType.NotFound, "User not found")
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(
            currentPassword,
            user.passwordHash,
        )
        if (!isCurrentPasswordValid) {
            throw new ServiceError(
                ServiceErrorType.Forbidden,
                "Current password is incorrect",
            )
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 12)

        // Update password
        await this.pool.updateUser(userId, {
            passwordHash: newPasswordHash,
        } as any)

        // Logout all sessions (force re-login)
        await this.pool.deactivateAllUserSessions(userId)

        // Emit password changed event

        // await this.events.dispatchEvent({
        //     type: "USER_PASSWORD_CHANGED",
        //     payload: {
        //         userId,
        //         email: user.email,
        //     }
        // })
    }
}

export default function getUserService(
    pool: UserPool,
    events: ITrueFitEventRelaying,
): IUserService {
    return new UserService(pool, events)
}
