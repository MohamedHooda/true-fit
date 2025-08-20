import { DBError, DBErrorType, mapDBError } from "persistence/db"
import { ServiceError, ServiceErrorType } from "types/serviceError"
import { Logger } from "types/logging"

/**
 * Map a DBError to a ServiceError
 * @param {DBError} err - The error to map
 * @returns {ServiceError} - The mapped error
 */
export function mapDBErrorToServiceError(err: DBError): ServiceError {
    switch (err.type) {
        case DBErrorType.NotFound:
            return new ServiceError(
                ServiceErrorType.NotFound,
                undefined,
                err.cause,
            )
        case DBErrorType.DuplicateValue:
            return new ServiceError(
                ServiceErrorType.DuplicateValue,
                undefined,
                err.cause,
            )
        case DBErrorType.InvalidInput:
            return new ServiceError(
                ServiceErrorType.InvalidInput,
                undefined,
                err.cause,
            )
        default:
            return new ServiceError(
                ServiceErrorType.InternalError,
                undefined,
                err.cause,
            )
    }
}
/**
 * Handle a db error by mapping it to a service error and throwing it
 * @param {unknown} err - The error thrown by the db
 * @param {Logger} logger - A logger to log unknown errors to
 * @returns {never} - This function never returns
 * @throws {ServiceError} - The mapped error
 */
export function handleDBError(err: unknown, logger: Logger): never {
    if (err instanceof Error) {
        const dbErr = mapDBError(err)
        const serviceError = mapDBErrorToServiceError(dbErr)
        if (dbErr.type == DBErrorType.Unknown) {
            logger.error(err, "Encountered error during db access.")
        }
        serviceError.stack = err.stack
        throw serviceError
    } else {
        logger.error(err, "Encountered error during db access")
        throw new ServiceError(ServiceErrorType.InternalError, undefined, err)
    }
}
