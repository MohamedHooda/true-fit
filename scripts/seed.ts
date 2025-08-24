import dotenv from "dotenv"
dotenv.config()

import { PrismaClient, QuestionType, JobStatus } from "@prisma/client"
import { faker } from "@faker-js/faker"

const prisma = new PrismaClient()

// Seed configuration
const SEED_CONFIG = {
    companies: 4,
    branchesPerCompany: [2, 3, 4, 2], // Different number of branches per company
    jobsPerBranch: 2,
    applicants: 1000,
    assessmentTemplates: 3,
    questionsPerTemplate: [15, 20, 25], // Different number of questions per template
    maxAnswersPerApplicant: 50, // Some applicants may not complete all assessments
}

// Company and job data templates
const COMPANY_DATA = [
    {
        name: "DB Schenker",
        description: "Leading global logistics provider",
        website: "https://dbschenker.com",
        cities: ["Berlin", "Munich", "Hamburg", "Frankfurt"],
    },
    {
        name: "DHL Group",
        description: "International express delivery and logistics",
        website: "https://dhl.com",
        cities: ["Cologne", "Leipzig", "Dusseldorf"],
    },
    {
        name: "Kuehne + Nagel",
        description: "Integrated logistics solutions worldwide",
        website: "https://kuehne-nagel.com",
        cities: ["Hamburg", "Bremen", "Stuttgart"],
    },
    {
        name: "DSV Logistics",
        description: "Transport and logistics solutions",
        website: "https://dsv.com",
        cities: ["Berlin", "Nuremberg"],
    },
]

const JOB_TEMPLATES = [
    {
        title: "Warehouse Operator",
        description:
            "Responsible for order picking, packing, and inventory management in our modern warehouse facilities. Must be able to work efficiently in a fast-paced environment.",
        requirements:
            "Physical fitness, attention to detail, basic computer skills, forklift license preferred",
    },
    {
        title: "Logistics Coordinator",
        description:
            "Coordinate transportation, manage shipments, and ensure timely delivery of goods. Interface with drivers, customers, and warehouse teams.",
        requirements:
            "Strong communication skills, logistics experience, problem-solving abilities, scheduling software proficiency",
    },
    {
        title: "Delivery Driver",
        description:
            "Deliver packages to customers across assigned routes. Provide excellent customer service and maintain delivery schedules.",
        requirements:
            "Valid driver's license, clean driving record, customer service skills, physical ability to lift packages",
    },
    {
        title: "Inventory Specialist",
        description:
            "Manage inventory levels, conduct cycle counts, and maintain accurate stock records. Work with warehouse management systems.",
        requirements:
            "Inventory management experience, WMS proficiency, analytical skills, attention to detail",
    },
]

