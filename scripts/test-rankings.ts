import dotenv from "dotenv"
dotenv.config()

import { PrismaClient } from "@prisma/client"
import { getServices } from "../src/services"
import { envToLogger } from "../src/config"
import { makeDB } from "../src/persistence/db"
import AwaitableEventRelaying from "../src/services/events/awaitable"

const prisma = new PrismaClient()

async function testRankings() {
    console.log("🧪 Testing Candidate Ranking System...")

    try {
        // Set up services
        const logger = envToLogger(process.env.ENV || "development")
        const db = makeDB()
        const events = new AwaitableEventRelaying()
        const services = getServices(db, logger, events)

        // Get jobs that have assessment templates (and therefore candidates)
        const jobs = await prisma.job.findMany({
            where: {
                templates: {
                    some: {
                        assessments: {
                            some: {},
                        },
                    },
                },
            },
            take: 3,
            include: {
                branch: {
                    include: {
                        company: true,
                    },
                },
                templates: {
                    include: {
                        _count: {
                            select: {
                                assessments: true,
                            },
                        },
                    },
                },
            },
        })

        console.log(`\n📋 Testing rankings for ${jobs.length} jobs:\n`)

        for (const job of jobs) {
            const totalAssessments = job.templates.reduce(
                (sum, t) => sum + t._count.assessments,
                0,
            )
            console.log(
                `🎯 Testing: "${job.title}" at ${job.branch.company.name} ${job.branch.name}`,
            )
            console.log(
                `   📊 Expected candidates: ${totalAssessments} assessments`,
            )

            try {
                // Test ranking calculation
                const rankingService = services.getCandidateRankingService()
                console.log("   ⏳ Calculating rankings...")

                const start = Date.now()
                const result = await rankingService.recalculateJobRankings(
                    job.id,
                    "TEST_SCRIPT",
                )
                const duration = Date.now() - start

                console.log(
                    `   ✅ Ranked ${result.totalCandidates} candidates in ${duration}ms`,
                )

                // Get top 5 candidates
                const topCandidates = await rankingService.getTopCandidates(
                    job.id,
                    5,
                )

                console.log(`   🏆 Top 5 Candidates:`)

                if (topCandidates.candidates.length === 0) {
                    console.log("      (No candidates found)")
                } else {
                    topCandidates.candidates.forEach((candidate, index) => {
                        const percentage = candidate.percentage.toFixed(1)
                        const score = candidate.score.toFixed(2)
                        console.log(
                            `      ${index + 1}. ${
                                candidate.applicant.firstName
                            } ${candidate.applicant.lastName}`,
                        )
                        console.log(
                            `         Score: ${score} points (${percentage}%)`,
                        )
                        console.log(
                            `         ✅ ${candidate.correctAnswers} correct, ❌ ${candidate.incorrectAnswers} incorrect`,
                        )
                        if (
                            candidate.recencyBonus &&
                            candidate.recencyBonus > 0
                        ) {
                            console.log(
                                `         🚀 Recency bonus: +${candidate.recencyBonus.toFixed(
                                    2,
                                )} points`,
                            )
                        }
                    })
                }

                // Test getting ranking status
                const status = await rankingService.getJobRankingStatus(job.id)
                console.log(
                    `   📊 Status: ${status.status}, Last calculated: ${status.lastCalculatedAt}`,
                )

                console.log("")
            } catch (error) {
                console.error(`   ❌ Failed to rank candidates: ${error}`)
                console.log("")
            }
        }

        // Test candidate distribution analysis
        console.log("📈 Score Distribution Analysis:")

        const candidates = await prisma.candidateRanking.findMany({
            take: 20,
            orderBy: { score: "desc" },
            include: {
                applicant: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
                job: {
                    select: {
                        title: true,
                    },
                },
            },
        })

        if (candidates.length > 0) {
            console.log("\n🏅 Overall Top Performers:")
            candidates.slice(0, 10).forEach((candidate, index) => {
                console.log(
                    `   ${index + 1}. ${candidate.applicant.firstName} ${
                        candidate.applicant.lastName
                    } - ${candidate.score.toFixed(
                        2,
                    )} pts (${candidate.percentage.toFixed(1)}%) - ${
                        candidate.job.title
                    }`,
                )
            })

            // Calculate score statistics
            const scores = candidates.map((c) => c.score)
            const avgScore =
                scores.reduce((sum, score) => sum + score, 0) / scores.length
            const maxScore = Math.max(...scores)
            const minScore = Math.min(...scores)

            console.log(`\n📊 Score Statistics (top 20):`)
            console.log(`   Average: ${avgScore.toFixed(2)} points`)
            console.log(`   Highest: ${maxScore.toFixed(2)} points`)
            console.log(`   Lowest: ${minScore.toFixed(2)} points`)
            console.log(`   Range: ${(maxScore - minScore).toFixed(2)} points`)

            // Check skill distribution
            const skillLevels = {
                high: candidates.filter((c) => c.percentage >= 80).length,
                medium: candidates.filter(
                    (c) => c.percentage >= 60 && c.percentage < 80,
                ).length,
                low: candidates.filter((c) => c.percentage < 60).length,
            }

            console.log(`\n🎯 Performance Distribution (top 20):`)
            console.log(`   High performers (≥80%): ${skillLevels.high}`)
            console.log(`   Medium performers (60-79%): ${skillLevels.medium}`)
            console.log(`   Lower performers (<60%): ${skillLevels.low}`)
        }

        console.log("\n✅ Ranking system test completed successfully!")
    } catch (error) {
        console.error("❌ Test failed:", error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Run the test
testRankings().catch((error) => {
    console.error("💥 Fatal error in ranking test:", error)
    process.exit(1)
})
