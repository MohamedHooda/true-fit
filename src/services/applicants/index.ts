import {
    Applicant,
    ApplicantWithAssessments,
    ApplicantCreate,
    ApplicantUpdate,
    ApplicantFilters,
    ApplicantStats,
} from "types/applicant"
import { ApplicantPool } from "persistence/db/pool/applicants"
import { ITrueFitEventRelaying } from "services/events"

export interface IApplicantService {
    /**
     * Get an applicant by ID
     * @param {string} id - The ID of the applicant to get
     * @returns {Promise<ApplicantWithAssessments | null>} - The applicant with details
     */
    getApplicantById(id: string): Promise<ApplicantWithAssessments | null>

    /**
     * Get an applicant by email
     * @param {string} email - The email of the applicant to get
     * @returns {Promise<Applicant | null>} - The applicant
     */
    getApplicantByEmail(email: string): Promise<Applicant | null>

    /**
     * Create an applicant
     * @param {ApplicantCreate} applicant - The applicant to create
     * @returns {Promise<Applicant>} - The created applicant
     */
    createApplicant(applicant: ApplicantCreate): Promise<Applicant>

    /**
     * Delete an applicant
     * @param {string} id - The ID of the applicant to delete
     * @returns {Promise<void>}
     */
    deleteApplicant(id: string): Promise<void>

    /**
     * Get all applicants with filtering
     * @param {ApplicantFilters} filters - Filters to apply
     * @param {number} limit - Maximum number of applicants to return
     * @param {number} offset - Number of applicants to skip
     * @returns {Promise<Applicant[]>} - The applicants
     */
    getApplicants(
        filters?: ApplicantFilters,
        limit?: number,
        offset?: number,
    ): Promise<Applicant[]>

    /**
     * Update an applicant
     * @param {string} id - The ID of the applicant to update
     * @param {ApplicantUpdate} applicant - The applicant data to update
     * @returns {Promise<Applicant>} - The updated applicant
     */
    updateApplicant(id: string, applicant: ApplicantUpdate): Promise<Applicant>

    /**
     * Get applicant statistics
     * @returns {Promise<ApplicantStats>}
     */
    getApplicantStats(): Promise<ApplicantStats>
}

class ApplicantService implements IApplicantService {
    constructor(
        private readonly pool: ApplicantPool,
        private readonly events: ITrueFitEventRelaying,
    ) {}

    async getApplicantById(
        id: string,
    ): Promise<ApplicantWithAssessments | null> {
        return this.pool.getApplicantWithDetails(id)
    }

    async getApplicantByEmail(email: string): Promise<Applicant | null> {
        return this.pool.getApplicantByEmail(email)
    }

    async createApplicant(applicant: ApplicantCreate): Promise<Applicant> {
        // Validate email uniqueness
        const existingApplicant = await this.pool.getApplicantByEmail(
            applicant.email,
        )
        if (existingApplicant) {
            throw new Error("Applicant with this email already exists")
        }

        const createdApplicant = await this.pool.createApplicant(applicant)

        // TODO: Add APPLICANT event types
        // await this.events.dispatchEvent({
        //     type: "APPLICANT_CREATED",
        //     payload: {
        //         applicantId: createdApplicant.id,
        //         email: createdApplicant.email,
        //         name: `${createdApplicant.firstName} ${createdApplicant.lastName}`
        //     }
        // })

        return createdApplicant
    }

    async deleteApplicant(id: string): Promise<void> {
        // Get applicant before deletion for event
        const applicant = await this.pool.getApplicantById(id)

        await this.pool.deleteApplicant(id)

        if (applicant) {
            // TODO: Add APPLICANT event types
            // await this.events.dispatchEvent({
            //     type: "APPLICANT_DELETED",
            //     payload: {
            //         applicantId: id,
            //         email: applicant.email,
            //         name: `${applicant.firstName} ${applicant.lastName}`
            //     }
            // })
        }
    }

    async getApplicants(
        filters?: ApplicantFilters,
        limit?: number,
        offset?: number,
    ): Promise<Applicant[]> {
        return this.pool.getApplicants(filters, limit, offset)
    }

    async updateApplicant(
        id: string,
        applicant: ApplicantUpdate,
    ): Promise<Applicant> {
        const updatedApplicant = await this.pool.updateApplicant(id, applicant)

        // TODO: Add APPLICANT event types
        // await this.events.dispatchEvent({
        //     type: "APPLICANT_UPDATED",
        //     payload: {
        //         applicantId: id,
        //         changes: applicant
        //     }
        // })

        return updatedApplicant
    }

    async getApplicantStats(): Promise<ApplicantStats> {
        return this.pool.getApplicantStats()
    }
}

export default function getApplicantService(
    pool: ApplicantPool,
    events: ITrueFitEventRelaying,
): IApplicantService {
    return new ApplicantService(pool, events)
}
