import { Type } from "@sinclair/typebox"

// Company response schema
export const CompanySchema = Type.Object({
    id: Type.String(),
    name: Type.String(),
    description: Type.Union([Type.String(), Type.Null()]),
    website: Type.Union([Type.String(), Type.Null()]),
    email: Type.Union([Type.String(), Type.Null()]),
    phone: Type.Union([Type.String(), Type.Null()]),
    address: Type.Union([Type.String(), Type.Null()]),
    createdAt: Type.String({ format: "date-time" }),
    updatedAt: Type.String({ format: "date-time" }),
})

// Branch response schema (for use in company responses)
export const BranchSchema = Type.Object({
    id: Type.String(),
    name: Type.String(),
    city: Type.Union([Type.String(), Type.Null()]),
    country: Type.Union([Type.String(), Type.Null()]),
    address: Type.Union([Type.String(), Type.Null()]),
    email: Type.Union([Type.String(), Type.Null()]),
    phone: Type.Union([Type.String(), Type.Null()]),
    createdAt: Type.String({ format: "date-time" }),
    updatedAt: Type.String({ format: "date-time" }),
    companyId: Type.String(),
})

// Company with branches schema
export const CompanyWithBranchesSchema = Type.Intersect([
    CompanySchema,
    Type.Object({
        branches: Type.Array(BranchSchema),
    }),
])

// Branch create request schema (for creating branches within company)
export const BranchCreateRequestSchema = Type.Object({
    name: Type.String({ minLength: 1 }),
    city: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    country: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    address: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    email: Type.Optional(
        Type.Union([Type.String({ format: "email" }), Type.Null()]),
    ),
    phone: Type.Optional(Type.Union([Type.String(), Type.Null()])),
})

// Create company request schema
export const CreateCompanyRequestSchema = Type.Object({
    name: Type.String({ minLength: 1 }),
    description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    website: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    email: Type.Optional(
        Type.Union([Type.String({ format: "email" }), Type.Null()]),
    ),
    phone: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    address: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    branches: Type.Optional(Type.Array(BranchCreateRequestSchema)),
})

// Branch create response schema (for responses)
export const BranchCreateResponseSchema = Type.Object({
    id: Type.String(),
    name: Type.String(),
    city: Type.Union([Type.String(), Type.Null()]),
    country: Type.Union([Type.String(), Type.Null()]),
    address: Type.Union([Type.String(), Type.Null()]),
    email: Type.Union([Type.String(), Type.Null()]),
    phone: Type.Union([Type.String(), Type.Null()]),
    createdAt: Type.String({ format: "date-time" }),
    companyId: Type.String(),
})

// Create company response schema
export const CreateCompanyResponseSchema = Type.Object({
    id: Type.String(),
    name: Type.String(),
    description: Type.Union([Type.String(), Type.Null()]),
    website: Type.Union([Type.String(), Type.Null()]),
    email: Type.Union([Type.String(), Type.Null()]),
    phone: Type.Union([Type.String(), Type.Null()]),
    address: Type.Union([Type.String(), Type.Null()]),
    createdAt: Type.String({ format: "date-time" }),
    branches: Type.Array(BranchCreateResponseSchema),
})

// Update company request schema
export const UpdateCompanyRequestSchema = Type.Object({
    name: Type.Optional(Type.String({ minLength: 1 })),
    description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    website: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    email: Type.Optional(
        Type.Union([Type.String({ format: "email" }), Type.Null()]),
    ),
    phone: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    address: Type.Optional(Type.Union([Type.String(), Type.Null()])),
})

// Generic response schemas
export const SuccessResponseSchema = Type.Object({
    message: Type.String(),
})

export const ErrorResponseSchema = Type.Object({
    error: Type.String(),
})
