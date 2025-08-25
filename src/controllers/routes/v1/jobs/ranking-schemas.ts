import { Type } from "@sinclair/typebox"
import { RankingStatus } from "@prisma/client"

// Common schemas
export const JobIdParamsSchema = Type.Object({
    jobId: Type.String({ format: "uuid" }),
})

export const ApplicantIdParamsSchema = Type.Object({
    applicantId: Type.String({ format: "uuid" }),
})

// Top candidates schemas
export const TopCandidatesQuerySchema = Type.Object({
    limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
})

export const CandidateRankingSchema = Type.Object({
    id: Type.String(),
    jobId: Type.String(),
    applicantId: Type.String(),
    assessmentId: Type.String(),
    rank: Type.Number(),
    score: Type.Number(),
    maxPossibleScore: Type.Number(),
    percentage: Type.Number(),
    correctAnswers: Type.Number(),
    incorrectAnswers: Type.Number(),
    recencyBonus: Type.Union([Type.Number(), Type.Null()]),
    scoringConfigVersion: Type.String(),
    calculatedAt: Type.String({ format: "date-time" }),
    isStale: Type.Boolean(),
})

export const CandidateRankingWithDetailsSchema = Type.Intersect([
    CandidateRankingSchema,
    Type.Object({
        applicant: Type.Object({
            id: Type.String(),
            firstName: Type.String(),
            lastName: Type.String(),
            email: Type.String(),
            phone: Type.Union([Type.String(), Type.Null()]),
            city: Type.Union([Type.String(), Type.Null()]),
            country: Type.Union([Type.String(), Type.Null()]),
        }),
        job: Type.Object({
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
        assessment: Type.Object({
            id: Type.String(),
            submittedAt: Type.String({ format: "date-time" }),
        }),
    }),
])

export const TopCandidatesResponseSchema = Type.Object({
    jobId: Type.String(),
    candidates: Type.Array(CandidateRankingWithDetailsSchema),
    metadata: Type.Object({
        totalCandidates: Type.Number(),
        lastCalculatedAt: Type.Union([
            Type.String({ format: "date-time" }),
            Type.Null(),
        ]),
        calculationDuration: Type.Union([Type.Number(), Type.Null()]),
        status: Type.Enum(RankingStatus),
    }),
})

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

// Job ranking status schemas
export const JobRankingStatusQuerySchema = Type.Object({
    includeMetrics: Type.Optional(Type.Boolean()),
})

export const JobRankingStatusSchema = Type.Object({
    jobId: Type.String(),
    status: Type.Enum(RankingStatus),
    totalCandidates: Type.Number(),
    lastCalculatedAt: Type.Union([
        Type.String({ format: "date-time" }),
        Type.Null(),
    ]),
    calculationDuration: Type.Union([Type.Number(), Type.Null()]),
    scoringConfigVersion: Type.String(),
    triggerEvent: Type.Union([Type.String(), Type.Null()]),
    errorMessage: Type.Union([Type.String(), Type.Null()]),
    metrics: Type.Optional(
        Type.Object({
            averageScore: Type.Number(),
            scoreDistribution: Type.Array(
                Type.Object({
                    range: Type.String(),
                    count: Type.Number(),
                    percentage: Type.Number(),
                }),
            ),
            recencyBoostStats: Type.Object({
                averageBonus: Type.Number(),
                maxBonus: Type.Number(),
                minBonus: Type.Number(),
            }),
        }),
    ),
})

// Error response schema
export const ErrorResponseSchema = Type.Object({
    error: Type.String(),
    message: Type.String(),
    statusCode: Type.Number(),
})
