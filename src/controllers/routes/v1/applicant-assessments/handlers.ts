import { RouteHandler } from "fastify"
import { mapToErrorResponse } from "controllers/errors"
import { ServiceError, ServiceErrorType } from "types/serviceError"
import {
    AssessmentSubmission,
    AssessmentFilters,
} from "types/applicant-assessment"

// Get all assessments
export const getAssessments: RouteHandler<{
    Querystring: AssessmentFilters & {
        limit?: number
        offset?: number
    }
}> = async function (this, request, reply) {
    const service = this.services.getApplicantAssessmentService()
    try {
        const { limit, offset, ...filters } = request.query
        const assessments = await service.getAssessments(filters, limit, offset)
        return { assessments }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to get assessments")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Get assessment by ID
export const getAssessmentById: RouteHandler<{
    Params: { id: string }
}> = async function (this, request, reply) {
    const service = this.services.getApplicantAssessmentService()
    try {
        const assessment = await service.getAssessmentById(request.params.id)
        if (!assessment) {
            const resp = mapToErrorResponse(
                new ServiceError(
                    ServiceErrorType.NotFound,
                    "Assessment not found",
                ),
                "Assessment not found",
            )
            return reply.code(resp.code).send(resp.returnError())
        }
        return { assessment }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to get assessment")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Submit assessment
export const submitAssessment: RouteHandler<{
    Body: AssessmentSubmission
}> = async function (this, request, reply) {
    const service = this.services.getApplicantAssessmentService()
    try {
        const assessment = await service.submitAssessment(request.body)
        return reply.code(201).send({ assessment })
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to submit assessment")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Get assessment score
export const getAssessmentScore: RouteHandler<{
    Params: { id: string }
}> = async function (this, request, reply) {
    const service = this.services.getApplicantAssessmentService()
    try {
        const score = await service.getAssessmentScore(request.params.id)
        return { score }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to get assessment score")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Get assessment explanation
export const getAssessmentExplanation: RouteHandler<{
    Params: { id: string }
}> = async function (this, request, reply) {
    const service = this.services.getApplicantAssessmentService()
    try {
        const explanation = await service.getAssessmentExplanation(
            request.params.id,
        )
        return { explanation }
    } catch (err) {
        const resp = mapToErrorResponse(
            err,
            "Failed to get assessment explanation",
        )
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Get assessment stats
export const getAssessmentStats: RouteHandler<{
    Querystring: {
        templateId?: string
        jobId?: string
    }
}> = async function (this, request, reply) {
    const service = this.services.getApplicantAssessmentService()
    try {
        const { templateId, jobId } = request.query
        const stats = await service.getAssessmentStats(templateId, jobId)
        return { stats }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to get assessment stats")
        return reply.code(resp.code).send(resp.returnError())
    }
}
