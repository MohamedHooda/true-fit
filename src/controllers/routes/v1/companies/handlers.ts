import { CompanyCreateRequest, CompanyUpdate } from "types/company"
import { mapToErrorResponse } from "controllers/errors"
import { ServiceError, ServiceErrorType } from "types/serviceError"
import { RouteHandler } from "fastify"

// Get all companies
export const getCompanies: RouteHandler<{
    Querystring: {
        limit?: number
        offset?: number
    }
}> = async function (this, request, reply) {
    const service = this.services.getCompanyService()
    try {
        const { limit, offset } = request.query
        const companies = await service.getCompanies(limit, offset)
        return { companies }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to get companies")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Get company by ID
export const getCompanyById: RouteHandler<{
    Params: { id: string }
}> = async function (this, request, reply) {
    const service = this.services.getCompanyService()
    try {
        const company = await service.getCompanyById(request.params.id)

        if (!company) {
            const resp = mapToErrorResponse(
                new ServiceError(
                    ServiceErrorType.NotFound,
                    "Company not found",
                ),
                "Company not found",
            )
            return reply.code(resp.code).send(resp.returnError())
        }

        return { company }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to get company")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Create company
export const createCompany: RouteHandler<{
    Body: CompanyCreateRequest
}> = async function (this, request, reply) {
    const service = this.services.getCompanyService()
    try {
        const company = await service.createCompany(request.body)
        return reply.code(201).send({ company })
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to create company")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Update company
export const updateCompany: RouteHandler<{
    Params: { id: string }
    Body: CompanyUpdate
}> = async function (this, request, reply) {
    const service = this.services.getCompanyService()
    try {
        const company = await service.updateCompany(
            request.params.id,
            request.body,
        )
        return { company }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to update company")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Delete company
export const deleteCompany: RouteHandler<{
    Params: { id: string }
}> = async function (this, request, reply) {
    const service = this.services.getCompanyService()
    try {
        await service.deleteCompany(request.params.id)
        return { message: "Company deleted successfully" }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to delete company")
        return reply.code(resp.code).send(resp.returnError())
    }
}
