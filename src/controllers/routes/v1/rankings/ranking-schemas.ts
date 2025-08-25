import { Type } from "@sinclair/typebox"

// Ranking calculation schemas
export const RankingCalculationRequestSchema = Type.Object({
    jobId: Type.String({ format: "uuid" }),
    triggerEvent: Type.String(),
})

export const RankingCalculationResultSchema = Type.Object({
    jobId: Type.String(),
    totalCandidates: Type.Number(),
    calculationDuration: Type.Number(),
    scoringConfigVersion: Type.String(),
})

// Bulk ranking schemas
export const BulkRankingRequestSchema = Type.Object({
    jobIds: Type.Array(Type.String({ format: "uuid" })),
    triggerEvent: Type.String(),
    priority: Type.Union([Type.Literal("high"), Type.Literal("normal")]),
})

// Invalidation schemas
export const InvalidationRequestSchema = Type.Object({
    jobIds: Type.Optional(Type.Array(Type.String({ format: "uuid" }))),
    scoringConfigVersion: Type.Optional(Type.String()),
    olderThan: Type.Optional(Type.String({ format: "date-time" })),
    triggerEvent: Type.String(),
})

// Error response schema
export const ErrorResponseSchema = Type.Object({
    error: Type.String(),
    message: Type.String(),
    statusCode: Type.Number(),
})