const ASSESSMENT_QUESTIONS = {
    logistics: [
        {
            text: "What is the most important factor when handling fragile packages?",
            type: "MULTIPLE_CHOICE" as QuestionType,
            correctAnswer: "Proper cushioning and gentle handling",
            weight: 2.0,
        },
        {
            text: "How should you prioritize deliveries when running behind schedule?",
            type: "MULTIPLE_CHOICE" as QuestionType,
            correctAnswer: "Time-sensitive and high-priority deliveries first",
            weight: 1.5,
        },
        {
            text: "What does FIFO stand for in inventory management?",
            type: "MULTIPLE_CHOICE" as QuestionType,
            correctAnswer: "First In, First Out",
            weight: 1.0,
        },
        {
            text: "Safety equipment must be worn at all times in the warehouse.",
            type: "TRUE_FALSE" as QuestionType,
            correctAnswer: "true",
            weight: 2.0,
        },
        {
            text: "When should you report damaged inventory?",
            type: "MULTIPLE_CHOICE" as QuestionType,
            correctAnswer: "Immediately upon discovery",
            weight: 1.5,
        },
    ],
    safety: [
        {
            text: "What should you do if you notice a spill on the warehouse floor?",
            type: "MULTIPLE_CHOICE" as QuestionType,
            correctAnswer: "Clean it immediately and report to supervisor",
            weight: 2.5,
        },
        {
            text: "Maximum lifting weight without mechanical assistance is 25kg.",
            type: "TRUE_FALSE" as QuestionType,
            correctAnswer: "false", // Usually lower, around 20kg
            weight: 2.0,
        },
        {
            text: "How often should safety equipment be inspected?",
            type: "MULTIPLE_CHOICE" as QuestionType,
            correctAnswer: "Before each use",
            weight: 1.5,
        },
        {
            text: "What is the first step when operating a forklift?",
            type: "MULTIPLE_CHOICE" as QuestionType,
            correctAnswer: "Pre-operation safety check",
            weight: 2.0,
        },
        {
            text: "Emergency exits must always remain clear and unlocked.",
            type: "TRUE_FALSE" as QuestionType,
            correctAnswer: "true",
            weight: 2.5,
        },
    ],
    general: [
        {
            text: "How do you handle a customer complaint about a delayed delivery?",
            type: "MULTIPLE_CHOICE" as QuestionType,
            correctAnswer:
                "Listen actively, apologize, and provide solution options",
            weight: 1.5,
        },
        {
            text: "Teamwork is more important than individual performance.",
            type: "TRUE_FALSE" as QuestionType,
            correctAnswer: "true",
            weight: 1.0,
        },
        {
            text: "What should you do if you can't complete your assigned tasks on time?",
            type: "MULTIPLE_CHOICE" as QuestionType,
            correctAnswer: "Inform supervisor early and request assistance",
            weight: 1.5,
        },
        {
            text: "Quality control is everyone's responsibility.",
            type: "TRUE_FALSE" as QuestionType,
            correctAnswer: "true",
            weight: 1.0,
        },
        {
            text: "How do you maintain accuracy when processing high volumes?",
            type: "MULTIPLE_CHOICE" as QuestionType,
            correctAnswer: "Double-check work and use systematic approach",
            weight: 2.0,
        },
    ],
}

// Answer options for multiple choice questions
const ANSWER_OPTIONS: { [key: string]: string[] } = {
    "What is the most important factor when handling fragile packages?": [
        "Proper cushioning and gentle handling", // Correct
        "Speed of delivery",
        "Package weight",
        "Delivery route optimization",
    ],
    "How should you prioritize deliveries when running behind schedule?": [
        "Closest locations first",
        "Time-sensitive and high-priority deliveries first", // Correct
        "Largest packages first",
        "Alphabetical order by customer name",
    ],
    "What does FIFO stand for in inventory management?": [
        "First In, First Out", // Correct
        "Fast In, Fast Out",
        "Final Inventory, Final Output",
        "Frequent Input, Frequent Output",
    ],
    "When should you report damaged inventory?": [
        "At the end of the shift",
        "During weekly meetings",
        "Immediately upon discovery", // Correct
        "Only if value exceeds €100",
    ],
    "What should you do if you notice a spill on the warehouse floor?": [
        "Clean it immediately and report to supervisor", // Correct
        "Put a sign around it and continue working",
        "Report it at the end of shift",
        "Wait for cleaning crew",
    ],
    "How often should safety equipment be inspected?": [
        "Weekly",
        "Monthly",
        "Before each use", // Correct
        "Annually",
    ],
    "What is the first step when operating a forklift?": [
        "Start the engine",
        "Check fuel levels",
        "Pre-operation safety check", // Correct
        "Load the first pallet",
    ],
    "How do you handle a customer complaint about a delayed delivery?": [
        "Blame traffic conditions",
        "Listen actively, apologize, and provide solution options", // Correct
        "Transfer to supervisor immediately",
        "Explain company policies",
    ],
    "What should you do if you can't complete your assigned tasks on time?": [
        "Work overtime without telling anyone",
        "Skip some tasks to finish others",
        "Inform supervisor early and request assistance", // Correct
        "Blame inadequate resources",
    ],
    "How do you maintain accuracy when processing high volumes?": [
        "Work as fast as possible",
        "Double-check work and use systematic approach", // Correct
        "Process similar items together",
        "Take frequent breaks",
    ],
}

