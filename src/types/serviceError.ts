/**
 * @enum ServiceErrorType
 * @description Enum for the different types of errors that can be thrown by a Service
 * @property {number} NotFound - Error thrown when a resource is not found
 * @property {number} InternalError - Error thrown when an internal error occurs
 * @property {number} DuplicateValue - Error thrown when a unique value constraint is violated
 * @property {number} InvalidInput - Error thrown when the input is invalid
 */
export enum ServiceErrorType {
    NotFound = "NotFound",
    DuplicateValue = "DuplicateValue",
    InvalidInput = "InvalidInput",
    InternalError = "InternalError",
    InvalidStatus = "InvalidStatus",
    Forbidden = "Forbidden",
}
/**
 * @class ServiceError
 * @description Generic error class for services
 * @property {ServiceErrorType} type - The type of error
 * @property {string} message - The error message
 * @property {Error | undefined} cause - The wrapped error
 */
export class ServiceError extends Error {
    public readonly name = "ServiceError"
    public readonly type: ServiceErrorType
    public readonly message: string
    public errors: { [key: string]: string } = {}

    constructor(
        type: ServiceErrorType,
        message?: string,
        cause?: unknown,
        errors?: { [key: string]: string },
    ) {
        let errorMessage = message
        if (!errorMessage) {
            switch (type) {
                case ServiceErrorType.NotFound:
                    errorMessage = "Resource not found"
                    break
                case ServiceErrorType.InternalError:
                    errorMessage = "Internal error"
                    break
                case ServiceErrorType.DuplicateValue:
                    errorMessage =
                        "Unique value constraint is violated on a field"
                    break
                case ServiceErrorType.InvalidInput:
                    errorMessage = "Invalid input given"
                    break
                case ServiceErrorType.InvalidStatus:
                    errorMessage = "Invalid status"
                    break
                case ServiceErrorType.Forbidden:
                    errorMessage = "Forbidden operation on resource"
                    break
                default:
                    errorMessage = "Internal error"
            }
        }
        super(errorMessage, { cause })
        this.message = errorMessage
        this.type = type
        this.errors = errors ?? {}
        if (cause instanceof Error) {
            this.stack = cause.stack
        }
    }

    static get NotFound(): ServiceError {
        return new ServiceError(ServiceErrorType.NotFound)
    }

    static get InternalError(): ServiceError {
        return new ServiceError(ServiceErrorType.InternalError)
    }

    static get DuplicateValue(): ServiceError {
        return new ServiceError(ServiceErrorType.DuplicateValue)
    }

    static get InvalidInput(): ServiceError {
        return new ServiceError(ServiceErrorType.InvalidInput)
    }

    static get InvalidStatus(): ServiceError {
        return new ServiceError(ServiceErrorType.InvalidStatus)
    }

    static get Forbidden(): ServiceError {
        return new ServiceError(ServiceErrorType.Forbidden)
    }
}
