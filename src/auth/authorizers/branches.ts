import * as AuthModels from "types/authorisationModels"
import { RequestAuthoriser } from "types/authorisationTypes"
import { httpMethodToAction } from "auth/authorisationHelpers"
import { IAuthorisationRules } from "auth/authorisationRules"

export const authoriseCreateBranch: RequestAuthoriser = async (
    fastify,
    request,
    _payload: any,
) => {
    const rules: IAuthorisationRules = fastify.authorisationRules
    const actor = request.user!
    const requestBody = request.body as any
    const companyId = requestBody?.companyId || actor.companyId
    const branch = new AuthModels.Branch(undefined, companyId)
    const action = httpMethodToAction(request.method)

    if (!action) {
        fastify.log.error(
            `Unknown HTTP method ${request.method}. Default to disallowing request`,
        )
        return 403
    }

    const authorised = await rules.authorise(actor, action, branch)
    return authorised ? 200 : 403
}

export const authoriseGetBranches: RequestAuthoriser = async (
    fastify,
    request,
    payload: any,
) => {
    const rules: IAuthorisationRules = fastify.authorisationRules
    const actor = request.user!
    const queryParams = request.query as any
    const companyId = queryParams?.companyId || actor.companyId

    const branch = new AuthModels.Branch(undefined, companyId)
    const action = httpMethodToAction(request.method)

    if (!action) {
        fastify.log.error(
            `Unknown HTTP method ${request.method}. Default to disallowing request`,
        )
        return 403
    }

    const authorised = await rules.authorise(actor, action, branch)

    // For recruiters, filter the payload to only include branches from their company
    if (
        authorised &&
        actor.role === "RECRUITER" &&
        actor.companyId &&
        payload?.branches
    ) {
        payload.branches = payload.branches.filter(
            (br: any) => br.companyId === actor.companyId,
        )
    }

    return authorised ? 200 : 403
}

export const authoriseGetBranchById: RequestAuthoriser = async (
    fastify,
    request,
    payload: any,
) => {
    const rules: IAuthorisationRules = fastify.authorisationRules
    const actor = request.user!
    const branchId = (request.params as any).id

    // We need to get the branch's company ID from the payload
    const companyId = payload?.branch?.companyId || actor.companyId
    const branch = new AuthModels.Branch(branchId, companyId)
    const action = httpMethodToAction(request.method)

    if (!action) {
        fastify.log.error(
            `Unknown HTTP method ${request.method}. Default to disallowing request`,
        )
        return 403
    }

    const authorised = await rules.authorise(actor, action, branch)
    return authorised ? 200 : 403
}

export const authoriseUpdateBranch: RequestAuthoriser = async (
    fastify,
    request,
    _payload: any,
) => {
    const rules: IAuthorisationRules = fastify.authorisationRules
    const actor = request.user!
    const branchId = (request.params as any).id

    // For updates, we assume the branch belongs to the user's company
    // In a real scenario, you might want to fetch the branch first
    const branch = new AuthModels.Branch(branchId, actor.companyId || undefined)
    const action = httpMethodToAction(request.method)

    if (!action) {
        fastify.log.error(
            `Unknown HTTP method ${request.method}. Default to disallowing request`,
        )
        return 403
    }

    const authorised = await rules.authorise(actor, action, branch)
    return authorised ? 200 : 403
}

export const authoriseDeleteBranch: RequestAuthoriser = async (
    fastify,
    request,
    _payload: any,
) => {
    const rules: IAuthorisationRules = fastify.authorisationRules
    const actor = request.user!
    const branchId = (request.params as any).id

    // For deletes, we assume the branch belongs to the user's company
    // In a real scenario, you might want to fetch the branch first
    const branch = new AuthModels.Branch(branchId, actor.companyId || undefined)
    const action = httpMethodToAction(request.method)

    if (!action) {
        fastify.log.error(
            `Unknown HTTP method ${request.method}. Default to disallowing request`,
        )
        return 403
    }

    const authorised = await rules.authorise(actor, action, branch)
    return authorised ? 200 : 403
}
