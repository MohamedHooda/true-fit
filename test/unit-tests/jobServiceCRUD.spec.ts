import { expect } from "chai"
import pino from "pino"
import { JobStatus } from "@prisma/client"

import { JobCreate, JobUpdate, JobFilters } from "../../src/types/job"
import getJobService from "../../src/services/jobs"
import AwaitableEventRelaying from "../../src/services/events/awaitable"
import makeMockDB from "./mockDB"
import getJobPool from "../../src/persistence/db/pool/jobs"

describe("JobService CRUD", async function () {
    const logger = pino()
    const events = new AwaitableEventRelaying()
    const db = makeMockDB()
    const pool = getJobPool(db, logger)
    const jobService = getJobService(pool, events)

    // Mock data setup
    let companyId: string
    let branchId: string

    before(async function () {
        // Create a test company
        const company = await db.company.create({
            data: {
                name: "Test Company",
                description: "A test company for job testing",
                website: "https://test-company.com",
            },
        })
        companyId = company.id

        // Create a test branch
        const branch = await db.branch.create({
            data: {
                name: "Test Branch",
                city: "Test City",
                country: "Test Country",
                address: "123 Test Street",
                companyId: company.id,
            },
        })
        branchId = branch.id
    })

    describe("Create Job", function () {
        it("should create a job with all required fields", async function () {
            const jobData: JobCreate = {
                title: "Software Engineer",
                description: "We are looking for a talented software engineer",
                requirements: "Bachelor's degree in Computer Science",
                status: JobStatus.OPEN,
                openPositions: 3,
                branchId: branchId,
            }

            const job = await jobService.createJob(jobData)

            expect(job.title).to.equal("Software Engineer")
            expect(job.description).to.equal(
                "We are looking for a talented software engineer",
            )
            expect(job.requirements).to.equal(
                "Bachelor's degree in Computer Science",
            )
            expect(job.status).to.equal(JobStatus.OPEN)
            expect(job.openPositions).to.equal(3)
            expect(job.branchId).to.equal(branchId)
            expect(job.id).to.be.a("string")
            expect(job.createdAt).to.exist
        })

        it("should create a job with minimal required fields", async function () {
            const jobData: JobCreate = {
                title: "Data Analyst",
                branchId: branchId,
            }

            const job = await jobService.createJob(jobData)

            expect(job.title).to.equal("Data Analyst")
            expect(job.branchId).to.equal(branchId)
            expect(job.description).to.be.null
            expect(job.requirements).to.be.null
            expect(job.status).to.equal(JobStatus.OPEN) // Default status
            expect(job.openPositions).to.be.null
        })

        it("should create a job with DRAFT status", async function () {
            const jobData: JobCreate = {
                title: "Product Manager",
                status: JobStatus.DRAFT,
                branchId: branchId,
            }

            const job = await jobService.createJob(jobData)

            expect(job.title).to.equal("Product Manager")
            expect(job.status).to.equal(JobStatus.DRAFT)
            expect(job.branchId).to.equal(branchId)
        })
    })

    describe("Get Job", function () {
        let testJobId: string

        before(async function () {
            const jobData: JobCreate = {
                title: "Test Job for Retrieval",
                description: "This is a test job for retrieval testing",
                branchId: branchId,
            }
            const job = await jobService.createJob(jobData)
            testJobId = job.id
        })

        it("should get a job by ID with details", async function () {
            const job = await jobService.getJobById(testJobId)

            expect(job).to.not.be.null
            expect(job!.id).to.equal(testJobId)
            expect(job!.title).to.equal("Test Job for Retrieval")
            expect(job!.description).to.equal(
                "This is a test job for retrieval testing",
            )
            expect(job!.branch).to.be.an("object")
            expect(job!.branch.name).to.equal("Test Branch")
            expect(job!.branch.company).to.be.an("object")
            expect(job!.branch.company.name).to.equal("Test Company")
            expect(job!.templates).to.be.an("array")
            expect(job!.jobApplications).to.be.an("array")
        })

        it("should return null for non-existent job ID", async function () {
            const job = await jobService.getJobById("non-existent-id")
            expect(job).to.be.null
        })
    })

    describe("Update Job", function () {
        let testJobId: string

        beforeEach(async function () {
            const jobData: JobCreate = {
                title: "Job to Update",
                description: "Original description",
                status: JobStatus.DRAFT,
                openPositions: 1,
                branchId: branchId,
            }
            const job = await jobService.createJob(jobData)
            testJobId = job.id
        })

        it("should update job title", async function () {
            const updateData: JobUpdate = {
                title: "Updated Job Title",
            }

            const updatedJob = await jobService.updateJob(testJobId, updateData)

            expect(updatedJob.title).to.equal("Updated Job Title")
            expect(updatedJob.description).to.equal("Original description") // Unchanged
            expect(updatedJob.id).to.equal(testJobId)
        })

        it("should update job status", async function () {
            const updateData: JobUpdate = {
                status: JobStatus.OPEN,
            }

            const updatedJob = await jobService.updateJob(testJobId, updateData)

            expect(updatedJob.status).to.equal(JobStatus.OPEN)
            expect(updatedJob.title).to.equal("Job to Update") // Unchanged
        })

        it("should update multiple fields", async function () {
            const updateData: JobUpdate = {
                title: "Completely Updated Job",
                description: "New and improved description",
                requirements: "New requirements",
                status: JobStatus.CLOSED,
                openPositions: 5,
            }

            const updatedJob = await jobService.updateJob(testJobId, updateData)

            expect(updatedJob.title).to.equal("Completely Updated Job")
            expect(updatedJob.description).to.equal(
                "New and improved description",
            )
            expect(updatedJob.requirements).to.equal("New requirements")
            expect(updatedJob.status).to.equal(JobStatus.CLOSED)
            expect(updatedJob.openPositions).to.equal(5)
        })

        it("should set fields to null when explicitly updated to null", async function () {
            const updateData: JobUpdate = {
                description: null,
                requirements: null,
                openPositions: null,
            }

            const updatedJob = await jobService.updateJob(testJobId, updateData)

            expect(updatedJob.description).to.be.null
            expect(updatedJob.requirements).to.be.null
            expect(updatedJob.openPositions).to.be.null
            expect(updatedJob.title).to.equal("Job to Update") // Unchanged
        })
    })

    describe("Delete Job", function () {
        it("should delete a job", async function () {
            // Create a job to delete
            const jobData: JobCreate = {
                title: "Job to Delete",
                branchId: branchId,
            }
            const job = await jobService.createJob(jobData)

            // Delete the job
            await jobService.deleteJob(job.id)

            // Verify it's deleted
            const deletedJob = await jobService.getJobById(job.id)
            expect(deletedJob).to.be.null
        })
    })

    describe("Get Jobs with Filters", function () {
        before(async function () {
            // Create multiple test jobs with different statuses
            const jobsData: JobCreate[] = [
                {
                    title: "Frontend Developer",
                    description: "React and TypeScript experience required",
                    status: JobStatus.OPEN,
                    branchId: branchId,
                },
                {
                    title: "Backend Developer",
                    description: "Node.js and database experience",
                    status: JobStatus.OPEN,
                    branchId: branchId,
                },
                {
                    title: "DevOps Engineer",
                    description: "AWS and Docker experience",
                    status: JobStatus.CLOSED,
                    branchId: branchId,
                },
                {
                    title: "UI/UX Designer",
                    description: "Figma and design systems",
                    status: JobStatus.DRAFT,
                    branchId: branchId,
                },
                {
                    title: "Project Manager",
                    description: "Agile and Scrum methodology",
                    status: JobStatus.OPEN,
                    branchId: branchId,
                },
            ]

            for (const jobData of jobsData) {
                await jobService.createJob(jobData)
            }
        })

        it("should get all jobs without filters", async function () {
            const jobs = await jobService.getJobs()

            expect(jobs).to.be.an("array")
            expect(jobs.length).to.be.greaterThan(5) // At least the 5 we created + any from other tests

            // Check that jobs have branch information
            jobs.forEach((job) => {
                expect(job.branch).to.be.an("object")
                expect(job.branch.company).to.be.an("object")
            })
        })

        it("should filter jobs by status", async function () {
            const filters: JobFilters = { status: JobStatus.OPEN }
            const jobs = await jobService.getJobs(filters)

            expect(jobs).to.be.an("array")
            expect(jobs.length).to.be.greaterThan(0)
            jobs.forEach((job) => {
                expect(job.status).to.equal(JobStatus.OPEN)
            })
        })

        it("should filter jobs by branch ID", async function () {
            const filters: JobFilters = { branchId: branchId }
            const jobs = await jobService.getJobs(filters)

            expect(jobs).to.be.an("array")
            expect(jobs.length).to.be.greaterThan(0)
            jobs.forEach((job) => {
                expect(job.branchId).to.equal(branchId)
            })
        })

        it("should filter jobs by company ID", async function () {
            const filters: JobFilters = { companyId: companyId }
            const jobs = await jobService.getJobs(filters)

            expect(jobs).to.be.an("array")
            expect(jobs.length).to.be.greaterThan(0)
            jobs.forEach((job) => {
                expect(job.branch.company.id).to.equal(companyId)
            })
        })
    })

    describe("Get Job Statistics", function () {
        before(async function () {
            // Clean up existing jobs for this company to get predictable stats
            const existingJobs = await jobService.getJobs({
                companyId: companyId,
            })
            for (const job of existingJobs) {
                await jobService.deleteJob(job.id)
            }

            // Create jobs with known statuses for statistics
            const jobsData: JobCreate[] = [
                {
                    title: "Open Job 1",
                    status: JobStatus.OPEN,
                    branchId: branchId,
                },
                {
                    title: "Open Job 2",
                    status: JobStatus.OPEN,
                    branchId: branchId,
                },
                {
                    title: "Open Job 3",
                    status: JobStatus.OPEN,
                    branchId: branchId,
                },
                {
                    title: "Closed Job 1",
                    status: JobStatus.CLOSED,
                    branchId: branchId,
                },
                {
                    title: "Closed Job 2",
                    status: JobStatus.CLOSED,
                    branchId: branchId,
                },
                {
                    title: "Draft Job 1",
                    status: JobStatus.DRAFT,
                    branchId: branchId,
                },
            ]

            for (const jobData of jobsData) {
                await jobService.createJob(jobData)
            }
        })

        it("should get correct job statistics for a company", async function () {
            const stats = await jobService.getJobStats(undefined, companyId)

            expect(stats).to.be.an("object")
            expect(stats.total).to.equal(6)
            expect(stats.open).to.equal(3)
            expect(stats.closed).to.equal(2)
            expect(stats.draft).to.equal(1)
        })

        it("should throw error when neither branchId nor companyId is provided", async function () {
            try {
                await jobService.getJobStats()
                expect.fail("Should have thrown an error")
            } catch (error) {
                expect((error as Error).message).to.include(
                    "Either branchId or companyId must be provided",
                )
            }
        })
    })
})
