export interface Applicant {
    id: string
    email: string
    firstName: string
    lastName: string
    phone?: string | null
    city?: string | null
    country?: string | null
    address?: string | null
    resumeUrl?: string | null
    createdAt: Date
    updatedAt: Date
}

export interface ApplicantWithAssessments extends Applicant {
    assessments: Array<{
        id: string
        submittedAt: Date
        template: {
            id: string
            name: string
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
    }>
    jobApplications: Array<{
        id: string
        status: string
        appliedAt: Date
        job: {
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
        }
    }>
}

export interface ApplicantCreate {
    email: string
    firstName: string
    lastName: string
    phone?: string | null
    city?: string | null
    country?: string | null
    address?: string | null
    resumeUrl?: string | null
}

export interface ApplicantUpdate {
    firstName?: string
    lastName?: string
    phone?: string | null
    city?: string | null
    country?: string | null
    address?: string | null
    resumeUrl?: string | null
}

export interface ApplicantFilters {
    search?: string
    city?: string
    country?: string
    hasAssessments?: boolean
    hasApplications?: boolean
}

export interface ApplicantStats {
    total: number
    withAssessments: number
    withApplications: number
}
