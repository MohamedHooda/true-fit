import { JobCreate, JobUpdate, JobFilters } from "types/job"
import { mapToErrorResponse } from "controllers/errors"
import { ServiceError, ServiceErrorType } from "types/serviceError"
import { RouteHandler } from "fastify"

// Get all jobs
export const getJobs: RouteHandler<{
    Querystring: {
        limit?: number
        offset?: number
        status?: string
        branchId?: string
        companyId?: string
        search?: string
    }
}> = async function (this, request, reply) {
    const service = this.services.getJobService()
    try {
        const { limit, offset, ...filters } = request.query
        const jobs = await service.getJobs(filters as JobFilters, limit, offset)
        return { jobs }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to get jobs")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Get job by ID
export const getJobById: RouteHandler<{
    Params: { id: string }
}> = async function (this, request, reply) {
    const service = this.services.getJobService()
    try {
        const job = await service.getJobById(request.params.id)

        if (!job) {
            const resp = mapToErrorResponse(
                new ServiceError(ServiceErrorType.NotFound, "Job not found"),
                "Job not found",
            )
            return reply.code(resp.code).send(resp.returnError())
        }

        return { job }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to get job")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Create job
export const createJob: RouteHandler<{
    Body: JobCreate
}> = async function (this, request, reply) {
    const service = this.services.getJobService()
    try {
        const job = await service.createJob(request.body)
        return reply.code(201).send({ job })
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to create job")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Update job
export const updateJob: RouteHandler<{
    Params: { id: string }
    Body: JobUpdate
}> = async function (this, request, reply) {
    const service = this.services.getJobService()
    try {
        const job = await service.updateJob(request.params.id, request.body)
        return { job }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to update job")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Delete job
export const deleteJob: RouteHandler<{
    Params: { id: string }
}> = async function (this, request, reply) {
    const service = this.services.getJobService()
    try {
        await service.deleteJob(request.params.id)
        return { message: "Job deleted successfully" }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to delete job")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Get job statistics
export const getJobStats: RouteHandler<{
    Querystring: {
        companyId: string
    }
}> = async function (this, request, reply) {
    const service = this.services.getJobService()
    try {
        const { companyId } = request.query
        const stats = await service.getJobStats(companyId)
        return { stats }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to get job statistics")
        return reply.code(resp.code).send(resp.returnError())
    }
}
