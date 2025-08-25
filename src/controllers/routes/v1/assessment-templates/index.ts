import { FastifyPluginAsync } from "fastify"
import {
    getAssessmentTemplates,
    getAssessmentTemplateById,
    createAssessmentTemplate,
    updateAssessmentTemplate,
    deleteAssessmentTemplate,
    cloneAssessmentTemplate,
    getAssessmentTemplateStats,
} from "./handlers"
import {
    getAssessmentTemplatesSchema,
    getAssessmentTemplateByIdSchema,
    createAssessmentTemplateSchema,
    updateAssessmentTemplateSchema,
    deleteAssessmentTemplateSchema,
    cloneAssessmentTemplateSchema,
    getAssessmentTemplateStatsSchema,
} from "./schemas"

const assessmentTemplates: FastifyPluginAsync = async (
    fastify,
): Promise<void> => {
    // Get all assessment templates with filters
    fastify.get("/", {
        schema: {
            ...getAssessmentTemplatesSchema,
            tags: ["Assessment Templates"],
            summary: "List assessment templates",
        },
        handler: getAssessmentTemplates,
    })

    // Get assessment template by ID
    fastify.get("/:id", {
        schema: {
            ...getAssessmentTemplateByIdSchema,
            tags: ["Assessment Templates"],
            summary: "Get assessment template details",
        },
        handler: getAssessmentTemplateById,
    })

    // Create assessment template
    fastify.post("/", {
        schema: {
            ...createAssessmentTemplateSchema,
            tags: ["Assessment Templates"],
            summary: "Create assessment template",
        },
        handler: createAssessmentTemplate,
    })

    // Update assessment template
    fastify.put("/:id", {
        schema: {
            ...updateAssessmentTemplateSchema,
            tags: ["Assessment Templates"],
            summary: "Update assessment template",
        },
        handler: updateAssessmentTemplate,
    })

    // Delete assessment template
    fastify.delete("/:id", {
        schema: {
            ...deleteAssessmentTemplateSchema,
            tags: ["Assessment Templates"],
            summary: "Delete assessment template",
        },
        handler: deleteAssessmentTemplate,
    })

    // Clone assessment template
    fastify.post("/:id/clone", {
        schema: {
            ...cloneAssessmentTemplateSchema,
            tags: ["Assessment Templates"],
            summary: "Clone assessment template",
        },
        handler: cloneAssessmentTemplate,
    })

    // Get assessment template statistics
    fastify.get("/stats", {
        schema: {
            ...getAssessmentTemplateStatsSchema,
            tags: ["Assessment Templates"],
            summary: "Get assessment template statistics",
        },
        handler: getAssessmentTemplateStats,
    })
}

export default assessmentTemplates
