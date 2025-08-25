import { Type } from "@sinclair/typebox"

// Base Assessment Schema
export const ApplicantAssessmentSchema = Type.Object({
    id: Type.String(),
    applicantId: Type.String(),
    templateId: Type.String(),
    submittedAt: Type.String({ format: "date-time" }),
})

// Assessment with Details Schema
export const ApplicantAssessmentWithDetailsSchema = Type.Object({
    ...ApplicantAssessmentSchema.properties,
    jobId: Type.String(),
    applicant: Type.Object({
        id: Type.String(),
        email: Type.String(),
        firstName: Type.String(),
        lastName: Type.String(),
        phone: Type.Union([Type.String(), Type.Null()]),
        city: Type.Union([Type.String(), Type.Null()]),
        country: Type.Union([Type.String(), Type.Null()]),
    }),
    job: Type.Union([
        Type.Object({
            id: Type.String(),
            title: Type.String(),
        }),
        Type.Null(),
    ]),
    template: Type.Object({
        id: Type.String(),
        name: Type.String(),
        description: Type.Union([Type.String(), Type.Null()]),
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
    }),
    answers: Type.Array(
        Type.Object({
            id: Type.String(),
            answer: Type.Union([Type.String(), Type.Null()]),
            isCorrect: Type.Boolean(),
            question: Type.Object({
                id: Type.String(),
                text: Type.String(),
                type: Type.String(),
                weight: Type.Number(),
                correctAnswer: Type.Union([Type.String(), Type.Null()]),
            }),
        }),
    ),
})

// Assessment Submission Schema
export const AssessmentSubmissionSchema = Type.Object({
    applicantId: Type.String(),
    templateId: Type.String(),
    jobId: Type.String(),
    answers: Type.Array(
        Type.Object({
            questionId: Type.String(),
            answer: Type.String(),
        }),
    ),
})

// Assessment Score Schema
export const AssessmentScoreSchema = Type.Object({
    assessmentId: Type.String(),
    applicantId: Type.String(),
    templateId: Type.String(),
    submittedAt: Type.String({ format: "date-time" }),
    scoredAt: Type.String({ format: "date-time" }),
    scoringConfigId: Type.String(),
    score: Type.Number(),
    maxPossibleScore: Type.Number(),
    percentage: Type.Number(),
    breakdown: Type.Object({
        correctAnswers: Type.Object({
            count: Type.Number(),
            points: Type.Number(),
        }),
        incorrectAnswers: Type.Object({
            count: Type.Number(),
            points: Type.Number(),
        }),
        recencyBonus: Type.Optional(
            Type.Object({
                percentage: Type.Number(),
                points: Type.Number(),
            }),
        ),
    }),
    explanation: Type.Array(Type.String()),
})

// Assessment Score with Details Schema
export const AssessmentScoreWithDetailsSchema = Type.Object({
    ...AssessmentScoreSchema.properties,
    assessment: ApplicantAssessmentWithDetailsSchema,
    scoringConfig: Type.Object({
        id: Type.String(),
        negativeMarkingFraction: Type.Number(),
        recencyWindowDays: Type.Union([Type.Number(), Type.Null()]),
        recencyBoostPercent: Type.Union([Type.Number(), Type.Null()]),
    }),
})

// Assessment Explanation Schema
export const AssessmentExplanationSchema = Type.Object({
    assessmentId: Type.String(),
    applicantId: Type.String(),
    templateId: Type.String(),
    submittedAt: Type.String({ format: "date-time" }),
    scoredAt: Type.String({ format: "date-time" }),
    scoringConfigId: Type.String(),
    config: Type.Object({
        negativeMarking: Type.Boolean(),
        negativeMarkingFraction: Type.Number(),
        recencyBoost: Type.Boolean(),
        recencyWindowDays: Type.Optional(Type.Number()),
        recencyBoostPercent: Type.Optional(Type.Number()),
    }),
    assessment: Type.Object({
        totalQuestions: Type.Number(),
        answeredQuestions: Type.Number(),
        correctAnswers: Type.Number(),
        incorrectAnswers: Type.Number(),
        timeTaken: Type.Number(),
        submittedAt: Type.String({ format: "date-time" }),
    }),
    scoring: Type.Object({
        baseScore: Type.Number(),
        negativeMarking: Type.Number(),
        recencyBonus: Type.Number(),
        finalScore: Type.Number(),
        maxPossibleScore: Type.Number(),
    }),
    breakdown: Type.Array(
        Type.Object({
            questionId: Type.String(),
            weight: Type.Number(),
            answer: Type.String(),
            isCorrect: Type.Boolean(),
            points: Type.Number(),
            explanation: Type.String(),
        }),
    ),
})

// Assessment Stats Schema
export const AssessmentStatsSchema = Type.Object({
    totalAssessments: Type.Number(),
    averageScore: Type.Number(),
    medianScore: Type.Number(),
    completionRate: Type.Number(),
    averageTimeSpent: Type.Number(),
    scoreDistribution: Type.Array(
        Type.Object({
            range: Type.String(),
            count: Type.Number(),
            percentage: Type.Number(),
        }),
    ),
    correctAnswerRate: Type.Number(),
    questionStats: Type.Array(
        Type.Object({
            questionId: Type.String(),
            text: Type.String(),
            correctAnswers: Type.Number(),
            totalAnswers: Type.Number(),
            accuracyRate: Type.Number(),
        }),
    ),
})

// Assessment Filters Schema
export const AssessmentFiltersSchema = Type.Object({
    applicantId: Type.Optional(Type.String()),
    templateId: Type.Optional(Type.String()),
    jobId: Type.Optional(Type.String()),
    companyId: Type.Optional(Type.String()),
    submittedAfter: Type.Optional(Type.String({ format: "date-time" })),
    submittedBefore: Type.Optional(Type.String({ format: "date-time" })),
    minScore: Type.Optional(Type.Number()),
    maxScore: Type.Optional(Type.Number()),
    isCorrect: Type.Optional(Type.Boolean()),
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
