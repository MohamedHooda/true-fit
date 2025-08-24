import { JobStatus } from "@prisma/client"

export interface Job {
    id: string
    title: string
    description?: string | null
    requirements?: string | null
    status: JobStatus
    openPositions?: number | null
    createdAt: Date
    updatedAt: Date
    branchId: string
}

export interface JobWithBranch extends Job {
    branch: {
        id: string
        name: string
        city?: string | null
        country?: string | null
        company: {
            id: string
            name: string
        }
    }
}

export interface JobWithDetails extends Job {
    branch: {
        id: string
        name: string
        city?: string | null
        country?: string | null
        company: {
            id: string
            name: string
        }
    }
    templates: Array<{
        id: string
        name: string
        description?: string | null
    }>
    jobApplications: Array<{
        id: string
        status: string
        appliedAt: Date
        applicant: {
            id: string
            firstName: string
            lastName: string
            email: string
        }
    }>
    scoringConfig?: {
        id: string
        negativeMarkingFraction: number
        recencyWindowDays?: number | null
        recencyBoostPercent?: number | null
        isDefault: boolean
    } | null
}

export interface JobCreate {
    title: string
    description?: string | null
    requirements?: string | null
    status?: JobStatus
    openPositions?: number | null
    branchId: string
}

export interface JobUpdate {
    title?: string
    description?: string | null
    requirements?: string | null
    status?: JobStatus
    openPositions?: number | null
}

export interface JobFilters {
    status?: JobStatus
    branchId?: string
    companyId?: string
    search?: string
}

export interface JobStats {
    total: number
    open: number
    closed: number
    draft: number
}
