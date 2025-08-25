import {
    AssessmentTemplate,
    AssessmentTemplateWithDetails,
    AssessmentTemplateCreate,
    AssessmentTemplateUpdate,
    AssessmentTemplateFilters,
    AssessmentTemplateStats,
} from "types/assessment"
import { AssessmentTemplatePool } from "persistence/db/pool/assessment-templates"
import { ITrueFitEventRelaying } from "services/events"
import { ServiceError, ServiceErrorType } from "types/serviceError"

export interface IAssessmentTemplateService {
    /**
     * Get an assessment template by ID
     * @param {string} id - The ID of the template to get
     * @returns {Promise<AssessmentTemplateWithDetails | null>} - The template with details
     */
    getAssessmentTemplateById(
        id: string,
    ): Promise<AssessmentTemplateWithDetails | null>

    /**
     * Create an assessment template
     * @param {AssessmentTemplateCreate} template - The template to create
     * @returns {Promise<AssessmentTemplate>} - The created template
     */
    createAssessmentTemplate(
        template: AssessmentTemplateCreate,
    ): Promise<AssessmentTemplate>

    /**
     * Delete an assessment template
     * @param {string} id - The ID of the template to delete
     * @returns {Promise<void>}
     */
    deleteAssessmentTemplate(id: string): Promise<void>

    /**
     * Get all assessment templates with filtering
     * @param {AssessmentTemplateFilters} filters - Filters to apply
     * @param {number} limit - Maximum number of templates to return
     * @param {number} offset - Number of templates to skip
     * @returns {Promise<AssessmentTemplateWithDetails[]>} - The templates with details
     */
    getAssessmentTemplates(
        filters?: AssessmentTemplateFilters,
        limit?: number,
        offset?: number,
    ): Promise<AssessmentTemplateWithDetails[]>

    /**
     * Update an assessment template
     * @param {string} id - The ID of the template to update
     * @param {AssessmentTemplateUpdate} template - The template data to update
     * @returns {Promise<AssessmentTemplate>} - The updated template
     */
    updateAssessmentTemplate(
        id: string,
        template: AssessmentTemplateUpdate,
    ): Promise<AssessmentTemplate>

    /**
     * Duplicate an assessment template
     * @param {string} id - The ID of the template to duplicate
     * @param {string} newName - The name for the new template
     * @param {string} newJobId - Optional new job ID for the duplicated template
     * @returns {Promise<AssessmentTemplate>} - The duplicated template
     */
    duplicateAssessmentTemplate(
        id: string,
        newName: string,
        newJobId?: string,
    ): Promise<AssessmentTemplate>

    /**
     * Get assessment template statistics
     * @param {string} companyId - Optional company ID to filter by
     * @returns {Promise<AssessmentTemplateStats>}
     */
    getAssessmentTemplateStats(
        companyId?: string,
    ): Promise<AssessmentTemplateStats>
}

class AssessmentTemplateService implements IAssessmentTemplateService {
    constructor(
        private readonly pool: AssessmentTemplatePool,
        private readonly events: ITrueFitEventRelaying,
    ) {}

    async getAssessmentTemplateById(
        id: string,
    ): Promise<AssessmentTemplateWithDetails | null> {
        return this.pool.getAssessmentTemplateWithDetails(id)
    }

    async createAssessmentTemplate(
        template: AssessmentTemplateCreate,
    ): Promise<AssessmentTemplate> {
        // Validate template name uniqueness for the job
        const nameExists = await this.pool.templateNameExistsForJob(
            template.jobId ?? null,
            template.name,
        )
        if (nameExists) {
            throw new ServiceError(
                ServiceErrorType.DuplicateValue,
                "Template with this name already exists for this job",
            )
        }

        const createdTemplate = await this.pool.createAssessmentTemplate(
            template,
        )

        // await this.events.dispatchEvent({
        //     type: "ASSESSMENT_TEMPLATE_CREATED",
        //     payload: {
        //         templateId: createdTemplate.id,
        //         name: createdTemplate.name,
        //         jobId: createdTemplate.jobId
        //     }
        // })

        return createdTemplate
    }

    async deleteAssessmentTemplate(id: string): Promise<void> {
        // Get template before deletion for event
        const template = await this.pool.getAssessmentTemplateById(id)

        await this.pool.deleteAssessmentTemplate(id)

        if (template) {
            // await this.events.dispatchEvent({
            //     type: "ASSESSMENT_TEMPLATE_DELETED",
            //     payload: {
            //         templateId: id,
            //         name: template.name,
            //         jobId: template.jobId
            //     }
            // })
        }
    }

    async getAssessmentTemplates(
        filters?: AssessmentTemplateFilters,
        limit?: number,
        offset?: number,
    ): Promise<AssessmentTemplateWithDetails[]> {
        return this.pool.getAssessmentTemplates(filters, limit, offset)
    }

    async updateAssessmentTemplate(
        id: string,
        template: AssessmentTemplateUpdate,
    ): Promise<AssessmentTemplate> {
        // Validate template name uniqueness if name is being updated
        if (template.name) {
            const existingTemplate = await this.pool.getAssessmentTemplateById(
                id,
            )
            if (existingTemplate) {
                const nameExists = await this.pool.templateNameExistsForJob(
                    existingTemplate.jobId ?? null,
                    template.name,
                    id,
                )
                if (nameExists) {
                    throw new ServiceError(
                        ServiceErrorType.DuplicateValue,
                        "Template with this name already exists for this job",
                    )
                }
            }
        }

        const updatedTemplate = await this.pool.updateAssessmentTemplate(
            id,
            template,
        )

        // await this.events.dispatchEvent({
        //     type: "ASSESSMENT_TEMPLATE_UPDATED",
        //     payload: {
        //         templateId: id,
        //         changes: template
        //     }
        // })

        return updatedTemplate
    }

    async duplicateAssessmentTemplate(
        id: string,
        newName: string,
        newJobId?: string,
    ): Promise<AssessmentTemplate> {
        // Validate new template name uniqueness
        const nameExists = await this.pool.templateNameExistsForJob(
            newJobId ?? null,
            newName,
        )
        if (nameExists) {
            throw new Error(
                "Template with this name already exists for this job",
            )
        }

        const duplicatedTemplate = await this.pool.duplicateAssessmentTemplate(
            id,
            newName,
            newJobId,
        )

        // await this.events.dispatchEvent({
        //     type: "ASSESSMENT_TEMPLATE_DUPLICATED",
        //     payload: {
        //         sourceTemplateId: id,
        //         newTemplateId: duplicatedTemplate.id,
        //         newName,
        //         newJobId
        //     }
        // })

        return duplicatedTemplate
    }

    async getAssessmentTemplateStats(
        companyId?: string,
    ): Promise<AssessmentTemplateStats> {
        return this.pool.getAssessmentTemplateStats(companyId)
    }
}

export default function getAssessmentTemplateService(
    pool: AssessmentTemplatePool,
    events: ITrueFitEventRelaying,
): IAssessmentTemplateService {
    return new AssessmentTemplateService(pool, events)
}
