import { Type } from "@sinclair/typebox"

// Candidate ranking schema
export const CandidateRankingSchema = Type.Object({
    id: Type.String({ format: "uuid" }),
    jobId: Type.String({ format: "uuid" }),
    applicantId: Type.String({ format: "uuid" }),
    assessmentId: Type.String({ format: "uuid" }),
    rank: Type.Integer({ minimum: 1 }),
    score: Type.Number(),
    maxPossibleScore: Type.Number(),
    percentage: Type.Number({ minimum: 0, maximum: 100 }),
    correctAnswers: Type.Integer({ minimum: 0 }),
    incorrectAnswers: Type.Integer({ minimum: 0 }),
    recencyBonus: Type.Optional(Type.Number()),
    scoringConfigVersion: Type.String(),
    calculatedAt: Type.String({ format: "date-time" }),
    isStale: Type.Boolean(),
})

// Candidate with details schema
export const CandidateRankingWithDetailsSchema = Type.Intersect([
    CandidateRankingSchema,
    Type.Object({
        applicant: Type.Object({
            id: Type.String({ format: "uuid" }),
            email: Type.String({ format: "email" }),
            firstName: Type.String(),
            lastName: Type.String(),
            phone: Type.Optional(Type.Union([Type.String(), Type.Null()])),
            city: Type.Optional(Type.Union([Type.String(), Type.Null()])),
            country: Type.Optional(Type.Union([Type.String(), Type.Null()])),
        }),
        job: Type.Object({
            id: Type.String({ format: "uuid" }),
            title: Type.String(),
            branch: Type.Object({
                id: Type.String({ format: "uuid" }),
                name: Type.String(),
                company: Type.Object({
                    id: Type.String({ format: "uuid" }),
                    name: Type.String(),
                }),
            }),
        }),
        assessment: Type.Object({
            id: Type.String({ format: "uuid" }),
            submittedAt: Type.String({ format: "date-time" }),
        }),
    }),
])

// Ranking metadata schema
export const RankingMetadataSchema = Type.Object({
    totalCandidates: Type.Integer({ minimum: 0 }),
    lastCalculatedAt: Type.Union([
        Type.String({ format: "date-time" }),
        Type.Null(),
    ]),
    calculationDuration: Type.Union([
        Type.Integer({ minimum: 0 }),
        Type.Null(),
    ]),
    status: Type.Union([
        Type.Literal("CALCULATING"),
        Type.Literal("COMPLETED"),
        Type.Literal("STALE"),
        Type.Literal("ERROR"),
    ]),
})

// Top candidates response schema
export const TopCandidatesResponseSchema = Type.Object({
    jobId: Type.String({ format: "uuid" }),
    candidates: Type.Array(CandidateRankingWithDetailsSchema),
    metadata: RankingMetadataSchema,
})

// Ranking calculation request schema
export const RankingCalculationRequestSchema = Type.Object({
    jobId: Type.String({ format: "uuid" }),
    triggerEvent: Type.String(),
    forceRecalculation: Type.Optional(Type.Boolean()),
})

// Ranking calculation result schema
export const RankingCalculationResultSchema = Type.Object({
    jobId: Type.String({ format: "uuid" }),
    totalCandidates: Type.Integer({ minimum: 0 }),
    calculationDuration: Type.Integer({ minimum: 0 }),
    scoringConfigVersion: Type.String(),
})

// Job ranking status schema
export const JobRankingStatusSchema = Type.Object({
    jobId: Type.String({ format: "uuid" }),
    status: Type.Union([
        Type.Literal("CALCULATING"),
        Type.Literal("COMPLETED"),
        Type.Literal("STALE"),
        Type.Literal("ERROR"),
    ]),
    totalCandidates: Type.Integer({ minimum: 0 }),
    lastCalculatedAt: Type.Union([
        Type.String({ format: "date-time" }),
        Type.Null(),
    ]),
    isStale: Type.Boolean(),
    errorMessage: Type.Optional(Type.Union([Type.String(), Type.Null()])),
})

// Bulk ranking request schema
export const BulkRankingRequestSchema = Type.Object({
    jobIds: Type.Array(Type.String({ format: "uuid" }), {
        minItems: 1,
        maxItems: 50,
    }),
    triggerEvent: Type.String(),
    priority: Type.Union([Type.Literal("high"), Type.Literal("normal")]),
})

// Query parameters for top candidates
export const TopCandidatesQuerySchema = Type.Object({
    limit: Type.Optional(
        Type.Integer({ minimum: 1, maximum: 100, default: 5 }),
    ),
})

// Query parameters for job ranking status
export const JobRankingStatusQuerySchema = Type.Object({
    includeMetrics: Type.Optional(Type.Boolean()),
})

// Invalidation request schema
export const InvalidationRequestSchema = Type.Object({
    jobId: Type.Optional(Type.String({ format: "uuid" })),
    scoringConfigId: Type.Optional(Type.String({ format: "uuid" })),
    applicantId: Type.Optional(Type.String({ format: "uuid" })),
    triggerEvent: Type.String(),
})

// Error response schema
export const ErrorResponseSchema = Type.Object({
    error: Type.String(),
    message: Type.String(),
    statusCode: Type.Integer(),
    details: Type.Optional(Type.Object({})),
})

// Route parameter schemas
export const JobIdParamSchema = Type.Object({
    jobId: Type.String({ format: "uuid" }),
})

export const ApplicantIdParamSchema = Type.Object({
    applicantId: Type.String({ format: "uuid" }),
})

// Combined params schema
export const JobApplicantParamsSchema = Type.Object({
    jobId: Type.String({ format: "uuid" }),
    applicantId: Type.String({ format: "uuid" }),
})
