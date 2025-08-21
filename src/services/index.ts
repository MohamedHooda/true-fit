import { DB } from "persistence/db"
import { Logger } from "types/logging"
import { ITrueFitEventRelaying } from "./events"
import { registerEventHandlers } from "./events/handlers"
import getUserService, { IUserService } from "./users"
import getUserPool from "persistence/db/pool/users"
import getCompanyService, { ICompanyService } from "./companies"
import getCompanyPool from "persistence/db/pool/companies"
import getBranchService, { IBranchService } from "./branches"
import getBranchPool from "persistence/db/pool/branches"

/**
 * Service registry interface
 */
export interface ServiceRegistry {
    getUserService(): IUserService
    getCompanyService(): ICompanyService
    getBranchService(): IBranchService
}

export class Services implements ServiceRegistry {
    private services = new Map<string, any>()

    constructor(
        private db: DB,
        private logger: Logger,
        private events: ITrueFitEventRelaying,
    ) {}

    private getService(name: string): any {
        const service = this.services.get(name)
        if (!service) {
            throw new Error(`${name} service not found`)
        }
        return service
    }

    getUserService(): IUserService {
        if (!this.services.has("userService")) {
            const userPool = getUserPool(this.db, this.logger)
            const userService = getUserService(userPool, this.events)
            this.services.set("userService", userService)
        }
        return this.services.get("userService")
    }

    getCompanyService(): ICompanyService {
        if (!this.services.has("companyService")) {
            const companyPool = getCompanyPool(this.db, this.logger)
            const companyService = getCompanyService(companyPool, this.events)
            this.services.set("companyService", companyService)
        }
        return this.services.get("companyService")
    }

    getBranchService(): IBranchService {
        if (!this.services.has("branchService")) {
            const branchPool = getBranchPool(this.db, this.logger)
            const companyPool = getCompanyPool(this.db, this.logger)
            const branchService = getBranchService(
                branchPool,
                companyPool,
                this.events,
            )
            this.services.set("branchService", branchService)
        }
        return this.services.get("branchService")
    }
}

export function getServices(
    db: DB,
    logger: Logger,
    events: ITrueFitEventRelaying,
): Services {
    const services = new Services(db, logger, events)

    registerEventHandlers(logger, events, services)

    return services
}
