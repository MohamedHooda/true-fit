import {
    ApplicantCreate,
    ApplicantUpdate,
    ApplicantFilters,
} from "types/applicant"
import { mapToErrorResponse } from "controllers/errors"
import { ServiceError, ServiceErrorType } from "types/serviceError"
import { RouteHandler } from "fastify"

// Get all applicants
export const getApplicants: RouteHandler<{
    Querystring: {
        limit?: number
        offset?: number
        search?: string
        city?: string
        country?: string
        hasAssessments?: boolean
        hasApplications?: boolean
    }
}> = async function (this, request, reply) {
    const service = this.services.getApplicantService()
    try {
        const { limit, offset, ...filters } = request.query
        const applicants = await service.getApplicants(
            filters as ApplicantFilters,
            limit,
            offset,
        )
        return { applicants }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to get applicants")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Get applicant by ID
export const getApplicantById: RouteHandler<{
    Params: { id: string }
}> = async function (this, request, reply) {
    const service = this.services.getApplicantService()
    try {
        const applicant = await service.getApplicantById(request.params.id)

        if (!applicant) {
            const resp = mapToErrorResponse(
                new ServiceError(
                    ServiceErrorType.NotFound,
                    "Applicant not found",
                ),
                "Applicant not found",
            )
            return reply.code(resp.code).send(resp.returnError())
        }

        return { applicant }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to get applicant")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Create applicant
export const createApplicant: RouteHandler<{
    Body: ApplicantCreate
}> = async function (this, request, reply) {
    const service = this.services.getApplicantService()
    try {
        const applicant = await service.createApplicant(request.body)
        return reply.code(201).send({ applicant })
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to create applicant")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Update applicant
export const updateApplicant: RouteHandler<{
    Params: { id: string }
    Body: ApplicantUpdate
}> = async function (this, request, reply) {
    const service = this.services.getApplicantService()
    try {
        const applicant = await service.updateApplicant(
            request.params.id,
            request.body,
        )
        return { applicant }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to update applicant")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Delete applicant
export const deleteApplicant: RouteHandler<{
    Params: { id: string }
}> = async function (this, request, reply) {
    const service = this.services.getApplicantService()
    try {
        await service.deleteApplicant(request.params.id)
        return { message: "Applicant deleted successfully" }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to delete applicant")
        return reply.code(resp.code).send(resp.returnError())
    }
}
