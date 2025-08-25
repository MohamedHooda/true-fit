import { Type } from "@sinclair/typebox"

// Base Scoring Config Schema
export const ScoringConfigSchema = Type.Object({
    id: Type.String(),
    negativeMarkingFraction: Type.Number(),
    recencyWindowDays: Type.Union([Type.Number(), Type.Null()]),
    recencyBoostPercent: Type.Union([Type.Number(), Type.Null()]),
    isDefault: Type.Boolean(),
    jobId: Type.Union([Type.String(), Type.Null()]),
    createdAt: Type.String({ format: "date-time" }),
    updatedAt: Type.String({ format: "date-time" }),
})

// Scoring Config with Details Schema
export const ScoringConfigWithDetailsSchema = Type.Object({
    ...ScoringConfigSchema.properties,
    job: Type.Union([
        Type.Object({
            id: Type.String(),
            title: Type.String(),
            branch: Type.Object({
                id: Type.String(),
                name: Type.String(),
                company: Type.Object({
                    id: Type.String(),
                    name: Type.String(),
                }),
            }),
        }),
        Type.Null(),
    ]),
})

// Create Scoring Config Request Schema
export const CreateScoringConfigRequestSchema = Type.Object({
    negativeMarkingFraction: Type.Number(),
    recencyWindowDays: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
    recencyBoostPercent: Type.Optional(
        Type.Union([Type.Number(), Type.Null()]),
    ),
    isDefault: Type.Optional(Type.Boolean()),
    jobId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
})

// Update Scoring Config Request Schema
export const UpdateScoringConfigRequestSchema = Type.Object({
    negativeMarkingFraction: Type.Optional(Type.Number()),
    recencyWindowDays: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
    recencyBoostPercent: Type.Optional(
        Type.Union([Type.Number(), Type.Null()]),
    ),
    isDefault: Type.Optional(Type.Boolean()),
})

// Scoring Preview Schema
export const ScoringPreviewSchema = Type.Object({
    currentConfig: Type.Object({
        score: Type.Number(),
        rank: Type.Number(),
        totalCandidates: Type.Number(),
    }),
    newConfig: Type.Object({
        score: Type.Number(),
        rank: Type.Number(),
        totalCandidates: Type.Number(),
    }),
    changes: Type.Object({
        scoreChange: Type.Number(),
        rankChange: Type.Number(),
        explanation: Type.Array(Type.String()),
    }),
})

// Success Response Schema
export const SuccessResponseSchema = Type.Object({
    success: Type.Boolean(),
    message: Type.String(),
})

// Error Response Schema
export const ErrorResponseSchema = Type.Object({
    error: Type.String(),
    message: Type.String(),
    statusCode: Type.Number(),
})
