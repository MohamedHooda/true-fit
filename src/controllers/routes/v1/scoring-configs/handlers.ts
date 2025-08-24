import { RouteHandler } from "fastify"
import { mapToErrorResponse } from "controllers/errors"
import { ServiceError, ServiceErrorType } from "types/serviceError"
import { ScoringConfigCreate, ScoringConfigUpdate } from "types/scoring"

// Get all scoring configs
export const getScoringConfigs: RouteHandler<{
    Querystring: {
        isDefault?: boolean
        jobId?: string
    }
}> = async function (this, request, reply) {
    const service = this.services.getScoringConfigService()
    try {
        const { isDefault, jobId } = request.query
        const configs = await service.getScoringConfigs(isDefault, jobId)
        return { configs }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to get scoring configs")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Get scoring config by ID
export const getScoringConfigById: RouteHandler<{
    Params: { id: string }
}> = async function (this, request, reply) {
    const service = this.services.getScoringConfigService()
    try {
        const config = await service.getScoringConfigById(request.params.id)
        if (!config) {
            const resp = mapToErrorResponse(
                new ServiceError(
                    ServiceErrorType.NotFound,
                    "Scoring config not found",
                ),
                "Scoring config not found",
            )
            return reply.code(resp.code).send(resp.returnError())
        }
        return { config }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to get scoring config")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Create scoring config
export const createScoringConfig: RouteHandler<{
    Body: ScoringConfigCreate
}> = async function (this, request, reply) {
    const service = this.services.getScoringConfigService()
    try {
        const config = await service.createScoringConfig(request.body)
        return reply.code(201).send({ config })
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to create scoring config")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Update scoring config
export const updateScoringConfig: RouteHandler<{
    Params: { id: string }
    Body: ScoringConfigUpdate
}> = async function (this, request, reply) {
    const service = this.services.getScoringConfigService()
    try {
        const config = await service.updateScoringConfig(
            request.params.id,
            request.body,
        )
        return { config }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to update scoring config")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Delete scoring config
export const deleteScoringConfig: RouteHandler<{
    Params: { id: string }
}> = async function (this, request, reply) {
    const service = this.services.getScoringConfigService()
    try {
        await service.deleteScoringConfig(request.params.id)
        return { message: "Scoring config deleted successfully" }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to delete scoring config")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Apply scoring config to job
export const applyScoringConfig: RouteHandler<{
    Params: { id: string }
    Body: { jobId: string }
}> = async function (this, request, reply) {
    const service = this.services.getScoringConfigService()
    try {
        const config = await service.applyScoringConfig(
            request.params.id,
            request.body.jobId,
        )
        return { config }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to apply scoring config")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Preview scoring config impact
export const previewScoringConfig: RouteHandler<{
    Params: { id: string }
    Querystring: { jobId: string }
}> = async function (this, request, reply) {
    const service = this.services.getScoringConfigService()
    try {
        const preview = await service.previewScoringConfig(
            request.params.id,
            request.query.jobId,
        )
        return { preview }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to preview scoring config")
        return reply.code(resp.code).send(resp.returnError())
    }
}
