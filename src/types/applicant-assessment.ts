import { ApplicantAssessment } from "@prisma/client"
import { ScoringResult, ScoringExplanation } from "./scoring"

export interface ApplicantAssessmentWithDetails extends ApplicantAssessment {
    applicant: {
        id: string
        email: string
        firstName: string
        lastName: string
        phone?: string | null
        city?: string | null
        country?: string | null
    }
    template: {
        id: string
        name: string
        description?: string | null
        job?: {
            id: string
            title: string
            branch: {
                id: string
                name: string
                company: {
                    id: string
                    name: string
                }
            }
        } | null
    }
    answers: Array<{
        id: string
        answer?: string | null
        isCorrect: boolean
        question: {
            id: string
            text: string
            type: string
            weight: number
            correctAnswer?: string | null
        }
    }>
}

export interface AssessmentSubmission {
    applicantId: string
    templateId: string
    answers: Array<{
        questionId: string
        answer: string
    }>
}

export interface AssessmentScore extends ScoringResult {
    assessmentId: string
    applicantId: string
    templateId: string
    submittedAt: Date
    scoredAt: Date
    scoringConfigId: string
}

export interface AssessmentScoreWithDetails extends AssessmentScore {
    assessment: ApplicantAssessmentWithDetails
    scoringConfig: {
        id: string
        negativeMarkingFraction: number
        recencyWindowDays?: number | null
        recencyBoostPercent?: number | null
    }
}

export interface AssessmentExplanation extends ScoringExplanation {
    assessmentId: string
    applicantId: string
    templateId: string
    submittedAt: Date
    scoredAt: Date
    scoringConfigId: string
}

export interface AssessmentFilters {
    applicantId?: string
    templateId?: string
    jobId?: string
    companyId?: string
    submittedAfter?: Date
    submittedBefore?: Date
    minScore?: number
    maxScore?: number
    isCorrect?: boolean
}

export interface AssessmentStats {
    totalAssessments: number
    averageScore: number
    medianScore: number
    completionRate: number
    averageTimeSpent: number
    scoreDistribution: Array<{
        range: string
        count: number
        percentage: number
    }>
    correctAnswerRate: number
    questionStats: Array<{
        questionId: string
        text: string
        correctAnswers: number
        totalAnswers: number
        accuracyRate: number
    }>
}
