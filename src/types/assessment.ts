import { QuestionType } from "@prisma/client"

// Assessment Template Types
export interface AssessmentTemplate {
    id: string
    name: string
    description?: string | null
    createdAt: Date
    updatedAt: Date
    jobId?: string | null
}

export interface AssessmentTemplateWithDetails extends AssessmentTemplate {
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
    questions: Array<{
        id: string
        text: string
        type: QuestionType
        weight: number
        order: number
        correctAnswer?: string | null
        negativeWeight?: number | null
    }>
    assessments: Array<{
        id: string
        submittedAt: Date
        applicant: {
            id: string
            firstName: string
            lastName: string
            email: string
        }
    }>
}

export interface AssessmentTemplateCreate {
    name: string
    description?: string | null
    jobId?: string | null
}

export interface AssessmentTemplateUpdate {
    name?: string
    description?: string | null
    jobId?: string | null
}

export interface AssessmentTemplateFilters {
    jobId?: string
    search?: string
    hasQuestions?: boolean
    hasAssessments?: boolean
}

export interface AssessmentTemplateStats {
    total: number
    withQuestions: number
    withAssessments: number
}

// Assessment Question Types
export interface AssessmentQuestion {
    id: string
    templateId: string
    text: string
    type: QuestionType
    weight: number
    order: number
    correctAnswer?: string | null
    negativeWeight?: number | null
    createdAt: Date
}

export interface AssessmentQuestionWithDetails extends AssessmentQuestion {
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
    answers: Array<{
        id: string
        answer?: string | null
        isCorrect: boolean
        assessment: {
            id: string
            applicant: {
                id: string
                firstName: string
                lastName: string
                email: string
            }
        }
    }>
}

export interface AssessmentQuestionCreate {
    templateId: string
    text: string
    type?: QuestionType
    weight?: number
    order?: number
    correctAnswer?: string | null
    negativeWeight?: number | null
}

export interface AssessmentQuestionUpdate {
    text?: string
    type?: QuestionType
    weight?: number
    order?: number
    correctAnswer?: string | null
    negativeWeight?: number | null
}

// Applicant Assessment Types
export interface ApplicantAssessment {
    id: string
    submittedAt: Date
    applicantId: string
    templateId: string
}

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

export interface ApplicantAssessmentCreate {
    applicantId: string
    templateId: string
    submittedAt?: Date
}

export interface AssessmentSubmission {
    applicantId: string
    templateId: string
    answers: Array<{
        questionId: string
        answer?: string | null
    }>
}

export interface ApplicantAssessmentFilters {
    applicantId?: string
    templateId?: string
    jobId?: string
    companyId?: string
    dateFrom?: Date
    dateTo?: Date
}

export interface AssessmentScore {
    score: number
    maxScore: number
    percentage: number
}

export interface AssessmentScoreBreakdown extends AssessmentScore {
    breakdown: {
        totalQuestions: number
        correctAnswers: number
        incorrectAnswers: number
        negativeMarking: number
        recencyBoost: number
    }
}

export interface AssessmentStats {
    total: number
    averageScore: number
    completionRate: number
}

// Applicant Answer Types
export interface ApplicantAnswer {
    id: string
    answer?: string | null
    isCorrect: boolean
    createdAt: Date
    assessmentId: string
    questionId: string
}

export interface ApplicantAnswerWithDetails extends ApplicantAnswer {
    assessment: {
        id: string
        submittedAt: Date
        applicant: {
            id: string
            firstName: string
            lastName: string
            email: string
        }
        template: {
            id: string
            name: string
            job?: {
                id: string
                title: string
            } | null
        }
    }
    question: {
        id: string
        text: string
        type: QuestionType
        weight: number
        correctAnswer?: string | null
        negativeWeight?: number | null
    }
}

export interface ApplicantAnswerCreate {
    assessmentId: string
    questionId: string
    answer?: string | null
    isCorrect?: boolean
}

export interface ApplicantAnswerUpdate {
    answer?: string | null
    isCorrect?: boolean
}

export interface QuestionAnswerStats {
    total: number
    correct: number
    incorrect: number
    accuracy: number
}

export interface CommonAnswer {
    answer: string
    count: number
}

export interface AnswerDistribution {
    questionId: string
    totalResponses: number
    distribution: Array<{
        answer: string | null
        count: number
        percentage: number
        isCorrect: boolean
    }>
    commonMistakes: Array<{
        answer: string | null
        count: number
        percentage: number
    }>
}
