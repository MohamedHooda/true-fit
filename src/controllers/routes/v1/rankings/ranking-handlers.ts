import { RouteHandler } from "fastify"
import { mapToErrorResponse } from "controllers/errors"
import { ServiceError, ServiceErrorType } from "types/serviceError"
import { Static } from "@sinclair/typebox"
import {
    RankingCalculationRequestSchema,
    BulkRankingRequestSchema,
    InvalidationRequestSchema,
} from "./ranking-schemas"

// Recalculate rankings for a job
export const recalculateJobRankings: RouteHandler<{
    Body: Static<typeof RankingCalculationRequestSchema>
}> = async function (this, request, reply) {
    const service = this.services.getCandidateRankingService()
    try {
        const { jobId, triggerEvent } = request.body
        const result = await service.recalculateJobRankings(jobId, triggerEvent)
        return result
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to recalculate rankings")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Process bulk rankings
export const processBulkRankings: RouteHandler<{
    Body: Static<typeof BulkRankingRequestSchema>
}> = async function (this, request, reply) {
    const service = this.services.getCandidateRankingService()
    try {
        const result = await service.processBulkRankings(request.body)
        return result
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to process bulk rankings")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Invalidate rankings
export const invalidateRankings: RouteHandler<{
    Body: Static<typeof InvalidationRequestSchema>
}> = async function (this, request, reply) {
    const service = this.services.getCandidateRankingService()
    try {
        const result = await service.invalidateRankings(request.body)
        return result
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to invalidate rankings")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Schedule stale job recalculations
export const scheduleStaleRecalculations: RouteHandler = async function (
    this,
    request,
    reply,
) {
    const service = this.services.getCandidateRankingService()
    try {
        await service.scheduleStaleJobRecalculations()
        return { message: "Stale job recalculations scheduled successfully" }
    } catch (err) {
        const resp = mapToErrorResponse(
            err,
            "Failed to schedule stale job recalculations",
        )
        return reply.code(resp.code).send(resp.returnError())
    }
}
