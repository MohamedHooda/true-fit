#!/usr/bin/env npx ts-node

/**
 * Production Seed Script
 * Based on the working mass-applicant-test-axios.ts pattern
 *
 * Creates realistic data volume:
 * - 5 companies with multiple branches (simulated via multiple jobs)
 * - Multiple jobs across branches
 * - 1,000+ applicants
 * - Multiple assessment templates
 */

import axios, { AxiosInstance } from "axios"

// Configuration
const BASE_URL = process.env.API_URL || "http://localhost:4000"
const TARGET_APPLICANTS = parseInt(process.env.TARGET_APPLICANTS || "100")
const COMPANIES_TO_CREATE = 5
const JOBS_PER_COMPANY = 4 // Simulates branches
const BATCH_SIZE = 10 // Smaller batches for stability

// Login credentials
const LOGIN_CREDENTIALS = {
    email: "user@example.com",
    password: "string",
}

// Company and location data
const LOGISTICS_COMPANIES = [
    {
        name: "Deutsche Post DHL Group",
        locations: ["Berlin", "Hamburg", "Munich", "Cologne"],
    },
    {
        name: "DB Schenker Logistics",
        locations: ["Frankfurt", "Stuttgart", "Dresden", "Hannover"],
    },
    {
        name: "Kuehne Nagel International",
        locations: ["Leipzig", "Nuremberg", "Dortmund", "Essen"],
    },
    {
        name: "Rhenus Logistics Group",
        locations: ["Mannheim", "Karlsruhe", "Wuppertal", "Bonn"],
    },
    {
        name: "DACHSER Logistics",
        locations: ["Augsburg", "Freiburg", "Kiel", "Erfurt"],
    },
]

const JOB_TYPES = [
    {
        title: "Warehouse Operations Specialist",
        description:
            "Responsible for warehouse operations, inventory management, and logistics coordination.",
        requirements:
            "Experience in warehouse operations, forklift license preferred",
    },
    {
        title: "Transport Coordinator",
        description:
            "Coordinate transportation schedules, manage driver assignments, and ensure timely deliveries.",
        requirements: "Logistics experience, excellent communication skills",
    },
    {
        title: "Logistics Analyst",
        description:
            "Analyze logistics data, optimize routes, and improve operational efficiency.",
        requirements:
            "Data analysis skills, logistics background, Excel proficiency",
    },
    {
        title: "Supply Chain Specialist",
        description:
            "Manage end-to-end supply chain operations and vendor relationships.",
        requirements:
            "Supply chain management experience, organizational skills",
    },
]

const questionTemplates = [
    {
        text: "What is the maximum safe lifting weight for manual handling?",
        correctAnswer: "23kg",
    },
    {
        text: "Which equipment requires daily safety checks?",
        correctAnswer: "forklift",
    },
    {
        text: "What does FIFO stand for in inventory management?",
        correctAnswer: "First In First Out",
    },
    {
        text: "How often should safety equipment be inspected?",
        correctAnswer: "daily",
    },
    {
        text: "What is the purpose of a pick list?",
        correctAnswer: "guide picking",
    },
    {
        text: "What is the standard pallet size in Europe?",
        correctAnswer: "1200x800mm",
    },
    {
        text: "How should damaged goods be handled?",
        correctAnswer: "quarantine",
    },
    {
        text: "What does WMS stand for?",
        correctAnswer: "Warehouse Management System",
    },
    {
        text: "What is the maximum driving time per day for EU drivers?",
        correctAnswer: "9 hours",
    },
    {
        text: "What does ETA stand for?",
        correctAnswer: "Estimated Time of Arrival",
    },
]

// German cities and names for realistic applicant data
const GERMAN_CITIES = [
    "Berlin",
    "Hamburg",
    "Munich",
    "Cologne",
    "Frankfurt",
    "Stuttgart",
    "Düsseldorf",
    "Dortmund",
    "Essen",
    "Leipzig",
    "Bremen",
    "Dresden",
    "Hannover",
    "Nuremberg",
    "Duisburg",
    "Bochum",
]

const FIRST_NAMES = [
    "Alexander",
    "Anna",
    "Benjamin",
    "Charlotte",
    "David",
    "Emma",
    "Felix",
    "Hannah",
    "Jan",
    "Julia",
    "Max",
    "Lisa",
    "Tom",
    "Marie",
    "Paul",
    "Lena",
    "Leon",
    "Sophia",
    "Finn",
    "Mia",
]

const LAST_NAMES = [
    "Müller",
    "Schmidt",
    "Schneider",
    "Fischer",
    "Weber",
    "Meyer",
    "Wagner",
    "Becker",
    "Schulz",
    "Hoffmann",
    "Braun",
    "Krüger",
    "Hofmann",
    "Hartmann",
    "Lange",
    "Schmitt",
    "Werner",
    "Schmitz",
    "Krause",
    "Meier",
]

