import {
    AssessmentQuestion,
    AssessmentQuestionWithDetails,
    AssessmentQuestionCreate,
    AssessmentQuestionUpdate,
} from "types/assessment"
import { AssessmentQuestionPool } from "persistence/db/pool/assessment-questions"
import { ITrueFitEventRelaying } from "services/events"

export interface IAssessmentQuestionService {
    /**
     * Get an assessment question by ID
     * @param {string} id - The ID of the question to get
     * @returns {Promise<AssessmentQuestionWithDetails | null>} - The question with details
     */
    getQuestionById(id: string): Promise<AssessmentQuestionWithDetails | null>

    /**
     * Get assessment questions by template ID
     * @param {string} templateId - The ID of the template
     * @returns {Promise<AssessmentQuestion[]>} - The questions for the template
     */
    getQuestionsByTemplateId(templateId: string): Promise<AssessmentQuestion[]>

    /**
     * Create an assessment question
     * @param {AssessmentQuestionCreate} question - The question to create
     * @returns {Promise<AssessmentQuestion>} - The created question
     */
    createQuestion(
        question: AssessmentQuestionCreate,
    ): Promise<AssessmentQuestion>

    /**
     * Update an assessment question
     * @param {string} id - The ID of the question to update
     * @param {AssessmentQuestionUpdate} question - The question data to update
     * @returns {Promise<AssessmentQuestion>} - The updated question
     */
    updateQuestion(
        id: string,
        question: AssessmentQuestionUpdate,
    ): Promise<AssessmentQuestion>

    /**
     * Delete an assessment question
     * @param {string} id - The ID of the question to delete
     * @returns {Promise<void>}
     */
    deleteQuestion(id: string): Promise<void>
}

class AssessmentQuestionService implements IAssessmentQuestionService {
    constructor(
        private readonly pool: AssessmentQuestionPool,
        private readonly events: ITrueFitEventRelaying,
    ) {}

    async getQuestionById(
        id: string,
    ): Promise<AssessmentQuestionWithDetails | null> {
        return this.pool.getAssessmentQuestionWithDetails(id)
    }

    async getQuestionsByTemplateId(
        templateId: string,
    ): Promise<AssessmentQuestion[]> {
        return this.pool.getAssessmentQuestionsByTemplateId(templateId)
    }

    async createQuestion(
        question: AssessmentQuestionCreate,
    ): Promise<AssessmentQuestion> {
        const createdQuestion = await this.pool.createAssessmentQuestion(
            question,
        )

        // TODO: Add ASSESSMENT_QUESTION event types
        // await this.events.dispatchEvent({
        //     type: "ASSESSMENT_QUESTION_CREATED",
        //     payload: {
        //         questionId: createdQuestion.id,
        //         templateId: createdQuestion.templateId,
        //     }
        // })

        return createdQuestion
    }

    async updateQuestion(
        id: string,
        question: AssessmentQuestionUpdate,
    ): Promise<AssessmentQuestion> {
        const updatedQuestion = await this.pool.updateAssessmentQuestion(
            id,
            question,
        )

        // TODO: Add ASSESSMENT_QUESTION event types
        // await this.events.dispatchEvent({
        //     type: "ASSESSMENT_QUESTION_UPDATED",
        //     payload: {
        //         questionId: id,
        //         changes: question,
        //     }
        // })

        return updatedQuestion
    }

    async deleteQuestion(id: string): Promise<void> {
        // Get question before deletion for event
        const question = await this.pool.getAssessmentQuestionById(id)

        await this.pool.deleteAssessmentQuestion(id)

        if (question) {
            // TODO: Add ASSESSMENT_QUESTION event types
            // await this.events.dispatchEvent({
            //     type: "ASSESSMENT_QUESTION_DELETED",
            //     payload: {
            //         questionId: id,
            //         templateId: question.templateId,
            //     }
            // })
        }
    }
}

export default function getAssessmentQuestionService(
    pool: AssessmentQuestionPool,
    events: ITrueFitEventRelaying,
): IAssessmentQuestionService {
    return new AssessmentQuestionService(pool, events)
}
