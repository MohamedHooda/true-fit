import { ApplicationStatus } from "@prisma/client"

export interface JobApplication {
    id: string
    status: ApplicationStatus
    appliedAt: Date
    updatedAt: Date
    applicantId: string
    jobId: string
}

export interface JobApplicationWithDetails extends JobApplication {
    applicant: {
        id: string
        email: string
        firstName: string
        lastName: string
        phone?: string | null
        city?: string | null
        country?: string | null
        resumeUrl?: string | null
    }
    job: {
        id: string
        title: string
        description?: string | null
        status: string
        openPositions?: number | null
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
}

export interface JobApplicationCreate {
    applicantId: string
    jobId: string
    status?: ApplicationStatus
}

export interface JobApplicationUpdate {
    status?: ApplicationStatus
}

export interface JobApplicationFilters {
    status?: ApplicationStatus
    jobId?: string
    applicantId?: string
    branchId?: string
    companyId?: string
    dateFrom?: Date
    dateTo?: Date
}

export interface JobApplicationStats {
    total: number
    applied: number
    reviewing: number
    rejected: number
    hired: number
}
