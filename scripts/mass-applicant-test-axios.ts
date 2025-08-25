#!/usr/bin/env ts-node

import axios from "axios"

// Configuration
const BASE_URL = "http://localhost:4000"
const LOGIN_EMAIL = "user@example.com"
const LOGIN_PASSWORD = "string"

// These will be created dynamically
let TEMPLATE_ID: string
let JOB_ID: string
let COMPANY_ID: string
let BRANCH_ID: string
let SCORING_CONFIG_ID: string

// Question data without IDs - will be created dynamically
const questionTemplates = [
    {
        text: "What is the best approach for prioritizing package deliveries?",
        type: "MULTIPLE_CHOICE" as const,
        correctAnswer: "Time-sensitive and high-priority deliveries first",
        options: [
            "Time-sensitive and high-priority deliveries first",
            "Largest packages first",
            "Closest destinations first",
            "Random selection",
        ],
        weight: 1,
    },
    {
        text: "What does FIFO stand for in warehouse management?",
        type: "MULTIPLE_CHOICE" as const,
        correctAnswer: "First In, First Out",
        options: [
            "First In, First Out",
            "First In, Last Out",
            "Fast In, Fast Out",
            "Free In, Free Out",
        ],
        weight: 1,
    },
    {
        text: "Safety protocols must be followed at all times in the warehouse. True or False?",
        type: "TRUE_FALSE" as const,
        correctAnswer: "true",
        options: ["true", "false"],
        weight: 2,
    },
    {
        text: "What is the most important factor when handling fragile items?",
        type: "MULTIPLE_CHOICE" as const,
        correctAnswer: "Proper cushioning and gentle handling",
        options: [
            "Proper cushioning and gentle handling",
            "Speed of processing",
            "Stacking as high as possible",
            "Using any available space",
        ],
        weight: 2,
    },
    {
        text: "When should you report safety hazards?",
        type: "MULTIPLE_CHOICE" as const,
        correctAnswer: "Immediately upon discovery",
        options: [
            "Immediately upon discovery",
            "At the end of the shift",
            "When convenient",
            "Only if it affects productivity",
        ],
        weight: 2,
    },
    {
        text: "Personal protective equipment is optional in the warehouse. True or False?",
        type: "TRUE_FALSE" as const,
        correctAnswer: "false",
        options: ["true", "false"],
        weight: 2,
    },
    {
        text: "What should you do before operating any machinery?",
        type: "MULTIPLE_CHOICE" as const,
        correctAnswer: "Pre-operation safety check",
        options: [
            "Pre-operation safety check",
            "Start the engine immediately",
            "Check fuel levels only",
            "Begin work immediately",
        ],
        weight: 2,
    },
    {
        text: "Training on equipment operation is mandatory before use. True or False?",
        type: "TRUE_FALSE" as const,
        correctAnswer: "true",
        options: ["true", "false"],
        weight: 1,
    },
    {
        text: "How often should safety equipment be inspected?",
        type: "MULTIPLE_CHOICE" as const,
        correctAnswer: "Before each use",
        options: [
            "Before each use",
            "Once a month",
            "Only when broken",
            "Never",
        ],
        weight: 1,
    },
    {
        text: "What should you do if you spill something on the floor?",
        type: "MULTIPLE_CHOICE" as const,
        correctAnswer: "Clean it immediately and report to supervisor",
        options: [
            "Clean it immediately and report to supervisor",
            "Ignore it",
            "Wait for someone else to clean it",
            "Mark it with tape",
        ],
        weight: 2,
    },
]

// This will store the created questions with their IDs
let questions: Array<{
    id: string
    correctAnswer: string
    options: string[]
}> = []

// Generate random answers with weighted probability for correct answers
function generateRandomAnswers(): Array<{
    questionId: string
    answer: string
}> {
    return questions.map((question) => {
        // 60% chance of correct answer, 40% chance of random answer
        const shouldAnswerCorrectly = Math.random() < 0.6

        if (shouldAnswerCorrectly) {
            return {
                questionId: question.id,
                answer: question.correctAnswer,
            }
        } else {
            const randomOption =
                question.options[
                    Math.floor(Math.random() * question.options.length)
                ]
            return {
                questionId: question.id,
                answer: randomOption,
            }
        }
    })
}

