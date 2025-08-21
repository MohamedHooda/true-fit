import { Type } from "@sinclair/typebox"

// Company response schema (for use in branch responses)
export const CompanySchema = Type.Object({
    id: Type.String(),
    name: Type.String(),
    description: Type.Union([Type.String(), Type.Null()]),
    website: Type.Union([Type.String(), Type.Null()]),
    email: Type.Union([Type.String({ format: "email" }), Type.Null()]),
    phone: Type.Union([Type.String(), Type.Null()]),
    address: Type.Union([Type.String(), Type.Null()]),
    createdAt: Type.String({ format: "date-time" }),
    updatedAt: Type.String({ format: "date-time" }),
})

// Branch response schema
export const BranchSchema = Type.Object({
    id: Type.String(),
    name: Type.String(),
    city: Type.Union([Type.String(), Type.Null()]),
    country: Type.Union([Type.String(), Type.Null()]),
    address: Type.Union([Type.String(), Type.Null()]),
    email: Type.Union([Type.String({ format: "email" }), Type.Null()]),
    phone: Type.Union([Type.String(), Type.Null()]),
    createdAt: Type.String({ format: "date-time" }),
    updatedAt: Type.String({ format: "date-time" }),
    companyId: Type.String(),
})

// Branch with company schema
export const BranchWithCompanySchema = Type.Intersect([
    BranchSchema,
    Type.Object({
        company: CompanySchema,
    }),
])

// Create branch request schema
export const CreateBranchRequestSchema = Type.Object({
    name: Type.String({ minLength: 1 }),
    city: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    country: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    address: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    email: Type.Optional(
        Type.Union([Type.String({ format: "email" }), Type.Null()]),
    ),
    phone: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    companyId: Type.String(),
})

// Create branch response schema
export const CreateBranchResponseSchema = Type.Object({
    id: Type.String(),
    name: Type.String(),
    city: Type.Union([Type.String(), Type.Null()]),
    country: Type.Union([Type.String(), Type.Null()]),
    address: Type.Union([Type.String(), Type.Null()]),
    email: Type.Union([Type.String({ format: "email" }), Type.Null()]),
    phone: Type.Union([Type.String(), Type.Null()]),
    createdAt: Type.String({ format: "date-time" }),
    companyId: Type.String(),
})

// Update branch request schema
export const UpdateBranchRequestSchema = Type.Object({
    name: Type.Optional(Type.String({ minLength: 1 })),
    city: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    country: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    address: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    email: Type.Optional(
        Type.Union([Type.String({ format: "email" }), Type.Null()]),
    ),
    phone: Type.Optional(Type.Union([Type.String(), Type.Null()])),
})

// Generic response schemas
export const SuccessResponseSchema = Type.Object({
    message: Type.String(),
})

export const ErrorResponseSchema = Type.Object({
    error: Type.String(),
})
