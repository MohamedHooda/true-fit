import { Type } from "@sinclair/typebox"
import { QuestionType } from "@prisma/client"

// Base Assessment Question Schema
export const AssessmentQuestionSchema = Type.Object({
    id: Type.String(),
    templateId: Type.String(),
    text: Type.String(),
    type: Type.Union([
        Type.Literal(QuestionType.MULTIPLE_CHOICE),
        Type.Literal(QuestionType.TRUE_FALSE),
        Type.Literal(QuestionType.TEXT),
    ]),
    weight: Type.Number(),
    order: Type.Number(),
    correctAnswer: Type.Union([Type.String(), Type.Null()]),
    negativeWeight: Type.Union([Type.Number(), Type.Null()]),
    createdAt: Type.String({ format: "date-time" }),
})

// Assessment Question with Details Schema
export const AssessmentQuestionWithDetailsSchema = Type.Object({
    ...AssessmentQuestionSchema.properties,
    template: Type.Object({
        id: Type.String(),
        name: Type.String(),
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
            assessment: Type.Object({
                id: Type.String(),
                applicant: Type.Object({
                    id: Type.String(),
                    firstName: Type.String(),
                    lastName: Type.String(),
                    email: Type.String(),
                }),
            }),
        }),
    ),
})

// Create Assessment Question Request Schema
export const CreateAssessmentQuestionRequestSchema = Type.Object({
    templateId: Type.String(),
    text: Type.String(),
    type: Type.Optional(
        Type.Union([
            Type.Literal(QuestionType.MULTIPLE_CHOICE),
            Type.Literal(QuestionType.TRUE_FALSE),
            Type.Literal(QuestionType.TEXT),
        ]),
    ),
    weight: Type.Optional(Type.Number()),
    order: Type.Optional(Type.Number()),
    correctAnswer: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    negativeWeight: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
})

// Update Assessment Question Request Schema
export const UpdateAssessmentQuestionRequestSchema = Type.Object({
    text: Type.Optional(Type.String()),
    type: Type.Optional(
        Type.Union([
            Type.Literal(QuestionType.MULTIPLE_CHOICE),
            Type.Literal(QuestionType.TRUE_FALSE),
            Type.Literal(QuestionType.TEXT),
        ]),
    ),
    weight: Type.Optional(Type.Number()),
    order: Type.Optional(Type.Number()),
    correctAnswer: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    negativeWeight: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
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
