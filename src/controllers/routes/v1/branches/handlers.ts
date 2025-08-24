import { FastifyRequest, FastifyReply } from "fastify"
import { BranchCreateRequest, BranchUpdate } from "types/company"
import { mapToErrorResponse } from "controllers/errors"
import { ServiceError, ServiceErrorType } from "types/serviceError"
import { RouteHandler } from "fastify"

// Get all branches
export const getBranches: RouteHandler<{
    Querystring: {
        limit?: number
        offset?: number
        companyId?: string
    }
}> = async function (this, request, reply) {
    const service = this.services.getBranchService()
    try {
        const { limit, offset, companyId } = request.query

        if (companyId) {
            // Get branches for a specific company
            const branches = await service.getBranchesByCompanyId(companyId)
            return { branches }
        } else {
            // Get all branches with company info
            const branches = await service.getBranches(limit, offset)
            return { branches }
        }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to get branches")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Get branch by ID
export const getBranchById: RouteHandler<{
    Params: { id: string }
}> = async function (this, request, reply) {
    const service = this.services.getBranchService()
    try {
        const branch = await service.getBranchById(request.params.id)

        if (!branch) {
            const resp = mapToErrorResponse(
                new ServiceError(ServiceErrorType.NotFound, "Branch not found"),
                "Branch not found",
            )
            return reply.code(resp.code).send(resp.returnError())
        }

        return { branch }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to get branch")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Create branch
export const createBranch: RouteHandler<{
    Body: BranchCreateRequest
}> = async function (this, request, reply) {
    const service = this.services.getBranchService()
    try {
        const branch = await service.createBranch(request.body)
        return reply.code(201).send({ branch })
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to create branch")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Update branch
export const updateBranch: RouteHandler<{
    Params: { id: string }
    Body: BranchUpdate
}> = async function (this, request, reply) {
    const service = this.services.getBranchService()
    try {
        const branch = await service.updateBranch(
            request.params.id,
            request.body,
        )
        return { branch }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to update branch")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Delete branch
export const deleteBranch: RouteHandler<{
    Params: { id: string }
}> = async function (this, request, reply) {
    const service = this.services.getBranchService()
    try {
        await service.deleteBranch(request.params.id)
        return { message: "Branch deleted successfully" }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to delete branch")
        return reply.code(resp.code).send(resp.returnError())
    }
}