interface ApiClient {
    get: (url: string) => Promise<any>
    post: (url: string, data: any) => Promise<any>
    put: (url: string, data: any) => Promise<any>
    defaults: {
        headers: {
            Authorization?: string
        }
    }
}

let CREATED_ENTITIES = {
    companies: [] as string[],
    jobs: [] as string[],
    templates: [] as Array<{ templateId: string; questionIds: string[] }>,
}

async function createApiClient(): Promise<ApiClient> {
    const api = axios.create({
        baseURL: BASE_URL,
        timeout: 60000,
        headers: {
            "Content-Type": "application/json",
        },
    })
    return api as ApiClient
}

async function login(api: ApiClient): Promise<string> {
    console.log("🔐 Authenticating...")
    try {
        const response = await api.post("/v1/users/login", LOGIN_CREDENTIALS)
        const token = response.data.token
        api.defaults.headers.Authorization = `Bearer ${token}`
        console.log("✅ Authentication successful")
        return token
    } catch (error: any) {
        console.error(
            "❌ Authentication failed:",
            error.response?.data || error.message,
        )
        throw error
    }
}

async function createDefaultScoringConfig(api: ApiClient): Promise<string> {
    console.log("🔧 Creating default scoring configuration...")

    try {
        const defaultScoringConfigData = {
            negativeMarkingFraction: 0.15,
            recencyWindowDays: 30,
            recencyBoostPercent: 10,
            isDefault: true,
        }

        const response = await api.post(
            "/v1/scoring-configs",
            defaultScoringConfigData,
        )
        const config = response.data.config

        console.log(`✅ Created default scoring config`)
        console.log(`🆔 Default Config ID: ${config.id}`)
        console.log(
            `⚡ Default negative marking: ${
                config.negativeMarkingFraction * 100
            }%`,
        )

        return config.id
    } catch (error: any) {
        console.log(
            "⚠️ Default scoring config might already exist, continuing...",
        )
        return "default"
    }
}

async function createCompanyAndJobs(
    api: ApiClient,
    companyData: any,
): Promise<{ companyId: string; jobIds: string[] }> {
    console.log(`🏢 Creating company: ${companyData.name}...`)

    try {
        // Create main company
        const timestamp = Date.now()
        const mainCompanyData = {
            name: `${companyData.name} ${timestamp}`,
            description:
                "Leading logistics company specializing in comprehensive supply chain solutions",
            website: `https://test-logistics-${timestamp}.com`,
            email: `info@test-logistics-${timestamp}.com`,
            phone: "+49 40 123456789",
            address: `${companyData.name} Headquarters, Germany`,
        }

        const companyResponse = await api.post("/v1/companies", mainCompanyData)
        const company = companyResponse.data.company
        const companyId = company.id

        console.log(`✅ Created company: ${company.name}`)
        console.log(`🆔 Company ID: ${companyId}`)

        // Extract the default branch ID
        let branchId = company.branches[0].id
        console.log(`🏢 Default branch: ${company.branches[0].name}`)
        console.log(`🆔 Branch ID: ${branchId}`)

        // Create jobs for different locations (simulating branches)
        const jobIds: string[] = []
        for (
            let i = 0;
            i < Math.min(JOBS_PER_COMPANY, companyData.locations.length);
            i++
        ) {
            const location = companyData.locations[i]
            const jobType = JOB_TYPES[i % JOB_TYPES.length]

            const jobData = {
                title: `${jobType.title} - ${location}`,
                description: `${jobType.description} Location: ${location}, Germany.`,
                requirements: jobType.requirements,
                branchId: branchId,
                status: "OPEN",
            }

            const jobResponse = await api.post("/v1/jobs", jobData)
            const job = jobResponse.data.job || jobResponse.data
            jobIds.push(job.id)
            console.log(`  ✅ Created job: ${jobData.title} (${job.id})`)

            await new Promise((resolve) => setTimeout(resolve, 16)) // Reduced to 10% of 162ms
        }

        CREATED_ENTITIES.companies.push(companyId)
        CREATED_ENTITIES.jobs.push(...jobIds)

        return { companyId, jobIds }
    } catch (error: any) {
        console.error(
            `❌ Failed to create company ${companyData.name}:`,
            error.response?.data || error.message,
        )
        throw error
    }
}

