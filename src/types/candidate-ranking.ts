import {
    CandidateRanking,
    JobRankingMetadata,
    RankingStatus,
} from "@prisma/client"

export interface CandidateRankingWithDetails extends CandidateRanking {
    applicant: {
        id: string
        email: string
        firstName: string
        lastName: string
        phone?: string | null
        city?: string | null
        country?: string | null
    }
    job: {
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
    }
    assessment: {
        id: string
        submittedAt: Date
    }
}

export interface TopCandidatesResponse {
    jobId: string
    candidates: CandidateRankingWithDetails[]
    metadata: {
        totalCandidates: number
        lastCalculatedAt: Date | null
        calculationDuration: number | null
        status: RankingStatus
    }
}

export interface RankingCalculationRequest {
    jobId: string
    triggerEvent: string
    forceRecalculation?: boolean
}

export interface RankingCalculationResult {
    jobId: string
    totalCandidates: number
    calculationDuration: number
    rankedCandidates: CandidateRanking[]
    scoringConfigVersion: string
}

export interface CandidateScore {
    applicantId: string
    assessmentId: string
    score: number
    maxPossibleScore: number
    percentage: number
    correctAnswers: number
    incorrectAnswers: number
    recencyBonus?: number
}

export interface RankingInvalidationRequest {
    jobId?: string
    scoringConfigId?: string
    applicantId?: string
    triggerEvent: string
}

export interface JobRankingStatus {
    jobId: string
    status: RankingStatus
    totalCandidates: number
    lastCalculatedAt: Date | null
    isStale: boolean
    errorMessage?: string | null
}

export interface RankingEventPayload {
    type:
        | "ASSESSMENT_SUBMITTED"
        | "SCORING_CONFIG_CHANGED"
        | "JOB_UPDATED"
        | "MANUAL_TRIGGER"
    jobId: string
    metadata?: {
        applicantId?: string
        assessmentId?: string
        scoringConfigId?: string
        userId?: string
    }
}

export interface BulkRankingRequest {
    jobIds: string[]
    triggerEvent: string
    priority: "high" | "normal"
}

export interface CandidateMatchExplanation {
    applicantId: string
    rank: number
    score: number
    explanation: {
        baseScore: number
        negativeMarkingPenalty: number
        recencyBonus: number
        finalScore: number
        strengths: string[]
        weaknesses: string[]
    }
}
