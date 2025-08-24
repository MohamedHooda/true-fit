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
import getJobService, { IJobService } from "./jobs"
import getApplicantService, { IApplicantService } from "./applicants"
import getAssessmentTemplateService, {
    IAssessmentTemplateService,
} from "./assessment-templates"
import getJobPool from "persistence/db/pool/jobs"
import getApplicantPool from "persistence/db/pool/applicants"
import getJobApplicationPool from "persistence/db/pool/job-applications"
import getAssessmentTemplatePool from "persistence/db/pool/assessment-templates"
import getAssessmentQuestionPool from "persistence/db/pool/assessment-questions"
import getApplicantAssessmentPool from "persistence/db/pool/applicant-assessments"
import getApplicantAnswerPool from "persistence/db/pool/applicant-answers"
import getScoringConfigPool from "persistence/db/pool/scoring-configs"

/**
 * Pool registry interface for direct database access
 */
export interface PoolRegistry {
    getUserPool(): ReturnType<typeof getUserPool>
    getCompanyPool(): ReturnType<typeof getCompanyPool>
    getBranchPool(): ReturnType<typeof getBranchPool>
    getJobPool(): ReturnType<typeof getJobPool>
    getApplicantPool(): ReturnType<typeof getApplicantPool>
    getJobApplicationPool(): ReturnType<typeof getJobApplicationPool>
    getAssessmentTemplatePool(): ReturnType<typeof getAssessmentTemplatePool>
    getAssessmentQuestionPool(): ReturnType<typeof getAssessmentQuestionPool>
    getApplicantAssessmentPool(): ReturnType<typeof getApplicantAssessmentPool>
    getApplicantAnswerPool(): ReturnType<typeof getApplicantAnswerPool>
    getScoringConfigPool(): ReturnType<typeof getScoringConfigPool>
}

/**
 * Service registry interface
 */
export interface ServiceRegistry {
    getUserService(): IUserService
    getCompanyService(): ICompanyService
    getBranchService(): IBranchService
    getJobService(): IJobService
    getApplicantService(): IApplicantService
    getAssessmentTemplateService(): IAssessmentTemplateService
}

export class Services implements ServiceRegistry, PoolRegistry {
    private services = new Map<string, any>()
    private pools = new Map<string, any>()

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

    getJobService(): IJobService {
        if (!this.services.has("jobService")) {
            const jobPool = getJobPool(this.db, this.logger)
            const jobService = getJobService(jobPool, this.events)
            this.services.set("jobService", jobService)
        }
        return this.services.get("jobService")
    }

    getApplicantService(): IApplicantService {
        if (!this.services.has("applicantService")) {
            const applicantPool = getApplicantPool(this.db, this.logger)
            const applicantService = getApplicantService(
                applicantPool,
                this.events,
            )
            this.services.set("applicantService", applicantService)
        }
        return this.services.get("applicantService")
    }

    getAssessmentTemplateService(): IAssessmentTemplateService {
        if (!this.services.has("assessmentTemplateService")) {
            const assessmentTemplatePool = getAssessmentTemplatePool(
                this.db,
                this.logger,
            )
            const assessmentTemplateService = getAssessmentTemplateService(
                assessmentTemplatePool,
                this.events,
            )
            this.services.set(
                "assessmentTemplateService",
                assessmentTemplateService,
            )
        }
        return this.services.get("assessmentTemplateService")
    }

    // Pool methods for direct database access
    getUserPool(): ReturnType<typeof getUserPool> {
        if (!this.pools.has("userPool")) {
            const userPool = getUserPool(this.db, this.logger)
            this.pools.set("userPool", userPool)
        }
        return this.pools.get("userPool")
    }

    getCompanyPool(): ReturnType<typeof getCompanyPool> {
        if (!this.pools.has("companyPool")) {
            const companyPool = getCompanyPool(this.db, this.logger)
            this.pools.set("companyPool", companyPool)
        }
        return this.pools.get("companyPool")
    }

    getBranchPool(): ReturnType<typeof getBranchPool> {
        if (!this.pools.has("branchPool")) {
            const branchPool = getBranchPool(this.db, this.logger)
            this.pools.set("branchPool", branchPool)
        }
        return this.pools.get("branchPool")
    }

    getJobPool(): ReturnType<typeof getJobPool> {
        if (!this.pools.has("jobPool")) {
            const jobPool = getJobPool(this.db, this.logger)
            this.pools.set("jobPool", jobPool)
        }
        return this.pools.get("jobPool")
    }

    getApplicantPool(): ReturnType<typeof getApplicantPool> {
        if (!this.pools.has("applicantPool")) {
            const applicantPool = getApplicantPool(this.db, this.logger)
            this.pools.set("applicantPool", applicantPool)
        }
        return this.pools.get("applicantPool")
    }

    getJobApplicationPool(): ReturnType<typeof getJobApplicationPool> {
        if (!this.pools.has("jobApplicationPool")) {
            const jobApplicationPool = getJobApplicationPool(
                this.db,
                this.logger,
            )
            this.pools.set("jobApplicationPool", jobApplicationPool)
        }
        return this.pools.get("jobApplicationPool")
    }

    getAssessmentTemplatePool(): ReturnType<typeof getAssessmentTemplatePool> {
        if (!this.pools.has("assessmentTemplatePool")) {
            const assessmentTemplatePool = getAssessmentTemplatePool(
                this.db,
                this.logger,
            )
            this.pools.set("assessmentTemplatePool", assessmentTemplatePool)
        }
        return this.pools.get("assessmentTemplatePool")
    }

    getAssessmentQuestionPool(): ReturnType<typeof getAssessmentQuestionPool> {
        if (!this.pools.has("assessmentQuestionPool")) {
            const assessmentQuestionPool = getAssessmentQuestionPool(
                this.db,
                this.logger,
            )
            this.pools.set("assessmentQuestionPool", assessmentQuestionPool)
        }
        return this.pools.get("assessmentQuestionPool")
    }

    getApplicantAssessmentPool(): ReturnType<
        typeof getApplicantAssessmentPool
    > {
        if (!this.pools.has("applicantAssessmentPool")) {
            const applicantAssessmentPool = getApplicantAssessmentPool(
                this.db,
                this.logger,
            )
            this.pools.set("applicantAssessmentPool", applicantAssessmentPool)
        }
        return this.pools.get("applicantAssessmentPool")
    }

    getApplicantAnswerPool(): ReturnType<typeof getApplicantAnswerPool> {
        if (!this.pools.has("applicantAnswerPool")) {
            const applicantAnswerPool = getApplicantAnswerPool(
                this.db,
                this.logger,
            )
            this.pools.set("applicantAnswerPool", applicantAnswerPool)
        }
        return this.pools.get("applicantAnswerPool")
    }

    getScoringConfigPool(): ReturnType<typeof getScoringConfigPool> {
        if (!this.pools.has("scoringConfigPool")) {
            const scoringConfigPool = getScoringConfigPool(this.db, this.logger)
            this.pools.set("scoringConfigPool", scoringConfigPool)
        }
        return this.pools.get("scoringConfigPool")
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