/**
 * Generate a realistic applicant profile
 */
function generateApplicant() {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()

    return {
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        firstName,
        lastName,
        phone: faker.phone.number(),
        city: faker.location.city(),
        country: "Germany",
        address: faker.location.streetAddress(),
        resumeUrl: faker.internet.url(),
    }
}

/**
 * Generate realistic answers with weighted probability for correctness
 * Higher-skilled applicants have higher correct answer rates
 */
function generateAnswers(
    questions: any[],
    skillLevel: "low" | "medium" | "high" = "medium",
) {
    const correctnessRates = {
        low: 0.45, // 45% correct answers
        medium: 0.7, // 70% correct answers
        high: 0.85, // 85% correct answers
    }

    const correctRate = correctnessRates[skillLevel]

    return questions.map((question) => {
        let answer: string
        let isCorrect: boolean

        if (question.type === "TRUE_FALSE") {
            // For true/false, randomly choose based on skill level
            if (Math.random() < correctRate) {
                answer = question.correctAnswer
                isCorrect = true
            } else {
                answer = question.correctAnswer === "true" ? "false" : "true"
                isCorrect = false
            }
        } else {
            // For multiple choice, choose from available options
            const options = ANSWER_OPTIONS[question.text] || [
                question.correctAnswer,
                "Option A",
                "Option B",
                "Option C",
            ]

            if (Math.random() < correctRate) {
                answer = question.correctAnswer
                isCorrect = true
            } else {
                // Choose wrong answer
                const wrongOptions = options.filter(
                    (opt: string) => opt !== question.correctAnswer,
                )
                answer = faker.helpers.arrayElement(wrongOptions)
                isCorrect = false
            }
        }

        return {
            answer,
            isCorrect,
            questionId: question.id,
        }
    })
}

/**
 * Assign skill levels to applicants with realistic distribution
 */
function assignSkillLevel(index: number): "low" | "medium" | "high" {
    // 20% high skill, 60% medium skill, 20% low skill
    if (index < SEED_CONFIG.applicants * 0.2) return "high"
    if (index < SEED_CONFIG.applicants * 0.8) return "medium"
    return "low"
}

