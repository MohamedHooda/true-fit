import { HttpStatusCode } from "axios"
import { ServiceError, ServiceErrorType } from "types/serviceError"

export type ErrorResponse = {
    statusCode: number
    message: string
    error: string
    errors: { [key: string]: string }
}
export class HttpErrorResponse extends Error {
    constructor(
        public readonly message: string,
        public readonly type: string,
        public readonly code: number,
        public errors: { [key: string]: string } = {},
    ) {
        super(message)
        this.name = "HttpError"
        Object.setPrototypeOf(this, HttpErrorResponse.prototype)
    }
    returnError(): ErrorResponse {
        return {
            statusCode: this.code,
            message: this.message,
            error: this.type,
            errors: this.errors,
        }
    }
}

function statusCodeFromError(err: unknown): HttpStatusCode {
    if (!(err instanceof ServiceError)) {
        return HttpStatusCode.InternalServerError
    }
    switch (err.type) {
        case ServiceErrorType.InvalidInput:
            return HttpStatusCode.BadRequest
        case ServiceErrorType.DuplicateValue:
            return HttpStatusCode.BadRequest
        case ServiceErrorType.NotFound:
            return HttpStatusCode.NotFound
        case ServiceErrorType.InvalidStatus:
            return HttpStatusCode.Forbidden
        case ServiceErrorType.Forbidden:
            return HttpStatusCode.Forbidden
        default:
            return HttpStatusCode.InternalServerError
    }
}
/**
 * Map an error thrown during request handling to an HttpErrorResponse.
 * @param {unknown} err - The error thrown during request handling.
 * @param {string} title - The title of the error response. Should describe the request that failed.
 * @returns {HttpErrorResponse} The error response.
 */
export function mapToErrorResponse(
    err: unknown,
    title: string,
): HttpErrorResponse {
    return new HttpErrorResponse(
        err instanceof ServiceError ? err.message : title,
        err instanceof ServiceError ? err.type : ServiceErrorType.InternalError,
        statusCodeFromError(err),
        err instanceof ServiceError ? err.errors : undefined,
    )
}
