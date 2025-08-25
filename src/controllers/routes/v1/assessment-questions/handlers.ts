import { RouteHandler } from "fastify"
import { mapToErrorResponse } from "controllers/errors"
import { ServiceError, ServiceErrorType } from "types/serviceError"
import {
    AssessmentQuestionCreate,
    AssessmentQuestionUpdate,
} from "types/assessment"

// Get all questions for a template
export const getQuestions: RouteHandler<{
    Querystring: { templateId?: string }
}> = async function (this, request, reply) {
    const service = this.services.getAssessmentQuestionService()
    try {
        const { templateId } = request.query
        if (!templateId) {
            const resp = mapToErrorResponse(
                new ServiceError(
                    ServiceErrorType.InvalidInput,
                    "templateId is required",
                ),
                "templateId is required",
            )
            return reply.code(resp.code).send(resp.returnError())
        }

        const questions = await service.getQuestionsByTemplateId(templateId)
        return { questions }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to get questions")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Get question by ID
export const getQuestionById: RouteHandler<{
    Params: { id: string }
}> = async function (this, request, reply) {
    const service = this.services.getAssessmentQuestionService()
    try {
        const question = await service.getQuestionById(request.params.id)
        if (!question) {
            const resp = mapToErrorResponse(
                new ServiceError(
                    ServiceErrorType.NotFound,
                    "Question not found",
                ),
                "Question not found",
            )
            return reply.code(resp.code).send(resp.returnError())
        }
        return { question }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to get question")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Create question
export const createQuestion: RouteHandler<{
    Body: AssessmentQuestionCreate
}> = async function (this, request, reply) {
    const service = this.services.getAssessmentQuestionService()
    try {
        const question = await service.createQuestion(request.body)
        return reply.code(201).send({ question })
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to create question")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Update question
export const updateQuestion: RouteHandler<{
    Params: { id: string }
    Body: AssessmentQuestionUpdate
}> = async function (this, request, reply) {
    const service = this.services.getAssessmentQuestionService()
    try {
        const question = await service.updateQuestion(
            request.params.id,
            request.body,
        )
        return { question }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to update question")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Delete question
export const deleteQuestion: RouteHandler<{
    Params: { id: string }
}> = async function (this, request, reply) {
    const service = this.services.getAssessmentQuestionService()
    try {
        await service.deleteQuestion(request.params.id)
        return { message: "Question deleted successfully" }
    } catch (err) {
        const resp = mapToErrorResponse(err, "Failed to delete question")
        return reply.code(resp.code).send(resp.returnError())
    }
}

// Get answer distribution for a question
export const getAnswerDistribution: RouteHandler<{
    Params: { id: string }
}> = async function (this, request, reply) {
    const service = this.services.getAssessmentQuestionService()
    try {
        const distribution = await service.getAnswerDistribution(
            request.params.id,
        )
        return { distribution }
    } catch (err) {
        const resp = mapToErrorResponse(
            err,
            "Failed to get answer distribution",
        )
        return reply.code(resp.code).send(resp.returnError())
    }
}
