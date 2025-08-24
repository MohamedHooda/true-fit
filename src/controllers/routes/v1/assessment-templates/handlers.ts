import {
    AssessmentTemplateCreate,
    AssessmentTemplateUpdate,
    AssessmentTemplateFilters,
} from "types/assessment"
import { mapToErrorResponse } from "controllers/errors"
import { ServiceError, ServiceErrorType } from "types/serviceError"
import { RouteHandler } from "fastify"

// Get all assessment templates
export const getAssessmentTemplates: RouteHandler<{
    Querystring: {
        limit?: number
        offset?: number
        jobId?: string
        search?: string
        hasQuestions?: boolean
        hasAssessments?: boolean
    }
}> = async function (this, request, reply) {
    const service = this.services.getAssessmentTemplateService()
    try {
        const { limit, offset, ...filters } = request.query
        const templates = await service.getAssessmentTemplates(
            filters as AssessmentTemplateFilters,
            limit,
            offset,
        )
        return { templates }
    } catch (err) {
        const resp = mapToErrorResponse(
            err,
            "Failed to get assessment templates",
        )
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Get assessment template by ID
export const getAssessmentTemplateById: RouteHandler<{
    Params: { id: string }
}> = async function (this, request, reply) {
    const service = this.services.getAssessmentTemplateService()
    try {
        const template = await service.getAssessmentTemplateById(
            request.params.id,
        )

        if (!template) {
            const resp = mapToErrorResponse(
                new ServiceError(
                    ServiceErrorType.NotFound,
                    "Assessment template not found",
                ),
                "Assessment template not found",
            )
            return reply.code(resp.code).send(resp.returnError())
        }

        return { template }
    } catch (err) {
        const resp = mapToErrorResponse(
            err,
            "Failed to get assessment template",
        )
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Create assessment template
export const createAssessmentTemplate: RouteHandler<{
    Body: AssessmentTemplateCreate
}> = async function (this, request, reply) {
    const service = this.services.getAssessmentTemplateService()
    try {
        const template = await service.createAssessmentTemplate(request.body)
        return reply.code(201).send({ template })
    } catch (err) {
        const resp = mapToErrorResponse(
            err,
            "Failed to create assessment template",
        )
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Update assessment template
export const updateAssessmentTemplate: RouteHandler<{
    Params: { id: string }
    Body: AssessmentTemplateUpdate
}> = async function (this, request, reply) {
    const service = this.services.getAssessmentTemplateService()
    try {
        const template = await service.updateAssessmentTemplate(
            request.params.id,
            request.body,
        )
        return { template }
    } catch (err) {
        const resp = mapToErrorResponse(
            err,
            "Failed to update assessment template",
        )
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Delete assessment template
export const deleteAssessmentTemplate: RouteHandler<{
    Params: { id: string }
}> = async function (this, request, reply) {
    const service = this.services.getAssessmentTemplateService()
    try {
        await service.deleteAssessmentTemplate(request.params.id)
        return { message: "Assessment template deleted successfully" }
    } catch (err) {
        const resp = mapToErrorResponse(
            err,
            "Failed to delete assessment template",
        )
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Clone assessment template
export const cloneAssessmentTemplate: RouteHandler<{
    Params: { id: string }
    Body: {
        name: string
        jobId?: string
    }
}> = async function (this, request, reply) {
    const service = this.services.getAssessmentTemplateService()
    try {
        const template = await service.duplicateAssessmentTemplate(
            request.params.id,
            request.body.name,
            request.body.jobId,
        )
        return { template }
    } catch (err) {
        const resp = mapToErrorResponse(
            err,
            "Failed to clone assessment template",
        )
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Get assessment template statistics
export const getAssessmentTemplateStats: RouteHandler<{
    Querystring: {
        companyId?: string
    }
}> = async function (this, request, reply) {
    const service = this.services.getAssessmentTemplateService()
    try {
        const stats = await service.getAssessmentTemplateStats(
            request.query.companyId,
        )
        return { stats }
    } catch (err) {
        const resp = mapToErrorResponse(
            err,
            "Failed to get assessment template statistics",
        )
        return reply.code(resp.code).send(resp.returnError())
    }
}
