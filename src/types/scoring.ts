import { ScoringConfig } from "@prisma/client"

export interface ScoringConfigCreate {
    negativeMarkingFraction: number
    recencyWindowDays?: number | null
    recencyBoostPercent?: number | null
    isDefault?: boolean
    jobId?: string | null
}

export interface ScoringConfigUpdate {
    negativeMarkingFraction?: number
    recencyWindowDays?: number | null
    recencyBoostPercent?: number | null
    isDefault?: boolean
}

export interface ScoringConfigWithDetails extends ScoringConfig {
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

export interface ScoringResult {
    score: number
    maxPossibleScore: number
    percentage: number
    breakdown: {
        correctAnswers: {
            count: number
            points: number
        }
        incorrectAnswers: {
            count: number
            points: number
        }
        recencyBonus?: {
            percentage: number
            points: number
        }
    }
    explanation: string[]
}

export interface ScoringPreview {
    currentConfig: {
        score: number
        rank: number
        totalCandidates: number
    }
    newConfig: {
        score: number
        rank: number
        totalCandidates: number
    }
    changes: {
        scoreChange: number
        rankChange: number
        explanation: string[]
    }
}

export interface ScoringSimulation {
    config: ScoringConfigCreate
    assessmentId: string
    answers: Array<{
        questionId: string
        answer: string
    }>
}

export interface ScoringExplanation {
    config: {
        negativeMarking: boolean
        negativeMarkingFraction: number
        recencyBoost: boolean
        recencyWindowDays?: number
        recencyBoostPercent?: number
    }
    assessment: {
        totalQuestions: number
        answeredQuestions: number
        correctAnswers: number
        incorrectAnswers: number
        timeTaken: number
        submittedAt: Date
    }
    scoring: {
        baseScore: number
        negativeMarking: number
        recencyBonus: number
        finalScore: number
        maxPossibleScore: number
    }
    breakdown: Array<{
        questionId: string
        weight: number
        answer: string
        isCorrect: boolean
        points: number
        explanation: string
    }>
}
