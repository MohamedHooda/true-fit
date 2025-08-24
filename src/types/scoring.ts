export interface ScoringConfig {
    id: string
    negativeMarkingFraction: number
    recencyWindowDays?: number | null
    recencyBoostPercent?: number | null
    isDefault: boolean
    createdAt: Date
    updatedAt: Date
    jobId?: string | null
}

export interface ScoringConfigWithJob extends ScoringConfig {
    job?: {
        id: string
        title: string
        status: string
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

export interface ScoringConfigCreate {
    negativeMarkingFraction?: number
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

export interface ScoringResult {
    assessmentId: string
    score: number
    percentage: number
}