async function createAssessmentTemplate(
    api: ApiClient,
    templateName: string,
): Promise<{ templateId: string; questionIds: string[] }> {
    console.log(`📝 Creating assessment template: ${templateName}...`)

    try {
        const timestamp = Date.now()
        const templateResponse = await api.post("/v1/assessment-templates", {
            name: `${templateName} ${timestamp}`,
            description: `Comprehensive assessment for ${templateName.toLowerCase()} positions`,
            jobId: null,
        })

        const template = templateResponse.data.template || templateResponse.data
        const templateId = template.id
        console.log(`✅ Created template: ${template.name} (${templateId})`)

        // Create questions for this template
        console.log(`❓ Creating assessment questions...`)
        const questionIds: string[] = []

        for (const questionTemplate of questionTemplates) {
            const questionResponse = await api.post(
                "/v1/assessment-questions",
                {
                    templateId: templateId,
                    text: questionTemplate.text,
                    type: "TEXT",
                    correctAnswer: questionTemplate.correctAnswer,
                    weight: 1.0,
                },
            )

            const question =
                questionResponse.data.question || questionResponse.data
            questionIds.push(question.id)
        }

        console.log(`✅ Created ${questionIds.length} questions`)

        const templateData = { templateId, questionIds }
        CREATED_ENTITIES.templates.push(templateData)

        return templateData
    } catch (error: any) {
        console.error(
            `❌ Failed to create template ${templateName}:`,
            error.response?.data || error.message,
        )
        throw error
    }
}

