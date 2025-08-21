import { UserRole } from "@prisma/client"
import { AuthenticatedUser } from "types/user"

export interface AuthorizationContext {
    user: AuthenticatedUser
    action: string
    resource: string
    resourceId?: string
    targetCompanyId?: string
}

export class AuthorizationError extends Error {
    constructor(message: string = "Access denied") {
        super(message)
        this.name = "AuthorizationError"
    }
}

/**
 * Check if user has permission to perform an action on a resource
 */
export function checkPermission(context: AuthorizationContext): boolean {
    const { user, action, resource, targetCompanyId } = context

    // Admin users have full access to everything
    if (user.role === UserRole.ADMIN) {
        return true
    }

    // Recruiters have limited access
    if (user.role === UserRole.RECRUITER) {
        // Must be assigned to a company
        if (!user.companyId) {
            return false
        }

        // Check permissions based on resource type
        switch (resource) {
            case "company":
                return checkCompanyPermission(user, action, targetCompanyId)
            case "branch":
                return checkBranchPermission(user, action, targetCompanyId)
            default:
                return false
        }
    }

    // READONLY users can only read
    if (user.role === UserRole.READONLY) {
        if (!action.startsWith("read") && !action.startsWith("get")) {
            return false
        }

        // Must be assigned to a company
        if (!user.companyId) {
            return false
        }

        // Can only access their assigned company's data
        return targetCompanyId === user.companyId
    }

    return false
}

/**
 * Check company-specific permissions for recruiters
 */
function checkCompanyPermission(
    user: AuthenticatedUser,
    action: string,
    targetCompanyId?: string,
): boolean {
    switch (action) {
        case "read":
        case "get":
            // Can only read their assigned company
            return targetCompanyId === user.companyId
        case "update":
            // Can update their assigned company
            return targetCompanyId === user.companyId
        case "create":
        case "delete":
        case "list":
            // Cannot create, delete companies or list all companies
            return false
        default:
            return false
    }
}

/**
 * Check branch-specific permissions for recruiters
 */
function checkBranchPermission(
    user: AuthenticatedUser,
    action: string,
    targetCompanyId?: string,
): boolean {
    switch (action) {
        case "read":
        case "get":
        case "list":
            // Can read/list branches only for their assigned company
            return !targetCompanyId || targetCompanyId === user.companyId
        case "create":
        case "update":
        case "delete":
            // Can manage branches only for their assigned company
            return targetCompanyId === user.companyId
        default:
            return false
    }
}

/**
 * Ensure user has permission or throw authorization error
 */
export function ensurePermission(context: AuthorizationContext): void {
    if (!checkPermission(context)) {
        throw new AuthorizationError(
            `Access denied: insufficient permissions for ${context.action} on ${context.resource}`,
        )
    }
}

/**
 * Filter company IDs based on user permissions
 */
export function getAccessibleCompanyIds(
    user: AuthenticatedUser,
): string[] | null {
    if (user.role === UserRole.ADMIN) {
        // Admin can access all companies
        return null // null means no filter (all companies)
    }

    if (
        user.companyId &&
        (user.role === UserRole.RECRUITER || user.role === UserRole.READONLY)
    ) {
        // Recruiters and readonly users can only access their assigned company
        return [user.companyId]
    }

    // Users without company assignment can't access any companies
    return []
}
