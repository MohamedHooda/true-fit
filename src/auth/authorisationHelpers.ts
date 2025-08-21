export function httpMethodToAction(method: string): string | null {
    switch (method.toUpperCase()) {
        case "GET":
            return "read"
        case "POST":
            return "create"
        case "PUT":
        case "PATCH":
            return "update"
        case "DELETE":
            return "delete"
        default:
            return null
    }
}

export function checkPreconditions(): boolean {
    // Add any precondition checks here
    return true
}
