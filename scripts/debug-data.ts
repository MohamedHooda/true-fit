import dotenv from "dotenv"
dotenv.config()

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function debugData() {
    console.log("Debugging Data Relationships...")

    try {
        // Check jobs and their assessment templates
        console.log("\n📋 Jobs and Assessment Templates:")
        const jobsWithTemplates = await prisma.job.findMany({
            take: 5,
            include: {
                templates: {
                    include: {
                        _count: {
                            select: {
                                questions: true,
                                assessments: true,
                            },
                        },
                    },
                },
                branch: {
                    include: {
                        company: true,
                    },
                },
            },
        })

        for (const job of jobsWithTemplates) {
            console.log(
                `\n🎯 Job: "${job.title}" at ${job.branch.company.name}`,
            )
            console.log(`   Job ID: ${job.id}`)
            console.log(`   Templates: ${job.templates.length}`)

            for (const template of job.templates) {
                console.log(`   📝 Template: "${template.name}"`)
                console.log(`      Questions: ${template._count.questions}`)
                console.log(`      Assessments: ${template._count.assessments}`)
            }
        }

        // Check assessment templates and their job relationships
        console.log("\n\n📚 Assessment Templates:")
        const templates = await prisma.assessmentTemplate.findMany({
            include: {
                job: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                _count: {
                    select: {
                        questions: true,
                        assessments: true,
                    },
                },
            },
        })

        for (const template of templates) {
            console.log(`\n📝 Template: "${template.name}"`)
            console.log(`   Template ID: ${template.id}`)
            console.log(
                `   Job: ${template.job?.title || "No job"} (${
                    template.jobId
                })`,
            )
            console.log(`   Questions: ${template._count.questions}`)
            console.log(
                `   Assessments completed: ${template._count.assessments}`,
            )
        }

        // Check some sample assessments
        console.log("\n\n✍️ Sample Assessments:")
        const assessments = await prisma.applicantAssessment.findMany({
            take: 5,
            include: {
                applicant: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
                template: {
                    include: {
                        job: {
                            select: {
                                title: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        answers: true,
                    },
                },
            },
        })

        for (const assessment of assessments) {
            console.log(
                `\n✍️ Assessment by ${assessment.applicant.firstName} ${assessment.applicant.lastName}`,
            )
            console.log(`   Template: ${assessment.template.name}`)
            console.log(`   Job: ${assessment.template.job?.title || "No job"}`)
            console.log(`   Answers: ${assessment._count.answers}`)
            console.log(`   Submitted: ${assessment.submittedAt}`)
        }

        // Check if any assessments are linked to jobs through templates
        console.log("\n\nAssessment-Job Linkage Test:")
        const testQuery = await prisma.applicantAssessment.findMany({
            where: {
                template: {
                    jobId: {
                        not: null,
                    },
                },
            },
            take: 3,
            include: {
                template: {
                    include: {
                        job: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
            },
        })

        console.log(`Found ${testQuery.length} assessments linked to jobs`)
        for (const assessment of testQuery) {
            console.log(
                `   Assessment ${assessment.id} -> Job "${assessment.template.job?.title}" (${assessment.template.jobId})`,
            )
        }

        console.log("\n✅ Data debugging completed!")
    } catch (error) {
        console.error("❌ Debug failed:", error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Run the debug
debugData().catch((error) => {
    console.error("💥 Fatal error in debug script:", error)
    process.exit(1)
})
