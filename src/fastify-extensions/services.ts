import { FastifyInstance } from "fastify"
import fp from "fastify-plugin"
import { getServices } from "../services"

/**
 * Plugin that adds business logic services to the Fastify instance
 * @param fastify
 */
async function services(fastify: FastifyInstance) {
    fastify.decorate(
        "services",
        getServices(fastify.db, fastify.log, fastify.events),
    )
}

export default fp(services, {
    name: "services",
    dependencies: ["db", "events"],
})
