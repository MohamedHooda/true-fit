import fp from "fastify-plugin"
import {
    FastifyInstance,
    FastifyPluginAsync,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
} from "fastify"
import {
    AuthorisationRules,
    IAuthorisationRules,
} from "auth/authorisationRules"

export interface HttpErrorResponse {
    error: string
    message: string
    statusCode: number
}

async function authorise(
    authoriser: (
        fastify: FastifyInstance,
        request: FastifyRequest,
        payload?: unknown,
    ) => Promise<number>,
    fastify: FastifyInstance,
    request: FastifyRequest,
    reply: FastifyReply,
    payload?: unknown,
) {
    // If status is already set to an error by the authentication, don't override it and simply return
    if (reply.statusCode >= 400) {
        return
    }

    // Authorise the request
    try {
        const status = await authoriser(fastify, request, payload)

        switch (status) {
            case 200:
                return
            case 401:
                return reply.code(401).send({
                    error: "Unauthorised",
                    message: "Missing or invalid credentials",
                    statusCode: 401,
                } as HttpErrorResponse)
            case 403:
                return reply.code(403).send({
                    error: "Forbidden",
                    message: "Access denied",
                    statusCode: 403,
                } as HttpErrorResponse)
            case 404:
                return reply.code(404).send({
                    error: "Not Found",
                    message: "Resource not found",
                    statusCode: 404,
                } as HttpErrorResponse)
            default:
                return reply.code(500).send({
                    error: "Internal Server Error",
                    message: "Internal Error",
                    statusCode: 500,
                } as HttpErrorResponse)
        }
    } catch (err) {
        fastify.log.error(err, "Encountered error during request authorisation")
        return reply.code(500).send({
            error: "Internal Server Error",
            message: "Internal Error",
            statusCode: 500,
        } as HttpErrorResponse)
    }
}

/**
 * Create a preHandler hook for authorization
 */
export function createAuthorizer(
    authoriserFn: (
        fastify: FastifyInstance,
        request: FastifyRequest,
        payload?: unknown,
    ) => Promise<number>,
) {
    return async function (
        this: FastifyInstance,
        request: FastifyRequest,
        reply: FastifyReply,
    ) {
        if (!request.user) {
            return reply.code(401).send({
                error: "Unauthorised",
                message: "Authentication required",
                statusCode: 401,
            } as HttpErrorResponse)
        }

        // For GET requests, we'll handle authorization in preSerialization
        if (request.method === "GET") {
            return
        }

        return await authorise(authoriserFn, this, request, reply)
    }
}

/**
 * Create a preSerialization hook for GET request authorization
 */
export function createGetAuthorizer(
    authoriserFn: (
        fastify: FastifyInstance,
        request: FastifyRequest,
        payload?: unknown,
    ) => Promise<number>,
) {
    return async function (
        this: FastifyInstance,
        request: FastifyRequest,
        reply: FastifyReply,
        payload: unknown,
    ) {
        if (!request.user) {
            return reply.code(401).send({
                error: "Unauthorised",
                message: "Authentication required",
                statusCode: 401,
            } as HttpErrorResponse)
        }

        if (request.method !== "GET") {
            return
        }

        return await authorise(authoriserFn, this, request, reply, payload)
    }
}

/**
 * Fastify plugin for authorisation of incoming requests
 */
const AuthorisationPlugin: FastifyPluginAsync = async (
    fastify: FastifyInstance,
    _options: FastifyPluginOptions,
) => {
    // Decorate fastify with authorization rules
    fastify.decorate("authorisationRules", new AuthorisationRules())
}

export default fp(AuthorisationPlugin, {
    name: "authorisation",
})