async function main() {
    console.log("🌱 Starting comprehensive seed script...")

    try {
        // Clear existing data in correct order (respecting foreign keys)
        console.log("🧹 Cleaning existing data...")
        await prisma.candidateRanking.deleteMany()
        await prisma.jobRankingMetadata.deleteMany()
        await prisma.applicantAnswer.deleteMany()
        await prisma.applicantAssessment.deleteMany()
        await prisma.assessmentQuestion.deleteMany()
        await prisma.assessmentTemplate.deleteMany()
        await prisma.jobApplication.deleteMany()
        await prisma.job.deleteMany()
        await prisma.applicant.deleteMany()
        await prisma.scoringConfig.deleteMany()
        await prisma.branch.deleteMany()
        await prisma.userSession.deleteMany()
        await prisma.user.deleteMany()
        await prisma.company.deleteMany()

        console.log("✅ Cleaned existing data")

        // 1. Create companies
        console.log("🏢 Creating companies...")
        const companies: any[] = []
        for (let i = 0; i < SEED_CONFIG.companies; i++) {
            const companyData = COMPANY_DATA[i]
            const company = await prisma.company.create({
                data: {
                    name: companyData.name,
                    description: companyData.description,
                    website: companyData.website,
                    email: `contact@${companyData.name
                        .toLowerCase()
                        .replace(/\s+/g, "")}.com`,
                    phone: faker.phone.number(),
                    address: faker.location.streetAddress(),
                },
            })
            companies.push({ ...company, cities: companyData.cities })
        }
        console.log(`✅ Created ${companies.length} companies`)

        // 2. Create branches
        console.log("🏪 Creating branches...")
        const branches: any[] = []
        for (let i = 0; i < companies.length; i++) {
            const company = companies[i]
            const branchCount = SEED_CONFIG.branchesPerCompany[i]

            for (let j = 0; j < branchCount; j++) {
                const city = company.cities[j % company.cities.length]
                const branchSuffix =
                    branchCount > company.cities.length ? ` ${j + 1}` : ""
                const branch = await prisma.branch.create({
                    data: {
                        name: `${company.name} ${city}${branchSuffix}`,
                        city,
                        country: "Germany",
                        address: `${faker.location.streetAddress()}, ${city}`,
                        email: `${city.toLowerCase()}${branchSuffix.replace(
                            /\s/g,
                            "",
                        )}@${company.name
                            .toLowerCase()
                            .replace(/\s+/g, "")}.com`,
                        phone: faker.phone.number(),
                        companyId: company.id,
                    },
                })
                branches.push(branch)
            }
        }
        console.log(`✅ Created ${branches.length} branches`)

        // 3. Create users (one admin per company)
        console.log("👥 Creating users...")
        const users: any[] = []
        for (const company of companies) {
            const user = await prisma.user.create({
                data: {
                    email: `admin@${company.name
                        .toLowerCase()
                        .replace(/\s+/g, "")}.com`,
                    firstName: "Admin",
                    lastName: company.name.split(" ")[0],
                    passwordHash: "$2b$10$dummy.hash.for.seeding.purposes.only",
                    role: "ADMIN",
                    companyId: company.id,
                },
            })
            users.push(user)
        }
        console.log(`✅ Created ${users.length} users`)

        // 4. Create default scoring config
        console.log("⚙️ Creating scoring configurations...")
        const defaultScoringConfig = await prisma.scoringConfig.create({
            data: {
                negativeMarkingFraction: 0.25, // -25% penalty for wrong answers
                recencyWindowDays: 30,
                recencyBoostPercent: 10, // 10% bonus for recent submissions
                isDefault: true,
            },
        })

        // Create a strict scoring config for one job
        const strictScoringConfig = await prisma.scoringConfig.create({
            data: {
                negativeMarkingFraction: 0.5, // -50% penalty for wrong answers
                recencyWindowDays: 7,
                recencyBoostPercent: 15, // 15% bonus for very recent submissions
                isDefault: false,
            },
        })
        console.log("✅ Created scoring configurations")

        // 5. Create jobs
        console.log("💼 Creating jobs...")
        const jobs: any[] = []
        let jobIndex = 0
        for (const branch of branches) {
            for (let j = 0; j < SEED_CONFIG.jobsPerBranch; j++) {
                const jobTemplate =
                    JOB_TEMPLATES[jobIndex % JOB_TEMPLATES.length]
                const job = await prisma.job.create({
                    data: {
                        title: jobTemplate.title,
                        description: jobTemplate.description,
                        requirements: jobTemplate.requirements,
                        status: JobStatus.OPEN,
                        openPositions: faker.number.int({ min: 1, max: 5 }),
                        branchId: branch.id,
                    },
                })
                jobs.push(job)
                jobIndex++
            }
        }

        // Assign strict scoring config to a few jobs
        await prisma.scoringConfig.update({
            where: { id: strictScoringConfig.id },
            data: { jobId: jobs[0].id },
        })

        console.log(`✅ Created ${jobs.length} jobs`)

        // 6. Create assessment templates
        console.log("📋 Creating assessment templates...")
        const templates: any[] = []
        const questionCategories = Object.keys(ASSESSMENT_QUESTIONS)

        for (let i = 0; i < SEED_CONFIG.assessmentTemplates; i++) {
            const job = jobs[i % jobs.length] // Cycle through jobs
            const questionCount = SEED_CONFIG.questionsPerTemplate[i]

            const template = await prisma.assessmentTemplate.create({
                data: {
                    name: `${job.title} Assessment`,
                    description: `Comprehensive assessment for ${job.title} position covering logistics, safety, and general skills.`,
                    jobId: job.id,
                },
            })

            // Create questions for this template
            const questions: any[] = []
            let questionOrder = 0

            // Mix questions from different categories
            const questionsPerCategory = Math.ceil(
                questionCount / questionCategories.length,
            )

            for (const category of questionCategories) {
                const categoryQuestions = (ASSESSMENT_QUESTIONS as any)[
                    category
                ]
                const selectedQuestions = faker.helpers.arrayElements(
                    categoryQuestions,
                    Math.min(questionsPerCategory, categoryQuestions.length),
                )

                for (const questionData of selectedQuestions) {
                    if (questions.length >= questionCount) break

                    const question = await prisma.assessmentQuestion.create({
                        data: {
                            text: (questionData as any).text,
                            type: (questionData as any).type,
                            weight: (questionData as any).weight,
                            order: questionOrder++,
                            correctAnswer: (questionData as any).correctAnswer,
                            templateId: template.id,
                        },
                    })
                    questions.push(question)
                }

                if (questions.length >= questionCount) break
            }

            templates.push({ ...template, questions })
        }
        console.log(
            `✅ Created ${
                templates.length
            } assessment templates with ${templates.reduce(
                (sum, t) => sum + t.questions.length,
                0,
            )} questions`,
        )

        // 7. Create applicants
        console.log("👨‍💼 Creating applicants...")
        const applicants: any[] = []
        for (let i = 0; i < SEED_CONFIG.applicants; i++) {
            const applicantData = generateApplicant()
            const applicant = await prisma.applicant.create({
                data: applicantData,
            })
            applicants.push({ ...applicant, skillLevel: assignSkillLevel(i) })

            if ((i + 1) % 100 === 0) {
                console.log(
                    `   Created ${i + 1}/${SEED_CONFIG.applicants} applicants`,
                )
            }
        }
        console.log(`✅ Created ${applicants.length} applicants`)

        // 8. Create job applications
        console.log("📝 Creating job applications...")
        let applicationCount = 0
        for (const applicant of applicants) {
            // Each applicant applies to 1-3 random jobs
            const numApplications = faker.number.int({ min: 1, max: 3 })
            const selectedJobs = faker.helpers.arrayElements(
                jobs,
                numApplications,
            )

            for (const job of selectedJobs) {
                await prisma.jobApplication.create({
                    data: {
                        applicantId: applicant.id,
                        jobId: job.id,
                        status: "APPLIED",
                        appliedAt: faker.date.recent({ days: 30 }),
                    },
                })
                applicationCount++
            }
        }
        console.log(`✅ Created ${applicationCount} job applications`)

        // 9. Create assessments and answers
        console.log("✍️ Creating assessments and answers...")
        let assessmentCount = 0
        let answerCount = 0

        for (const applicant of applicants) {
            // Determine how many assessments this applicant will complete
            const maxAssessments = Math.min(
                templates.length,
                faker.number.int({ min: 1, max: templates.length }),
            )
            const selectedTemplates = faker.helpers.arrayElements(
                templates,
                maxAssessments,
            )

            for (const template of selectedTemplates) {
                // Create assessment
                const submissionDate = faker.date.recent({ days: 60 })
                const assessment = await prisma.applicantAssessment.create({
                    data: {
                        applicantId: applicant.id,
                        templateId: template.id,
                        submittedAt: submissionDate,
                    },
                })

                // Generate answers based on applicant's skill level
                const answers = generateAnswers(
                    template.questions,
                    applicant.skillLevel,
                )

                // Create answers
                for (const answerData of answers) {
                    await prisma.applicantAnswer.create({
                        data: {
                            answer: answerData.answer,
                            isCorrect: answerData.isCorrect,
                            assessmentId: assessment.id,
                            questionId: answerData.questionId,
                        },
                    })
                    answerCount++
                }

                assessmentCount++
            }

            if (assessmentCount % 50 === 0) {
                console.log(
                    `   Created ${assessmentCount} assessments with ${answerCount} answers`,
                )
            }
        }
        console.log(
            `✅ Created ${assessmentCount} assessments with ${answerCount} answers`,
        )

        // 10. Test the ranking system
        console.log("🧪 Testing ranking system...")

        // Import the candidate ranking service
        const { getServices } = await import("../src/services")
        const { envToLogger } = await import("../src/config")
        const { makeDB } = await import("../src/persistence/db")
        const AwaitableEventRelaying = await import(
            "../src/services/events/awaitable"
        )

        // Create service instances
        const logger = envToLogger(process.env.ENV || "development")
        const db = makeDB()
        const events = new AwaitableEventRelaying.default()
        const services = getServices(db, logger, events)

        // Test ranking for each job
        const rankingResults: any[] = []
        for (let i = 0; i < Math.min(5, jobs.length); i++) {
            const job = jobs[i]
            console.log(
                `   Testing rankings for "${job.title}" at job ${
                    i + 1
                }/${Math.min(5, jobs.length)}`,
            )

            try {
                // Trigger ranking calculation
                const rankingService = services.getCandidateRankingService()
                const result = await rankingService.recalculateJobRankings(
                    job.id,
                    "SEED_SCRIPT_TEST",
                )

                // Get top candidates
                const topCandidates = await rankingService.getTopCandidates(
                    job.id,
                    5,
                )

                rankingResults.push({
                    jobTitle: job.title,
                    totalCandidates: result.totalCandidates,
                    calculationDuration: result.calculationDuration,
                    topCandidates: topCandidates.candidates.map((c) => ({
                        name: `${c.applicant.firstName} ${c.applicant.lastName}`,
                        rank: c.rank,
                        score: c.score,
                        percentage: c.percentage,
                        correctAnswers: c.correctAnswers,
                        incorrectAnswers: c.incorrectAnswers,
                    })),
                })

                console.log(
                    `     ✅ Ranked ${result.totalCandidates} candidates in ${result.calculationDuration}ms`,
                )
            } catch (error) {
                console.error(
                    `     ❌ Failed to rank candidates for ${job.title}:`,
                    error,
                )
            }
        }

        // 11. Generate seed summary
        console.log("\n" + "=".repeat(60))
        console.log("🎉 SEED SCRIPT COMPLETED SUCCESSFULLY!")
        console.log("=".repeat(60))

        console.log("\n📊 DATA SUMMARY:")
        console.log(`   Companies: ${companies.length}`)
        console.log(`   Branches: ${branches.length}`)
        console.log(`   Users: ${users.length}`)
        console.log(`   Jobs: ${jobs.length}`)
        console.log(`   Applicants: ${applicants.length}`)
        console.log(`   Assessment Templates: ${templates.length}`)
        console.log(
            `   Total Questions: ${templates.reduce(
                (sum, t) => sum + t.questions.length,
                0,
            )}`,
        )
        console.log(`   Job Applications: ${applicationCount}`)
        console.log(`   Assessments Completed: ${assessmentCount}`)
        console.log(`   Total Answers: ${answerCount}`)

        console.log("\n🎯 RANKING TEST RESULTS:")
        for (const result of rankingResults) {
            console.log(`\n   📋 ${result.jobTitle}:`)
            console.log(`      Total Candidates: ${result.totalCandidates}`)
            console.log(
                `      Calculation Time: ${result.calculationDuration}ms`,
            )
            console.log(`      Top 5 Candidates:`)

            for (const candidate of result.topCandidates) {
                console.log(
                    `         ${candidate.rank}. ${
                        candidate.name
                    } - ${candidate.score.toFixed(
                        2,
                    )} points (${candidate.percentage.toFixed(1)}%)`,
                )
                console.log(
                    `            ✅ ${candidate.correctAnswers} correct, ❌ ${candidate.incorrectAnswers} incorrect`,
                )
            }
        }

        console.log("\n🚀 NEXT STEPS:")
        console.log("   1. Start the API server: npm run dev")
        console.log("   2. Visit API docs: http://localhost:4000/api/v1/docs")
        console.log("   3. Test endpoints with the seeded data")
        console.log(
            "   4. Check top candidates: GET /api/v1/jobs/{jobId}/candidates/top",
        )

        console.log(
            "\n✨ Seed script completed in",
            process.hrtime()[0],
            "seconds",
        )
    } catch (error) {
        console.error("❌ Seed script failed:", error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Run the seed script
main().catch((error) => {
    console.error("💥 Fatal error in seed script:", error)
    process.exit(1)
})