// Generate random applicant data
function generateRandomApplicant(index: number) {
    const firstNames = [
        "John",
        "Jane",
        "Mike",
        "Sarah",
        "David",
        "Lisa",
        "Tom",
        "Emma",
        "Chris",
        "Anna",
        "Alex",
        "Maria",
        "Sam",
        "Rachel",
        "Dan",
        "Jessica",
        "Matt",
        "Amanda",
        "Ryan",
        "Nicole",
    ]
    const lastNames = [
        "Smith",
        "Johnson",
        "Williams",
        "Brown",
        "Jones",
        "Garcia",
        "Miller",
        "Davis",
        "Rodriguez",
        "Martinez",
        "Hernandez",
        "Lopez",
        "Gonzalez",
        "Wilson",
        "Anderson",
        "Thomas",
        "Taylor",
        "Moore",
        "Jackson",
        "Martin",
    ]
    const cities = [
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
        "Wuppertal",
        "Bielefeld",
        "Bonn",
        "Mannheim",
    ]

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const city = cities[Math.floor(Math.random() * cities.length)]
    const timestamp = Date.now()

    return {
        email: `test.applicant.${index}.${timestamp}@example.com`,
        firstName,
        lastName,
        phone: `+49 ${Math.floor(Math.random() * 900) + 100} ${
            Math.floor(Math.random() * 9000000) + 1000000
        }`,
        city,
        country: "Germany",
        address: `${Math.floor(Math.random() * 999) + 1} Test Street`,
        resumeUrl: `https://example.com/resume-${index}.pdf`,
    }
}

// Login and get token
async function login(): Promise<string> {
    console.log("🔐 Logging in...")

    try {
        const response = await axios.post(`${BASE_URL}/v1/users/login`, {
            email: LOGIN_EMAIL,
            password: LOGIN_PASSWORD,
        })

        const token = response.data.token
        console.log("✅ Login successful")
        console.log(
            `👤 User: ${response.data.user.email} (${response.data.user.role})`,
        )
        console.log("")

        return token
    } catch (error: any) {
        console.error("❌ Login failed:", error.response?.data || error.message)
        throw error
    }
}

// Create axios instance with auth header
function createAuthenticatedAxios(token: string) {
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    })
}

// Create a company for testing
async function createCompany(api: any): Promise<string> {
    console.log("🏢 Creating test company...")

    try {
        const timestamp = Date.now()
        const companyData = {
            name: `TrueFit Test Logistics ${timestamp}`,
            description: "Test company for mass applicant testing",
            website: "https://truefit-test.com",
            email: "test@truefit-test.com",
            phone: "+49 40 123456789",
            address: "Test Street 123, Hamburg, Germany",
        }

        const response = await api.post("/v1/companies", companyData)
        const company = response.data.company

        console.log(`✅ Created company: ${company.name}`)
        console.log(`🆔 Company ID: ${company.id}`)

        // Extract the default branch ID (companies automatically create a "Main" branch)
        if (company.branches && company.branches.length > 0) {
            BRANCH_ID = company.branches[0].id
            console.log(`🏢 Default branch: ${company.branches[0].name}`)
            console.log(`🆔 Branch ID: ${BRANCH_ID}`)
        } else {
            throw new Error(
                "Company was created but no default branch was found",
            )
        }

        return company.id
    } catch (error: any) {
        console.error(
            "❌ Failed to create company:",
            error.response?.data || error.message,
        )
        throw error
    }
}

