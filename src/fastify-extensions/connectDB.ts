import { DB } from "persistence/db"
import {
    FastifyInstance,
    FastifyPluginAsync,
    FastifyPluginOptions,
} from "fastify"
import fp from "fastify-plugin"

function connectDB(db: DB): FastifyPluginAsync {
    return fp(
        async (fastify: FastifyInstance, _options: FastifyPluginOptions) => {
            try {
                fastify.decorate("db", db)
            } catch (error) {
                console.error(error)
            }
        },
        {
            name: "db",
        },
    )
}

export default connectDB
