import { RouteHandler } from "fastify"

export const healthCheck: RouteHandler = async function (
    this,
    request,
    response,
) {
    try {
        return response.code(200).send({ message: "OK" })
    } catch (err) {
        return response.code(500).send({ error: "Internal server error" })
    }
}
