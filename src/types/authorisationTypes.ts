import { FastifyInstance, FastifyRequest } from "fastify"

export type RequestAuthoriser = (
    fastify: FastifyInstance,
    request: FastifyRequest,
    payload?: any,
) => Promise<number>