// Create default scoring configuration (needed for ranking system)
async function createDefaultScoringConfig(api: any): Promise<string> {
    console.log("🔧 Creating default scoring configuration...")

    try {
        const defaultScoringConfigData = {
            negativeMarkingFraction: 0.15, // 15% penalty for wrong answers (default)
            recencyWindowDays: 30, // 30-day window for recency bonus
            recencyBoostPercent: 10, // 10% boost for recent applicants
            isDefault: true, // This makes it the default config
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
        console.error(
            "❌ Failed to create default scoring config:",
            error.response?.data || error.message,
        )
        throw error
    }
}

// Create scoring configuration for the job
async function createScoringConfig(api: any, jobId: string): Promise<string> {
    console.log("⚙️ Creating job-specific scoring configuration...")

    try {
        const timestamp = Date.now()
        const scoringConfigData = {
            negativeMarkingFraction: 0.2, // 20% penalty for wrong answers (stricter)
            recencyWindowDays: 30, // 30-day window for recency bonus
            recencyBoostPercent: 10, // 10% boost for recent applicants
            isDefault: false,
            jobId: jobId, // Link directly to the job
        }

        const response = await api.post(
            "/v1/scoring-configs",
            scoringConfigData,
        )
        const config = response.data.config

        console.log(`✅ Created job-specific scoring config`)
        console.log(`🆔 Job Scoring Config ID: ${config.id}`)
        console.log(
            `⚡ Job negative marking: ${config.negativeMarkingFraction * 100}%`,
        )
        console.log(`📅 Recency window: ${config.recencyWindowDays} days`)
        console.log(`🎯 Recency boost: ${config.recencyBoostPercent}%`)

        return config.id
    } catch (error: any) {
        console.error(
            "❌ Failed to create job scoring config:",
            error.response?.data || error.message,
        )
        throw error
    }
}

// Create assessment template with questions
async function createAssessmentTemplate(
    api: any,
    jobId: string,
): Promise<string> {
    console.log("📝 Creating assessment template...")

    try {
        // First create the template
        const timestamp = Date.now()
        const templateData = {
            name: `Warehouse Operations Assessment ${timestamp}`,
            description:
                "Comprehensive assessment for warehouse and logistics positions",
            jobId: jobId, // Link to the job we just created
        }

        const templateResponse = await api.post(
            "/v1/assessment-templates",
            templateData,
        )
        const template = templateResponse.data.template

        console.log(`✅ Created template: ${template.name}`)
        console.log(`🆔 Template ID: ${template.id}`)

        // Create questions for the template
        console.log("❓ Creating assessment questions...")

        for (let i = 0; i < questionTemplates.length; i++) {
            const questionTemplate = questionTemplates[i]
            const questionData = {
                templateId: template.id,
                text: questionTemplate.text,
                type: questionTemplate.type,
                correctAnswer: questionTemplate.correctAnswer,
                weight: questionTemplate.weight,
                order: i + 1, // Set question order
                negativeWeight: 0.15, // 15% negative marking for incorrect answers
            }

            const questionResponse = await api.post(
                "/v1/assessment-questions",
                questionData,
            )
            const question = questionResponse.data.question

            // Store the created question for later use
            questions.push({
                id: question.id,
                correctAnswer: questionTemplate.correctAnswer,
                options: questionTemplate.options,
            })
        }

        console.log(`✅ Created ${questions.length} questions`)

        return template.id
    } catch (error: any) {
        console.error(
            "❌ Failed to create assessment template:",
            error.response?.data || error.message,
        )
        throw error
    }
}

// Create a job posting
async function createJob(api: any, companyId: string): Promise<string> {
    console.log("💼 Creating job posting...")

    try {
        const timestamp = Date.now()
        const jobData = {
            title: `Warehouse Operations Specialist ${timestamp}`,
            description:
                "We are seeking a dedicated Warehouse Operations Specialist to join our logistics team. The ideal candidate will be responsible for ensuring efficient warehouse operations, maintaining safety protocols, and managing inventory systems.",
            branchId: BRANCH_ID, // Required field for job creation
            requirements:
                "Experience in warehouse operations, Knowledge of safety protocols, Ability to operate warehouse equipment, Strong attention to detail, Good physical condition",
        }

        const jobResponse = await api.post("/v1/jobs", jobData)
        const job = jobResponse.data.job

        console.log(`✅ Created job: ${job.title}`)
        console.log(`🆔 Job ID: ${job.id}`)

        return job.id
    } catch (error: any) {
        console.error(
            "❌ Failed to create job:",
            error.response?.data || error.message,
        )
        throw error
    }
}

// Setup complete test environment (default config, company, job, scoring config, template)
async function setupTestEnvironment(api: any): Promise<string> {
    console.log("🛠️  Setting up complete test environment...")
    console.log("")

    try {
        // Create default scoring configuration first (required for ranking system)
        await createDefaultScoringConfig(api)
        console.log("")

        // Create company second (this gives us BRANCH_ID)
        COMPANY_ID = await createCompany(api)
        console.log("")

        // Create job third (needs branchId)
        JOB_ID = await createJob(api, COMPANY_ID)
        console.log("")

        // Create job-specific scoring configuration fourth (linked to job)
        SCORING_CONFIG_ID = await createScoringConfig(api, JOB_ID)
        console.log("")

        // Create assessment template fifth (linked to job via jobId)
        TEMPLATE_ID = await createAssessmentTemplate(api, JOB_ID)
        console.log("")

        console.log("🎉 Test environment setup completed!")
        console.log(`🏢 Company ID: ${COMPANY_ID}`)
        console.log(`💼 Job ID: ${JOB_ID}`)
        console.log(`⚙️ Job Scoring Config ID: ${SCORING_CONFIG_ID}`)
        console.log(`📝 Template ID: ${TEMPLATE_ID}`)
        console.log("🔗 All components are automatically linked!")
        console.log(
            "📊 Ranking system has both default + job-specific configs!",
        )
        console.log("")

        return JOB_ID
    } catch (error: any) {
        console.error(
            "❌ Failed to setup test environment:",
            error.response?.data || error.message,
        )
        throw error
    }
}

// Create applicant via API
async function createApplicant(api: any, applicantData: any): Promise<string> {
    try {
        const response = await api.post("/v1/applicants", applicantData)
        return response.data.applicant.id
    } catch (error: any) {
        console.error(
            "❌ Failed to create applicant:",
            error.response?.data || error.message,
        )
        throw error
    }
}

// Submit assessment via API and trigger ranking calculation
async function submitAssessment(
    api: any,
    applicantId: string,
    answers: Array<{ questionId: string; answer: string }>,
    jobId: string,
): Promise<void> {
    const assessmentData = {
        applicantId,
        templateId: TEMPLATE_ID,
        jobId,
        answers,
    }

    try {
        // Submit the assessment
        await api.post("/v1/applicant-assessments", assessmentData)

        // The assessment submission automatically triggers ranking calculation
        // via the automatic system, no need for manual trigger
    } catch (error: any) {
        console.error(
            "❌ Failed to submit assessment:",
            error.response?.data || error.message,
        )
        throw error
    }
}

// Create applicant with assessment (job application created automatically)
async function createApplicantWithAssessment(
    api: any,
    applicantData: any,
    answers: Array<{ questionId: string; answer: string }>,
    jobId: string,
): Promise<void> {
    // Create applicant
    const applicantId = await createApplicant(api, applicantData)

    // Submit assessment (automatically creates job application and links template)
    await submitAssessment(api, applicantId, answers, jobId)
}

// Create mass applicants
async function createMassApplicants(api: any, jobId: string) {
    // Get target count from environment variable or default to 10
    const targetCount = process.env.DEMO_APPLICANT_COUNT
        ? parseInt(process.env.DEMO_APPLICANT_COUNT)
        : 10

    console.log("🚀 Starting mass applicant creation...")
    console.log(
        `📊 Target: ${targetCount} applicants with random assessment answers`,
    )
    console.log("🎯 Template ID:", TEMPLATE_ID)
    console.log("💼 Job ID:", jobId)
    console.log("")

    const startTime = Date.now()
    let successCount = 0
    let errorCount = 0

    // Process each applicant completely sequentially to avoid deadlocks
    for (let i = 0; i < targetCount; i++) {
        console.log(`📦 Processing applicant ${i + 1}/${targetCount}...`)

        try {
            const applicantData = generateRandomApplicant(i + 1)
            const answers = generateRandomAnswers()

            await createApplicantWithAssessment(
                api,
                applicantData,
                answers,
                jobId,
            )

            successCount++
            console.log(
                `✅ Successfully created applicant ${i + 1}/${targetCount}`,
            )

            // Add delay between each applicant to prevent deadlocks
            if (i < targetCount - 1) {
                console.log("⏳ Waiting 3 seconds to prevent deadlocks...")
                await new Promise((resolve) => setTimeout(resolve, 3000))
            }
        } catch (error: any) {
            errorCount++
            console.error(
                `❌ Failed to create applicant ${i + 1}:`,
                error.message || error,
            )
        }
    }

    const duration = (Date.now() - startTime) / 1000

    console.log("")
    console.log("🎉 Mass applicant creation completed!")
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`)
    console.log(`✅ Successful: ${successCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log(
        `📈 Success rate: ${((successCount / targetCount) * 100).toFixed(1)}%`,
    )

    return { successCount, errorCount, duration }
}

// Get top applicants
async function getTopApplicants(api: any, jobId: string, limit: number = 20) {
    console.log("🏆 Fetching top applicants...")

    try {
        const response = await api.get(
            `/v1/jobs/${jobId}/candidates/top?limit=${limit}`,
        )
        const result = response.data

        console.log(`📊 Top ${result.candidates.length} candidates:`)
        console.log("")

        result.candidates.forEach((candidate: any, index: number) => {
            console.log(
                `${index + 1}. ${candidate.applicant.firstName} ${
                    candidate.applicant.lastName
                }`,
            )
            console.log(`   📧 ${candidate.applicant.email}`)
            console.log(
                `   📍 ${candidate.applicant.city}, ${candidate.applicant.country}`,
            )
            console.log(`   🏆 Rank: ${candidate.rank}`)
            console.log(
                `   📊 Score: ${candidate.score}/${
                    candidate.maxPossibleScore
                } (${candidate.percentage.toFixed(1)}%)`,
            )
            console.log(
                `   ✅ Correct: ${candidate.correctAnswers}/${
                    candidate.correctAnswers + candidate.incorrectAnswers
                }`,
            )
            console.log(`   ⏰ Recency Bonus: ${candidate.recencyBonus}`)
            console.log("")
        })

        console.log(`📈 Total candidates: ${result.metadata.totalCandidates}`)
        console.log(`⏱️  Last calculated: ${result.metadata.lastCalculatedAt}`)
        console.log(
            `⚡ Calculation duration: ${result.metadata.calculationDuration}ms`,
        )
    } catch (error: any) {
        console.error(
            "❌ Failed to get top applicants:",
            error.response?.data || error.message,
        )
    }
}

// Get system statistics
async function getStatistics(api: any) {
    console.log("📈 System Statistics:")
    console.log("")

    try {
        const response = await api.get("/v1/applicant-assessments/stats")
        const stats = response.data.stats

        console.log(
            `👥 Total Applicants: ${stats.totalAssessments.toLocaleString()}`,
        )
        console.log(
            `📝 Total Assessments: ${stats.totalAssessments.toLocaleString()}`,
        )
        console.log(`📊 Average Score: ${stats.averageScore.toFixed(2)}%`)
        console.log(`✅ Completion Rate: ${stats.completionRate.toFixed(2)}%`)
        console.log("")

        if (stats.scoreDistribution && stats.scoreDistribution.length > 0) {
            console.log("📊 Score Distribution (Top 10):")
            console.log("")

            stats.scoreDistribution
                .slice(0, 10)
                .forEach((item: any, index: number) => {
                    console.log(
                        `${index + 1}. ${item.range}: ${
                            item.count
                        } candidates (${item.percentage.toFixed(1)}%)`,
                    )
                })
            console.log("")
        }
    } catch (error: any) {
        console.error(
            "❌ Failed to get statistics:",
            error.response?.data || error.message,
        )
    }
}

// Trigger ranking calculation
async function triggerRankingCalculation(api: any, jobId: string) {
    console.log("🔄 Triggering ranking calculation...")

    try {
        const response = await api.post("/v1/rankings/calculate", {
            jobId,
            triggerEvent: "MASS_TEST_1000",
        })
        const result = response.data

        console.log(`✅ Ranking calculation completed!`)
        console.log(`📊 Total candidates: ${result.totalCandidates}`)
        console.log(`⏱️  Duration: ${result.calculationDuration}ms`)
        console.log("")
    } catch (error: any) {
        console.error(
            "❌ Failed to trigger ranking calculation:",
            error.response?.data || error.message,
        )
    }
}

// Main function
async function main() {
    try {
        console.log("🎯 TrueFit API - Mass Applicant Testing Script (AXIOS)")
        console.log("=====================================================")
        console.log("")

        // Login and get token
        const token = await login()
        const api = createAuthenticatedAxios(token)

        // Setup complete test environment (company, template, job)
        const jobId = await setupTestEnvironment(api)

        // Check if we should create new applicants or just show results
        const shouldCreate = process.argv.includes("--create")

        if (shouldCreate) {
            const results = await createMassApplicants(api, jobId)

            if (results.successCount > 0) {
                console.log(
                    "⏳ Assessments submitted - rankings updating automatically...",
                )

                // Wait a moment for automatic rankings to be processed
                await new Promise((resolve) => setTimeout(resolve, 3000))
            }
        }

        // Always show statistics and top applicants
        await getStatistics(api)
        await getTopApplicants(api, jobId, 20)
    } catch (error: any) {
        console.error(
            "❌ Script failed:",
            error.response?.data || error.message,
        )
        process.exit(1)
    }
}

if (require.main === module) {
    main()
}

export {
    createMassApplicants,
    getTopApplicants,
    getStatistics,
    triggerRankingCalculation,
}
