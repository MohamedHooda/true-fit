import { FastifyPluginAsync } from "fastify"
import {
    getApplicants,
    getApplicantById,
    createApplicant,
    updateApplicant,
    deleteApplicant,
} from "./handlers"
import {
    getApplicantsSchema,
    getApplicantByIdSchema,
    createApplicantSchema,
    updateApplicantSchema,
    deleteApplicantSchema,
} from "./schemas"

const applicants: FastifyPluginAsync = async (fastify): Promise<void> => {
    // Get all applicants with filters
    fastify.get("/", {
        schema: {
            ...getApplicantsSchema,
            tags: ["Applicants"],
            summary: "List applicants with search & filters",
        },
        handler: getApplicants,
    })

    // Get applicant by ID
    fastify.get("/:id", {
        schema: {
            ...getApplicantByIdSchema,
            tags: ["Applicants"],
            summary: "Get applicant details",
        },
        handler: getApplicantById,
    })

    // Create applicant
    fastify.post("/", {
        schema: {
            ...createApplicantSchema,
            tags: ["Applicants"],
            summary: "Register new applicant",
        },
        handler: createApplicant,
    })

    // Update applicant
    fastify.put("/:id", {
        schema: {
            ...updateApplicantSchema,
            tags: ["Applicants"],
            summary: "Update applicant",
        },
        handler: updateApplicant,
    })

    // Delete applicant
    fastify.delete("/:id", {
        schema: {
            ...deleteApplicantSchema,
            tags: ["Applicants"],
            summary: "Delete applicant",
        },
        handler: deleteApplicant,
    })
}

export default applicants
