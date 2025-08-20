import { FastifyInstance } from "fastify"
import fp from "fastify-plugin"
import AwaitableEventRelaying from "services/events/awaitable"

/**
 * Plugin that adds an event relaying instance to the Fastify instance
 * @param fastify
 */
async function events(fastify: FastifyInstance) {
    const events = new AwaitableEventRelaying()
    fastify.decorate("events", events)
}

export default fp(events, {
    name: "events",
})
