import { RouteHandler } from "fastify"
import { mapToErrorResponse } from "controllers/errors"
import { Static } from "@sinclair/typebox"
import {
    TopCandidatesQuerySchema,
    JobIdParamSchema,
    RankingCalculationRequestSchema,
    BulkRankingRequestSchema,
    InvalidationRequestSchema,
    JobRankingStatusQuerySchema,
    ApplicantIdParamSchema,
} from "./schemas"

type TopCandidatesQuery = Static<typeof TopCandidatesQuerySchema>
type JobIdParams = Static<typeof JobIdParamSchema>
type ApplicantIdParams = Static<typeof ApplicantIdParamSchema>
type RankingCalculationRequest = Static<typeof RankingCalculationRequestSchema>
type BulkRankingRequest = Static<typeof BulkRankingRequestSchema>
type InvalidationRequest = Static<typeof InvalidationRequestSchema>
type JobRankingStatusQuery = Static<typeof JobRankingStatusQuerySchema>

export const getTopCandidates: RouteHandler<{
    Params: JobIdParams
    Querystring: TopCandidatesQuery
}> = async function (this, request, reply) {
    try {
        const service = this.services.getCandidateRankingService()
        const { jobId } = request.params
        const { limit } = request.query

        const result = await service.getTopCandidates(jobId, limit)
        return reply.code(200).send(result)
    } catch (err) {
        const resp = mapToErrorResponse(
            err,
            "Failed to retrieve top candidates",
        )
        return reply.code(resp.code).send(resp.returnError())
    }
}

export const recalculateJobRankings: RouteHandler<{
    Body: RankingCalculationRequest
}> = async function (this, request, reply) {
    try {
        const service = this.services.getCandidateRankingService()
        const { jobId, triggerEvent, forceRecalculation } = request.body

        // If not forcing recalculation, check if already calculating
        if (!forceRecalculation) {
            const status = await service.getJobRankingStatus(jobId)
            if (status.status === "CALCULATING") {
                return reply.code(409).send({
                    error: "Conflict",
                    message: "Job rankings are already being calculated",
                    statusCode: 409,
                })
            }
        }

        const result = await service.recalculateJobRankings(jobId, triggerEvent)
        return reply.code(200).send(result)
    } catch (err) {
        const resp = mapToErrorResponse(
            err,
            "Failed to recalculate job rankings",
        )
        return reply.code(resp.code).send(resp.returnError())
    }
}

export const getJobRankingStatus: RouteHandler<{
    Params: JobIdParams
    Querystring: JobRankingStatusQuery
}> = async function (this, request, reply) {
    try {
        const service = this.services.getCandidateRankingService()
        const { jobId } = request.params

        const status = await service.getJobRankingStatus(jobId)
        return reply.code(200).send(status)
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to get ranking status")
        return reply.code(resp.code).send(resp.returnError())
    }
}

export const processBulkRankings: RouteHandler<{
    Body: BulkRankingRequest
}> = async function (this, request, reply) {
    try {
        const service = this.services.getCandidateRankingService()
        const bulkRequest = request.body

        const results = await service.processBulkRankings(bulkRequest)

        const summary = {
            totalJobs: bulkRequest.jobIds.length,
            successful: results.length,
            failed: bulkRequest.jobIds.length - results.length,
            results: results.map((r) => ({
                jobId: r.jobId,
                totalCandidates: r.totalCandidates,
                calculationDuration: r.calculationDuration,
            })),
        }

        return reply.code(200).send(summary)
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to process bulk rankings")
        return reply.code(resp.code).send(resp.returnError())
    }
}

export const invalidateRankings: RouteHandler<{
    Body: InvalidationRequest
}> = async function (this, request, reply) {
    try {
        const service = this.services.getCandidateRankingService()
        const invalidationRequest = request.body

        // Validate that at least one criteria is provided
        if (
            !invalidationRequest.jobId &&
            !invalidationRequest.scoringConfigId &&
            !invalidationRequest.applicantId
        ) {
            return reply.code(400).send({
                error: "Bad Request",
                message:
                    "At least one of jobId, scoringConfigId, or applicantId must be provided",
                statusCode: 400,
            })
        }

        await service.invalidateRankings(invalidationRequest)

        return reply.code(200).send({
            message: "Rankings invalidated successfully",
            triggerEvent: invalidationRequest.triggerEvent,
        })
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to invalidate rankings")
        return reply.code(resp.code).send(resp.returnError())
    }
}

export const scheduleStaleRecalculations: RouteHandler = async function (
    this,
    request,
    reply,
) {
    try {
        const service = this.services.getCandidateRankingService()

        await service.scheduleStaleJobRecalculations()

        return reply.code(200).send({
            message: "Stale job recalculations scheduled successfully",
        })
    } catch (err) {
        const resp = mapToErrorResponse(
            err,
            "Failed to schedule stale recalculations",
        )
        return reply.code(resp.code).send(resp.returnError())
    }
}

export const getCandidateRank: RouteHandler<{
    Params: JobIdParams & ApplicantIdParams
}> = async function (this, request, reply) {
    try {
        const { jobId } = request.params
        const { applicantId } = request.params

        // Get all candidates to find specific applicant's rank
        const topCandidates = await this.services
            .getCandidateRankingService()
            .getTopCandidates(jobId, 100)

        const candidateRank = topCandidates.candidates.find(
            (candidate) => candidate.applicantId === applicantId,
        )

        if (!candidateRank) {
            return reply.code(404).send({
                error: "Not Found",
                message: "Candidate ranking not found for this job",
                statusCode: 404,
            })
        }

        return reply.code(200).send({
            candidate: candidateRank,
            jobMetadata: topCandidates.metadata,
        })
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to get candidate rank")
        return reply.code(resp.code).send(resp.returnError())
    }
}
