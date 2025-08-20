import { Type } from "@sinclair/typebox"

// User response schema
export const UserSchema = Type.Object({
    id: Type.String(),
    email: Type.String({ format: "email" }),
    firstName: Type.String(),
    lastName: Type.String(),
    role: Type.Union([
        Type.Literal("ADMIN"),
        Type.Literal("RECRUITER"),
        Type.Literal("READONLY"),
    ]),
    lastLoginAt: Type.Union([
        Type.String({ format: "date-time" }),
        Type.Null(),
    ]),
    createdAt: Type.String({ format: "date-time" }),
    updatedAt: Type.String({ format: "date-time" }),
    companyId: Type.Union([Type.String(), Type.Null()]),
})

// User session schema
export const UserSessionSchema = Type.Object({
    id: Type.String(),
    isActive: Type.Boolean(),
    expiresAt: Type.String({ format: "date-time" }),
    userAgent: Type.Union([Type.String(), Type.Null()]),
    ipAddress: Type.Union([Type.String(), Type.Null()]),
    createdAt: Type.String({ format: "date-time" }),
})

// User with sessions schema
export const UserWithSessionsSchema = Type.Intersect([
    UserSchema,
    Type.Object({
        sessions: Type.Array(UserSessionSchema),
    }),
])

// Create user request schema
export const CreateUserRequestSchema = Type.Object({
    email: Type.String({ format: "email" }),
    firstName: Type.String({ minLength: 1 }),
    lastName: Type.String({ minLength: 1 }),
    password: Type.String({ minLength: 6 }),
    role: Type.Optional(
        Type.Union([
            Type.Literal("ADMIN"),
            Type.Literal("RECRUITER"),
            Type.Literal("READONLY"),
        ]),
    ),
    companyId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
})

// Create user response schema
export const CreateUserResponseSchema = Type.Object({
    id: Type.String(),
    email: Type.String(),
    firstName: Type.String(),
    lastName: Type.String(),
    role: Type.Union([
        Type.Literal("ADMIN"),
        Type.Literal("RECRUITER"),
        Type.Literal("READONLY"),
    ]),
    companyId: Type.Union([Type.String(), Type.Null()]),
    createdAt: Type.String({ format: "date-time" }),
})

// Update user request schema
export const UpdateUserRequestSchema = Type.Object({
    email: Type.Optional(Type.String({ format: "email" })),
    firstName: Type.Optional(Type.String({ minLength: 1 })),
    lastName: Type.Optional(Type.String({ minLength: 1 })),
    role: Type.Optional(
        Type.Union([
            Type.Literal("ADMIN"),
            Type.Literal("RECRUITER"),
            Type.Literal("READONLY"),
        ]),
    ),

    companyId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
})

// Login request schema
export const LoginRequestSchema = Type.Object({
    email: Type.String({ format: "email" }),
    password: Type.String({ minLength: 1 }),
})

// Login response schema
export const LoginResponseSchema = Type.Object({
    token: Type.String(),
    user: Type.Object({
        id: Type.String(),
        email: Type.String(),
        firstName: Type.String(),
        lastName: Type.String(),
        role: Type.Union([
            Type.Literal("ADMIN"),
            Type.Literal("RECRUITER"),
            Type.Literal("READONLY"),
        ]),
        companyId: Type.Union([Type.String(), Type.Null()]),
    }),
})

// Change password request schema
export const ChangePasswordRequestSchema = Type.Object({
    currentPassword: Type.String({ minLength: 1 }),
    newPassword: Type.String({ minLength: 6 }),
})

// Generic response schemas
export const SuccessResponseSchema = Type.Object({
    message: Type.String(),
})

export const ErrorResponseSchema = Type.Object({
    error: Type.String(),
})
