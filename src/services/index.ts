import { DB } from "persistence/db"
import { Logger } from "types/logging"
import { ITrueFitEventRelaying } from "./events"
import { registerEventHandlers } from "./events/handlers"
import getUserService, { IUserService } from "./users"
import getUserPool from "persistence/db/pool/users"

/**
 * Service registry interface
 */
export interface ServiceRegistry {
    getUserService(): IUserService
}

export class Services implements ServiceRegistry {
    private services = new Map<string, any>()

    constructor(private db: DB, private events: ITrueFitEventRelaying) {}

    private getService(name: string): any {
        const service = this.services.get(name)
        if (!service) {
            throw new Error(`${name} service not found`)
        }
        return service
    }

    getUserService(): IUserService {
        if (!this.services.has("userService")) {
            const userPool = getUserPool(this.db)
            const userService = getUserService(userPool, this.events)
            this.services.set("userService", userService)
        }
        return this.services.get("userService")
    }
}

export function getServices(
    db: DB,
    logger: Logger,
    events: ITrueFitEventRelaying,
): Services {
    const services = new Services(db, events)

    registerEventHandlers(logger, events, services)

    return services
}
