import { DB } from "persistence/db"
import { AuthenticatedUser } from "types/user"
import { type } from "os"
import { ServiceRegistry } from "services"
import { preHandlerHookHandler } from "fastify"
import { ITrueFitEventRelaying } from "services/events"

declare module "fastify" {
    export interface FastifyInstance {
        db: DB
        services: ServiceRegistry
        events: ITrueFitEventRelaying
        file: (
            options?: Omit<BusboyConfig, "headers">,
        ) => Promise<fastifyMultipart.MultipartFile | undefined>
        requireRole: (allowedRoles: string[]) => preHandlerHookHandler
        authenticate: preHandlerHookHandler
    }

    export interface FastifyRequest {
        user?: AuthenticatedUser
    }
    interface FastifyContextConfig {
        public?: boolean
    }
}
