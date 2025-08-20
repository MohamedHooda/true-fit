import { PrismaClient } from "@prisma/client"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"

//Allows for quick replacement of the database implementation
/**
 * The main database interface
 */
export type DB = ReturnType<typeof makeDB>

/**
 * Factory for main database instances
 * @returns a new instance of the database
 */
export function makeDB() {
    const client = new PrismaClient({
        errorFormat: "pretty",
    })
    return client
}
/**
 * @enum { DBErrorType }
 * @description The type of a database error
 * @property { NotFound } NotFound - The requested resource was not found
 * @property { DuplicateValue } DuplicateValue - The requested resource already exists
 * @property { InvalidInput } InvalidInput - The request contained invalid input
 * @property { Unknown } Unknown - An unknown error occurred
 */
export enum DBErrorType {
    NotFound,
    DuplicateValue,
    InvalidInput,
    Unknown,
}
/**
 * @class DBError
 * @classdesc A unified database error
 * @property { DBErrorType } type - The type of the error
 * @property { string } message - The error message
 */
export class DBError extends Error {
    constructor(public type: DBErrorType, wrappedError?: Error) {
        super(wrappedError?.message, { cause: wrappedError })
        this.stack = wrappedError?.stack
    }
}

/**
 * Map a implementation-specific database error to a unified database error
 * @param { Error } err - The error to map
 * @returns { DBError } - The mapped error
 */
export function mapDBError(err: any): DBError {
    if (err instanceof PrismaClientKnownRequestError) {
        const knownErr = err as PrismaClientKnownRequestError
        switch (knownErr.code) {
            case "P2000":
                return new DBError(DBErrorType.InvalidInput, err)
            case "P2001":
                return new DBError(DBErrorType.NotFound, err)
            case "P2002":
                return new DBError(DBErrorType.DuplicateValue, err)
            case "P2011":
                return new DBError(DBErrorType.InvalidInput, err)
            case "P2025":
                return new DBError(DBErrorType.NotFound, err)
            default:
                return new DBError(DBErrorType.Unknown, err)
        }
    } else {
        return new DBError(DBErrorType.Unknown, err)
    }
}
