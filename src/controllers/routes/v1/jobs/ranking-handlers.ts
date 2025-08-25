import { RouteHandler } from "fastify"
import { mapToErrorResponse } from "controllers/errors"
import { ServiceError, ServiceErrorType } from "types/serviceError"
import { Static } from "@sinclair/typebox"
import {
    JobIdParamsSchema,
    TopCandidatesQuerySchema,
    RankingCalculationRequestSchema,
    JobRankingStatusQuerySchema,
} from "./ranking-schemas"

// Get top candidates for a job
export const getTopCandidates: RouteHandler<{
    Params: Static<typeof JobIdParamsSchema>
    Querystring: Static<typeof TopCandidatesQuerySchema>
}> = async function (this, request, reply) {
    const service = this.services.getCandidateRankingService()
    try {
        const { jobId } = request.params
        const { limit } = request.query
        const candidates = await service.getTopCandidates(jobId, limit)
        return candidates
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to get top candidates")
        return reply.code(resp.code).send(resp.returnError())
    }
}

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

// Get job ranking status
export const getJobRankingStatus: RouteHandler<{
    Params: Static<typeof JobIdParamsSchema>
    Querystring: Static<typeof JobRankingStatusQuerySchema>
}> = async function (this, request, reply) {
    const service = this.services.getCandidateRankingService()
    try {
        const { jobId } = request.params
        const status = await service.getJobRankingStatus(jobId)
        return status
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to get ranking status")
        return reply.code(resp.code).send(resp.returnError())
    }
}
