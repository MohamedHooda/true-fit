import { UserRole } from "@prisma/client"
import { AuthenticatedUser } from "types/user"
import * as AuthModels from "types/authorisationModels"

export interface IAuthorisationRules {
    authorise(
        actor: AuthenticatedUser,
        action: string,
        resource: AuthModels.Company | AuthModels.Branch,
    ): Promise<boolean>
}

export class AuthorisationRules implements IAuthorisationRules {
    async authorise(
        actor: AuthenticatedUser,
        action: string,
        resource: AuthModels.Company | AuthModels.Branch,
    ): Promise<boolean> {
        // Admin users have full access
        if (actor.role === UserRole.ADMIN) {
            return true
        }

        // Recruiters have limited access
        if (actor.role === UserRole.RECRUITER) {
            return this.authoriseRecruiter(actor, action, resource)
        }

        // Readonly users can only read
        if (actor.role === UserRole.READONLY) {
            return this.authoriseReadonly(actor, action, resource)
        }

        return false
    }

    private authoriseRecruiter(
        actor: AuthenticatedUser,
        action: string,
        resource: AuthModels.Company | AuthModels.Branch,
    ): boolean {
        // Must be assigned to a company
        if (!actor.companyId) {
            return false
        }

        if (resource instanceof AuthModels.Company) {
            return this.authoriseRecruiterCompany(actor, action, resource)
        }

        if (resource instanceof AuthModels.Branch) {
            return this.authoriseRecruiterBranch(actor, action, resource)
        }

        return false
    }

    private authoriseRecruiterCompany(
        actor: AuthenticatedUser,
        action: string,
        resource: AuthModels.Company,
    ): boolean {
        switch (action) {
            case "read":
                // Can only read their assigned company
                return !resource.id || resource.id === actor.companyId
            case "update":
                // Can update their assigned company
                return resource.id === actor.companyId
            case "create":
            case "delete":
                // Cannot create or delete companies
                return false
            default:
                return false
        }
    }

    private authoriseRecruiterBranch(
        actor: AuthenticatedUser,
        action: string,
        resource: AuthModels.Branch,
    ): boolean {
        // All branch operations must be for their assigned company
        const companyId = resource.companyId || actor.companyId
        if (companyId !== actor.companyId) {
            return false
        }

        switch (action) {
            case "read":
            case "create":
            case "update":
            case "delete":
                return true
            default:
                return false
        }
    }

    private authoriseReadonly(
        actor: AuthenticatedUser,
        action: string,
        resource: AuthModels.Company | AuthModels.Branch,
    ): boolean {
        // Must be assigned to a company
        if (!actor.companyId) {
            return false
        }

        // Can only read
        if (action !== "read") {
            return false
        }

        if (resource instanceof AuthModels.Company) {
            // Can only read their assigned company
            return !resource.id || resource.id === actor.companyId
        }

        if (resource instanceof AuthModels.Branch) {
            // Can only read branches for their assigned company
            const companyId = resource.companyId || actor.companyId
            return companyId === actor.companyId
        }

        return false
    }
}
