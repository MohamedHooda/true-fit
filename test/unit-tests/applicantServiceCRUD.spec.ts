import { expect } from "chai"
import pino from "pino"

import {
    Applicant,
    ApplicantCreate,
    ApplicantUpdate,
    ApplicantFilters,
} from "../../src/types/applicant"
import getApplicantService from "../../src/services/applicants"
import AwaitableEventRelaying from "../../src/services/events/awaitable"
import makeMockDB from "./mockDB"
import getApplicantPool from "../../src/persistence/db/pool/applicants"

describe("ApplicantService CRUD", async function () {
    const logger = pino()
    const events = new AwaitableEventRelaying()
    const db = makeMockDB()
    const pool = getApplicantPool(db, logger)
    const applicantService = getApplicantService(pool, events)

    describe("Create Applicant", function () {
        it("should create an applicant with all required fields", async function () {
            const applicantData: ApplicantCreate = {
                email: "john.doe@example.com",
                firstName: "John",
                lastName: "Doe",
                phone: "+1234567890",
                city: "New York",
                country: "USA",
                address: "123 Main Street, NY 10001",
                resumeUrl: "https://example.com/resume.pdf",
            }

            const applicant = await applicantService.createApplicant(
                applicantData,
            )

            expect(applicant.email).to.equal("john.doe@example.com")
            expect(applicant.firstName).to.equal("John")
            expect(applicant.lastName).to.equal("Doe")
            expect(applicant.phone).to.equal("+1234567890")
            expect(applicant.city).to.equal("New York")
            expect(applicant.country).to.equal("USA")
            expect(applicant.address).to.equal("123 Main Street, NY 10001")
            expect(applicant.resumeUrl).to.equal(
                "https://example.com/resume.pdf",
            )
            expect(applicant.id).to.be.a("string")
            expect(applicant.createdAt).to.exist
            // Note: updatedAt might be null in prismock for newly created records
        })

        it("should create an applicant with minimal required fields", async function () {
            const applicantData: ApplicantCreate = {
                email: "jane.smith@example.com",
                firstName: "Jane",
                lastName: "Smith",
            }

            const applicant = await applicantService.createApplicant(
                applicantData,
            )

            expect(applicant.email).to.equal("jane.smith@example.com")
            expect(applicant.firstName).to.equal("Jane")
            expect(applicant.lastName).to.equal("Smith")
            expect(applicant.phone).to.be.null
            expect(applicant.city).to.be.null
            expect(applicant.country).to.be.null
            expect(applicant.address).to.be.null
            expect(applicant.resumeUrl).to.be.null
            expect(applicant.id).to.be.a("string")
            expect(applicant.createdAt).to.exist
        })

        it("should throw error when creating applicant with duplicate email", async function () {
            const applicantData: ApplicantCreate = {
                email: "duplicate@example.com",
                firstName: "First",
                lastName: "User",
            }

            // Create first applicant
            await applicantService.createApplicant(applicantData)

            // Try to create second applicant with same email
            const duplicateData: ApplicantCreate = {
                email: "duplicate@example.com",
                firstName: "Second",
                lastName: "User",
            }

            try {
                await applicantService.createApplicant(duplicateData)
                expect.fail("Should have thrown an error")
            } catch (error) {
                expect((error as Error).message).to.include(
                    "Applicant with this email already exists",
                )
            }
        })
    })

    describe("Get Applicant", function () {
        let testApplicantId: string

        before(async function () {
            const applicantData: ApplicantCreate = {
                email: "test.retrieval@example.com",
                firstName: "Test",
                lastName: "Retrieval",
                city: "San Francisco",
                country: "USA",
            }
            const applicant = await applicantService.createApplicant(
                applicantData,
            )
            testApplicantId = applicant.id
        })

        it("should get an applicant by ID with details", async function () {
            const applicant = await applicantService.getApplicantById(
                testApplicantId,
            )

            expect(applicant).to.not.be.null
            expect(applicant!.id).to.equal(testApplicantId)
            expect(applicant!.email).to.equal("test.retrieval@example.com")
            expect(applicant!.firstName).to.equal("Test")
            expect(applicant!.lastName).to.equal("Retrieval")
            expect(applicant!.city).to.equal("San Francisco")
            expect(applicant!.country).to.equal("USA")
            expect(applicant!.assessments).to.be.an("array")
            expect(applicant!.jobApplications).to.be.an("array")
        })

        it("should get an applicant by email", async function () {
            const applicant = await applicantService.getApplicantByEmail(
                "test.retrieval@example.com",
            )

            expect(applicant).to.not.be.null
            expect(applicant!.id).to.equal(testApplicantId)
            expect(applicant!.email).to.equal("test.retrieval@example.com")
            expect(applicant!.firstName).to.equal("Test")
            expect(applicant!.lastName).to.equal("Retrieval")
        })

        it("should return null for non-existent applicant ID", async function () {
            const applicant = await applicantService.getApplicantById(
                "non-existent-id",
            )
            expect(applicant).to.be.null
        })

        it("should return null for non-existent email", async function () {
            const applicant = await applicantService.getApplicantByEmail(
                "nonexistent@example.com",
            )
            expect(applicant).to.be.null
        })
    })

    describe("Update Applicant", function () {
        let testApplicantId: string
        let emailCounter = 0

        beforeEach(async function () {
            emailCounter++
            const applicantData: ApplicantCreate = {
                email: `update.test${emailCounter}@example.com`,
                firstName: "Original",
                lastName: "Name",
                phone: "+1111111111",
                city: "Original City",
                country: "Original Country",
            }
            const applicant = await applicantService.createApplicant(
                applicantData,
            )
            testApplicantId = applicant.id
        })

        it("should update applicant name", async function () {
            const updateData: ApplicantUpdate = {
                firstName: "Updated",
                lastName: "NewName",
            }

            const updatedApplicant = await applicantService.updateApplicant(
                testApplicantId,
                updateData,
            )

            expect(updatedApplicant.firstName).to.equal("Updated")
            expect(updatedApplicant.lastName).to.equal("NewName")
            expect(updatedApplicant.phone).to.equal("+1111111111") // Unchanged
            expect(updatedApplicant.id).to.equal(testApplicantId)
        })

        it("should update contact information", async function () {
            const updateData: ApplicantUpdate = {
                phone: "+9999999999",
                city: "New City",
                country: "New Country",
                address: "New Address",
            }

            const updatedApplicant = await applicantService.updateApplicant(
                testApplicantId,
                updateData,
            )

            expect(updatedApplicant.phone).to.equal("+9999999999")
            expect(updatedApplicant.city).to.equal("New City")
            expect(updatedApplicant.country).to.equal("New Country")
            expect(updatedApplicant.address).to.equal("New Address")
            expect(updatedApplicant.firstName).to.equal("Original") // Unchanged
        })

        it("should update resume URL", async function () {
            const updateData: ApplicantUpdate = {
                resumeUrl: "https://newdomain.com/updated-resume.pdf",
            }

            const updatedApplicant = await applicantService.updateApplicant(
                testApplicantId,
                updateData,
            )

            expect(updatedApplicant.resumeUrl).to.equal(
                "https://newdomain.com/updated-resume.pdf",
            )
            expect(updatedApplicant.firstName).to.equal("Original") // Unchanged
        })

        it("should set fields to null when explicitly updated to null", async function () {
            const updateData: ApplicantUpdate = {
                phone: null,
                city: null,
                country: null,
                address: null,
                resumeUrl: null,
            }

            const updatedApplicant = await applicantService.updateApplicant(
                testApplicantId,
                updateData,
            )

            expect(updatedApplicant.phone).to.be.null
            expect(updatedApplicant.city).to.be.null
            expect(updatedApplicant.country).to.be.null
            expect(updatedApplicant.address).to.be.null
            expect(updatedApplicant.resumeUrl).to.be.null
            expect(updatedApplicant.firstName).to.equal("Original") // Unchanged
        })
    })

    describe("Delete Applicant", function () {
        it("should delete an applicant", async function () {
            // Create an applicant to delete
            const applicantData: ApplicantCreate = {
                email: "delete.test@example.com",
                firstName: "Delete",
                lastName: "Test",
            }
            const applicant = await applicantService.createApplicant(
                applicantData,
            )

            // Delete the applicant
            await applicantService.deleteApplicant(applicant.id)

            // Verify it's deleted
            const deletedApplicant = await applicantService.getApplicantById(
                applicant.id,
            )
            expect(deletedApplicant).to.be.null
        })
    })

    describe("Get Applicants with Filters", function () {
        before(async function () {
            // Create multiple test applicants with different properties
            const timestamp = Date.now()
            const applicantsData: ApplicantCreate[] = [
                {
                    email: `alice.developer.${timestamp}@example.com`,
                    firstName: "Alice",
                    lastName: "Developer",
                    city: "San Francisco",
                    country: "USA",
                    phone: "+1234567890",
                },
                {
                    email: `bob.designer.${timestamp}@example.com`,
                    firstName: "Bob",
                    lastName: "Designer",
                    city: "New York",
                    country: "USA",
                    phone: "+1234567891",
                },
                {
                    email: `charlie.manager.${timestamp}@example.com`,
                    firstName: "Charlie",
                    lastName: "Manager",
                    city: "London",
                    country: "UK",
                },
                {
                    email: `diana.analyst.${timestamp}@example.com`,
                    firstName: "Diana",
                    lastName: "Analyst",
                    city: "Toronto",
                    country: "Canada",
                    resumeUrl: "https://example.com/diana-resume.pdf",
                },
                {
                    email: `eve.engineer.${timestamp}@example.com`,
                    firstName: "Eve",
                    lastName: "Engineer",
                    city: "San Francisco",
                    country: "USA",
                    address: "123 Tech Street",
                },
            ]

            for (const applicantData of applicantsData) {
                await applicantService.createApplicant(applicantData)
            }
        })

        it("should get all applicants without filters", async function () {
            const applicants = await applicantService.getApplicants()

            expect(applicants).to.be.an("array")
            expect(applicants.length).to.be.greaterThan(5) // At least the 5 we created + any from other tests
        })
    })

    describe("Get Applicant Statistics", function () {
        before(async function () {
            // Create applicants with known properties for statistics
            const statsTimestamp = Date.now()
            const applicantsData: ApplicantCreate[] = [
                {
                    email: `stats1.${statsTimestamp}@example.com`,
                    firstName: "Stats",
                    lastName: "User1",
                },
                {
                    email: `stats2.${statsTimestamp}@example.com`,
                    firstName: "Stats",
                    lastName: "User2",
                },
                {
                    email: `stats3.${statsTimestamp}@example.com`,
                    firstName: "Stats",
                    lastName: "User3",
                },
            ]

            for (const applicantData of applicantsData) {
                await applicantService.createApplicant(applicantData)
            }
        })

        it("should get correct applicant statistics", async function () {
            const stats = await applicantService.getApplicantStats()

            expect(stats).to.be.an("object")
            expect(stats.total).to.be.a("number")
            expect(stats.total).to.be.greaterThan(0)
            expect(stats.withAssessments).to.be.a("number")
            expect(stats.withApplications).to.be.a("number")
            // Note: withAssessments and withApplications will be 0 in tests
            // since we're not creating assessments or applications
            expect(stats.withAssessments).to.be.at.least(0)
            expect(stats.withApplications).to.be.at.least(0)
        })
    })
})
