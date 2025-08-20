import {
    FastifyInstance,
    FastifyPluginAsync,
    FastifyPluginOptions,
} from "fastify"
import * as handlers from "./handlers"
import * as schemas from "./schemas"

const companiesRoutes: FastifyPluginAsync = async (
    fastify: FastifyInstance,
    _options: FastifyPluginOptions,
) => {
    //routes
    fastify.get(
        "/",
        {
            config: { public: true },
            ...schemas.HealthCheckSchema,
        },
        handlers.healthCheck,
    )
}

export default companiesRoutes
