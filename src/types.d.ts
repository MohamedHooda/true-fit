import { DB } from "persistence/db"
import { AuthenticatedUser } from "types/user"
import { type } from "os"
import { ServiceRegistry } from "./services"
import {
    preHandlerHookHandler,
    onRequestHookHandler,
    preSerializationHookHandler,
} from "fastify"
import { ITrueFitEventRelaying } from "services/events"
import { IAuthorisationRules } from "auth/authorisationRules"

declare module "fastify" {
    export interface FastifyInstance {
        db: DB
        services: ServiceRegistry
        events: ITrueFitEventRelaying
        authorisationRules: IAuthorisationRules
        file: (
            options?: Omit<BusboyConfig, "headers">,
        ) => Promise<fastifyMultipart.MultipartFile | undefined>
        requireRole: (allowedRoles: string[]) => preHandlerHookHandler
        authenticate: preHandlerHookHandler
        preHandler: preHandlerHookHandler
        preSerialization: preSerializationHookHandler
    }

    export interface FastifyRequest {
        user?: AuthenticatedUser
    }
    interface FastifyContextConfig {
        public?: boolean
    }
}