function generateRandomApplicant(): any {
    const firstName =
        FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
    const timestamp = Date.now() + Math.floor(Math.random() * 10000)

    return {
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${timestamp}@example.com`,
        phone: `+49 ${Math.floor(Math.random() * 900) + 100} ${
            Math.floor(Math.random() * 9000000) + 1000000
        }`,
        city: GERMAN_CITIES[Math.floor(Math.random() * GERMAN_CITIES.length)],
        country: "Germany",
    }
}

async function createApplicantBatch(
    api: ApiClient,
    batchNumber: number,
    batchSize: number,
): Promise<number> {
    console.log(
        `📦 Processing batch ${batchNumber} (${batchSize} applicants)...`,
    )

    let successCount = 0

    for (let i = 0; i < batchSize; i++) {
        try {
            const applicantData = generateRandomApplicant()

            // Create applicant
            const applicantResponse = await api.post(
                "/v1/applicants",
                applicantData,
            )
            const applicant =
                applicantResponse.data.applicant || applicantResponse.data

            // Choose random job and template
            const jobId =
                CREATED_ENTITIES.jobs[
                    Math.floor(Math.random() * CREATED_ENTITIES.jobs.length)
                ]
            const templateData =
                CREATED_ENTITIES.templates[
                    Math.floor(
                        Math.random() * CREATED_ENTITIES.templates.length,
                    )
                ]

            // Generate random answers with actual correct answers for realistic scores
            const correctRate = 0.6 + Math.random() * 0.3 // 60-90% correct
            const answers: Array<{ questionId: string; answer: string }> = []

            for (let i = 0; i < templateData.questionIds.length; i++) {
                const questionId = templateData.questionIds[i]
                const isCorrect = Math.random() < correctRate
                const correctAnswer =
                    questionTemplates[i % questionTemplates.length]
                        .correctAnswer
                answers.push({
                    questionId: questionId,
                    answer: isCorrect ? correctAnswer : "wrong_answer",
                })
            }

            // Submit assessment
            await api.post("/v1/applicant-assessments", {
                applicantId: applicant.id,
                templateId: templateData.templateId,
                jobId: jobId,
                answers: answers,
            })

            successCount++

            // Small delay between applicants
            await new Promise((resolve) => setTimeout(resolve, 27)) // Reduced to 10% of 270ms
        } catch (error: any) {
            console.error(
                `❌ Failed to create applicant ${i + 1}:`,
                error.response?.data?.message || error.message,
            )
        }
    }

    return successCount
}

async function createApplicants(api: ApiClient): Promise<void> {
    console.log(
        `🚀 Creating ${TARGET_APPLICANTS} applicants with assessments...`,
    )

    const totalBatches = Math.ceil(TARGET_APPLICANTS / BATCH_SIZE)
    let totalSuccess = 0

    for (let batch = 0; batch < totalBatches; batch++) {
        const currentBatchSize = Math.min(
            BATCH_SIZE,
            TARGET_APPLICANTS - batch * BATCH_SIZE,
        )
        const startTime = Date.now()

        const batchSuccess = await createApplicantBatch(
            api,
            batch + 1,
            currentBatchSize,
        )
        totalSuccess += batchSuccess

        const duration = Date.now() - startTime
        console.log(
            `✅ Batch ${
                batch + 1
            } completed: ${batchSuccess}/${currentBatchSize} successful in ${duration}ms`,
        )

        // Progress update
        const progress = (((batch + 1) / totalBatches) * 100).toFixed(1)
        console.log(
            `📊 Progress: ${progress}% (${totalSuccess}/${TARGET_APPLICANTS} total)`,
        )

        // Delay between batches
        if (batch < totalBatches - 1) {
            await new Promise((resolve) => setTimeout(resolve, 90)) // Reduced to 10% of 900ms
        }
    }

    console.log(
        `🎉 Applicant creation completed! ${totalSuccess}/${TARGET_APPLICANTS} successful`,
    )
}

async function displayStatistics(api: ApiClient): Promise<void> {
    console.log("\n📊 Final Statistics:")
    console.log("==================")

    try {
        console.log(
            `🏢 Companies Created: ${CREATED_ENTITIES.companies.length}`,
        )
        console.log(`💼 Jobs Created: ${CREATED_ENTITIES.jobs.length}`)
        console.log(
            `📝 Assessment Templates: ${CREATED_ENTITIES.templates.length}`,
        )
        console.log(`👥 Target Applicants: ${TARGET_APPLICANTS}`)

        // Show top candidates across all jobs
        console.log("\n🏆 TOP CANDIDATES ACROSS ALL JOBS:")
        console.log("=================================")

        let totalCandidatesFound = 0
        let jobsWithCandidates = 0

        for (const jobId of CREATED_ENTITIES.jobs) {
            try {
                const rankingsResponse = await api.get(
                    `/v1/jobs/${jobId}/candidates/top?limit=3`,
                )
                const candidates = rankingsResponse.data.candidates
                const metadata = rankingsResponse.data.metadata

                if (candidates && candidates.length > 0) {
                    // Get job details
                    const jobResponse = await api.get(`/v1/jobs/${jobId}`)
                    const job = jobResponse.data.job

                    console.log(
                        `\n📋 ${job.title} - ${job.branch.company.name}`,
                    )
                    console.log(
                        `📊 Total Candidates: ${metadata.totalCandidates}`,
                    )
                    console.log("─".repeat(60))

                    candidates.forEach((candidate: any, index: number) => {
                        console.log(
                            `${index + 1}. ${candidate.applicant.firstName} ${
                                candidate.applicant.lastName
                            }`,
                        )
                        console.log(
                            `   📊 Score: ${candidate.percentage}% (${candidate.correctAnswers}/10 correct)`,
                        )
                        console.log(`   📧 ${candidate.applicant.email}`)
                        console.log(
                            `   📍 ${candidate.applicant.city}, ${candidate.applicant.country}`,
                        )
                        if (index < candidates.length - 1) console.log()
                    })

                    totalCandidatesFound += metadata.totalCandidates
                    jobsWithCandidates++
                }
            } catch (error: any) {
                // Skip jobs with no candidates or errors
            }
        }

        console.log(
            `\n📈 SUMMARY: Found ${totalCandidatesFound} total candidates across ${jobsWithCandidates} jobs`,
        )

        if (totalCandidatesFound === 0) {
            console.log(
                "⚠️  No candidates found. Rankings may still be calculating...",
            )
        }
    } catch (error: any) {
        console.error("❌ Failed to fetch statistics:", error.message)
    }
}

async function main(): Promise<void> {
    const startTime = Date.now()

    try {
        console.log("🎯 Production Seed Script")
        console.log("============================================")
        console.log(
            `📊 Target: ${TARGET_APPLICANTS} applicants across ${COMPANIES_TO_CREATE} companies`,
        )
        console.log(`⚡ Batch size: ${BATCH_SIZE}\n`)

        const api = await createApiClient()
        await login(api)

        // Create core configuration
        await createDefaultScoringConfig(api)

        // Create companies and jobs
        console.log(`🏗️ Creating ${COMPANIES_TO_CREATE} companies with jobs...`)
        for (let i = 0; i < COMPANIES_TO_CREATE; i++) {
            const companyData = LOGISTICS_COMPANIES[i]
            await createCompanyAndJobs(api, companyData)
            await new Promise((resolve) => setTimeout(resolve, 90)) // Reduced to 10% of 900ms
        }

        // Create assessment templates
        console.log(`📝 Creating assessment templates...`)
        await createAssessmentTemplate(api, "Logistics Operations Assessment")
        await createAssessmentTemplate(
            api,
            "Transportation Management Assessment",
        )

        // Create applicants with assessments
        await createApplicants(api)

        // Wait for rankings to calculate
        console.log(
            "⏳ Waiting 1 second for automatic ranking calculation...",
        )
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Display final statistics
        await displayStatistics(api)

        const duration = (Date.now() - startTime) / 1000
        console.log(
            `\n⏱️  Total execution time: ${duration.toFixed(1)} seconds`,
        )
        console.log("🎉 Production seeding completed successfully!")
    } catch (error: any) {
        console.error("❌ Seeding failed:", error.message)
        if (error.response?.data) {
            console.error("📋 Error details:", error.response.data)
        }
        process.exit(1)
    }
}

// Run the script
if (require.main === module) {
    main()
}
