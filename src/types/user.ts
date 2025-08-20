import { UserRole } from "@prisma/client"

export interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    passwordHash: string
    role: UserRole
    lastLoginAt: Date | null
    createdAt: Date
    updatedAt: Date
    companyId: string | null
}

export interface UserCreate {
    email: string
    firstName: string
    lastName: string
    passwordHash: string
    role?: UserRole
    companyId?: string | null
}

export interface UserCreateRequest {
    email: string
    firstName: string
    lastName: string
    password: string
    role?: UserRole
    companyId?: string | null
}

export interface UserCreateResponse {
    id: string
    email: string
    firstName: string
    lastName: string
    role: UserRole
    companyId: string | null
    createdAt: Date
}

export interface UserUpdate {
    email?: string
    firstName?: string
    lastName?: string
    role?: UserRole
    companyId?: string | null
}

export interface UserWithSessions {
    id: string
    email: string
    firstName: string
    lastName: string
    role: UserRole
    lastLoginAt: Date | null
    createdAt: Date
    updatedAt: Date
    companyId: string | null
    sessions: UserSession[]
}

export interface UserSession {
    id: string
    token: string
    isActive: boolean
    expiresAt: Date
    userAgent: string | null
    ipAddress: string | null
    createdAt: Date
}

export interface LoginRequest {
    email: string
    password: string
}

export interface LoginResponse {
    token: string
    user: {
        id: string
        email: string
        firstName: string
        lastName: string
        role: UserRole
        companyId: string | null
    }
}

export interface AuthenticatedUser {
    id: string
    email: string
    firstName: string
    lastName: string
    role: UserRole
    companyId: string | null
    sessionId: string
}
