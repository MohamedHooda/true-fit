import * as AuthModels from "types/authorisationModels"
import { RequestAuthoriser } from "types/authorisationTypes"
import { httpMethodToAction } from "auth/authorisationHelpers"
import { IAuthorisationRules } from "auth/authorisationRules"

export const authoriseCreateCompany: RequestAuthoriser = async (
    fastify,
    request,
    _payload: any,
) => {
    const rules: IAuthorisationRules = fastify.authorisationRules
    const actor = request.user!
    const company = new AuthModels.Company()
    const action = httpMethodToAction(request.method)

    if (!action) {
        fastify.log.error(
            `Unknown HTTP method ${request.method}. Default to disallowing request`,
        )
        return 403
    }

    const authorised = await rules.authorise(actor, action, company)
    return authorised ? 200 : 403
}

export const authoriseGetCompanies: RequestAuthoriser = async (
    fastify,
    request,
    payload: any,
) => {
    const rules: IAuthorisationRules = fastify.authorisationRules
    const actor = request.user!

    // For getting all companies, we check without specific company ID
    const company = new AuthModels.Company()
    const action = httpMethodToAction(request.method)

    if (!action) {
        fastify.log.error(
            `Unknown HTTP method ${request.method}. Default to disallowing request`,
        )
        return 403
    }

    const authorised = await rules.authorise(actor, action, company)

    // For recruiters, filter the payload to only include their company
    if (
        authorised &&
        actor.role === "RECRUITER" &&
        actor.companyId &&
        payload?.companies
    ) {
        payload.companies = payload.companies.filter(
            (comp: any) => comp.id === actor.companyId,
        )
    }

    return authorised ? 200 : 403
}

export const authoriseGetCompanyById: RequestAuthoriser = async (
    fastify,
    request,
    _payload: any,
) => {
    const rules: IAuthorisationRules = fastify.authorisationRules
    const actor = request.user!
    const companyId = (request.params as any).id
    const company = new AuthModels.Company(companyId)
    const action = httpMethodToAction(request.method)

    if (!action) {
        fastify.log.error(
            `Unknown HTTP method ${request.method}. Default to disallowing request`,
        )
        return 403
    }

    const authorised = await rules.authorise(actor, action, company)
    return authorised ? 200 : 403
}

export const authoriseUpdateCompany: RequestAuthoriser = async (
    fastify,
    request,
    _payload: any,
) => {
    const rules: IAuthorisationRules = fastify.authorisationRules
    const actor = request.user!
    const companyId = (request.params as any).id
    const company = new AuthModels.Company(companyId)
    const action = httpMethodToAction(request.method)

    if (!action) {
        fastify.log.error(
            `Unknown HTTP method ${request.method}. Default to disallowing request`,
        )
        return 403
    }

    const authorised = await rules.authorise(actor, action, company)
    return authorised ? 200 : 403
}

export const authoriseDeleteCompany: RequestAuthoriser = async (
    fastify,
    request,
    _payload: any,
) => {
    const rules: IAuthorisationRules = fastify.authorisationRules
    const actor = request.user!
    const companyId = (request.params as any).id
    const company = new AuthModels.Company(companyId)
    const action = httpMethodToAction(request.method)

    if (!action) {
        fastify.log.error(
            `Unknown HTTP method ${request.method}. Default to disallowing request`,
        )
        return 403
    }

    const authorised = await rules.authorise(actor, action, company)
    return authorised ? 200 : 403
}
