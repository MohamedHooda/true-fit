import { expect } from "chai"
import pino from "pino"

import {
    Company,
    CompanyWithBranches,
    CompanyCreateRequest,
    CompanyUpdate,
} from "../../src/types/company"
import getCompanyService from "../../src/services/companies"
import AwaitableEventRelaying from "../../src/services/events/awaitable"
import makeMockDB from "./mockDB"
import getCompanyPool from "../../src/persistence/db/pool/companies"

describe("CompanyService CRUD", async function () {
    const logger = pino()
    const events = new AwaitableEventRelaying()
    const db = makeMockDB()
    const pool = getCompanyPool(db, logger)
    const companyService = getCompanyService(pool, events)

    describe("Create Company", function () {
        it("should create a company with all required fields and default branch", async function () {
            const companyData: CompanyCreateRequest = {
                name: "Tech Innovations Inc",
                description: "A leading technology company",
                website: "https://tech-innovations.com",
                email: "contact@tech-innovations.com",
                phone: "+1234567890",
                address: "123 Innovation Drive, Tech City, TC 12345",
            }

            const company = await companyService.createCompany(companyData)

            expect(company.name).to.equal("Tech Innovations Inc")
            expect(company.description).to.equal("A leading technology company")
            expect(company.website).to.equal("https://tech-innovations.com")
            expect(company.email).to.equal("contact@tech-innovations.com")
            expect(company.phone).to.equal("+1234567890")
            expect(company.address).to.equal(
                "123 Innovation Drive, Tech City, TC 12345",
            )
            expect(company.id).to.be.a("string")
            expect(company.createdAt).to.exist
            expect(company.branches).to.be.an("array")
            expect(company.branches).to.have.length(1)
            expect(company.branches[0].name).to.equal("Main")
        })

        it("should create a company with minimal required fields", async function () {
            const companyData: CompanyCreateRequest = {
                name: "Minimal Company",
            }

            const company = await companyService.createCompany(companyData)

            expect(company.name).to.equal("Minimal Company")
            expect(company.description).to.be.null
            expect(company.website).to.be.null
            expect(company.email).to.be.null
            expect(company.phone).to.be.null
            expect(company.address).to.be.null
            expect(company.id).to.be.a("string")
            expect(company.createdAt).to.exist
            expect(company.branches).to.be.an("array")
            expect(company.branches).to.have.length(1)
            expect(company.branches[0].name).to.equal("Main")
        })

        it("should create a company with custom branches", async function () {
            const companyData: CompanyCreateRequest = {
                name: "Multi Branch Corp",
                description: "A company with multiple locations",
                branches: [
                    {
                        name: "Headquarters",
                        city: "New York",
                        country: "USA",
                        address: "123 Main St",
                        email: "hq@company.com",
                        phone: "+1111111111",
                    },
                    {
                        name: "West Coast Office",
                        city: "San Francisco",
                        country: "USA",
                        address: "456 Tech Ave",
                        email: "west@company.com",
                    },
                ],
            }

            const company = await companyService.createCompany(companyData)

            expect(company.name).to.equal("Multi Branch Corp")
            expect(company.branches).to.be.an("array")
            expect(company.branches).to.have.length(2)

            const hq = company.branches.find((b) => b.name === "Headquarters")
            expect(hq).to.exist
            expect(hq!.city).to.equal("New York")
            expect(hq!.country).to.equal("USA")
            expect(hq!.email).to.equal("hq@company.com")

            const westCoast = company.branches.find(
                (b) => b.name === "West Coast Office",
            )
            expect(westCoast).to.exist
            expect(westCoast!.city).to.equal("San Francisco")
            expect(westCoast!.email).to.equal("west@company.com")
        })

        it("should throw error when creating company with duplicate name", async function () {
            const companyData: CompanyCreateRequest = {
                name: "Duplicate Company",
            }

            // Create first company
            await companyService.createCompany(companyData)

            // Try to create second company with same name
            const duplicateData: CompanyCreateRequest = {
                name: "Duplicate Company",
                description: "Different description",
            }

            try {
                await companyService.createCompany(duplicateData)
                expect.fail("Should have thrown an error")
            } catch (error) {
                expect((error as Error).message).to.include(
                    "Company with this name already exists",
                )
            }
        })
    })

    describe("Get Company", function () {
        let testCompanyId: string

        before(async function () {
            const companyData: CompanyCreateRequest = {
                name: "Test Retrieval Company",
                description: "Company for testing retrieval",
                website: "https://test-retrieval.com",
            }
            const company = await companyService.createCompany(companyData)
            testCompanyId = company.id
        })

        it("should get a company by ID with branches", async function () {
            const company = await companyService.getCompanyById(testCompanyId)

            expect(company).to.not.be.null
            expect(company!.id).to.equal(testCompanyId)
            expect(company!.name).to.equal("Test Retrieval Company")
            expect(company!.description).to.equal(
                "Company for testing retrieval",
            )
            expect(company!.website).to.equal("https://test-retrieval.com")
            expect(company!.branches).to.be.an("array")
            expect(company!.branches).to.have.length.greaterThan(0)
        })

        it("should get a company by name", async function () {
            const company = await companyService.getCompanyByName(
                "Test Retrieval Company",
            )

            expect(company).to.not.be.null
            expect(company!.id).to.equal(testCompanyId)
            expect(company!.name).to.equal("Test Retrieval Company")
            expect(company!.description).to.equal(
                "Company for testing retrieval",
            )
        })

        it("should return null for non-existent company ID", async function () {
            const company = await companyService.getCompanyById(
                "non-existent-id",
            )
            expect(company).to.be.null
        })

        it("should return null for non-existent company name", async function () {
            const company = await companyService.getCompanyByName(
                "Non Existent Company",
            )
            expect(company).to.be.null
        })
    })

    describe("Update Company", function () {
        let testCompanyId: string
        let nameCounter = 0

        beforeEach(async function () {
            nameCounter++
            const companyData: CompanyCreateRequest = {
                name: `Update Test Company ${nameCounter}`,
                description: "Original description",
                website: "https://original.com",
                email: "original@company.com",
                phone: "+1111111111",
                address: "Original Address",
            }
            const company = await companyService.createCompany(companyData)
            testCompanyId = company.id
        })

        it("should update company name", async function () {
            const updateData: CompanyUpdate = {
                name: "Updated Company Name",
            }

            const updatedCompany = await companyService.updateCompany(
                testCompanyId,
                updateData,
            )

            expect(updatedCompany.name).to.equal("Updated Company Name")
            expect(updatedCompany.description).to.equal("Original description") // Unchanged
            expect(updatedCompany.id).to.equal(testCompanyId)
        })

        it("should update company description and website", async function () {
            const updateData: CompanyUpdate = {
                description: "New and improved description",
                website: "https://newwebsite.com",
            }

            const updatedCompany = await companyService.updateCompany(
                testCompanyId,
                updateData,
            )

            expect(updatedCompany.description).to.equal(
                "New and improved description",
            )
            expect(updatedCompany.website).to.equal("https://newwebsite.com")
            expect(updatedCompany.name).to.equal(
                `Update Test Company ${nameCounter}`,
            ) // Unchanged
        })

        it("should update contact information", async function () {
            const updateData: CompanyUpdate = {
                email: "newemail@company.com",
                phone: "+9999999999",
                address: "New Address Line",
            }

            const updatedCompany = await companyService.updateCompany(
                testCompanyId,
                updateData,
            )

            expect(updatedCompany.email).to.equal("newemail@company.com")
            expect(updatedCompany.phone).to.equal("+9999999999")
            expect(updatedCompany.address).to.equal("New Address Line")
            expect(updatedCompany.name).to.equal(
                `Update Test Company ${nameCounter}`,
            ) // Unchanged
        })

        it("should set fields to null when explicitly updated to null", async function () {
            const updateData: CompanyUpdate = {
                description: null,
                website: null,
                email: null,
                phone: null,
                address: null,
            }

            const updatedCompany = await companyService.updateCompany(
                testCompanyId,
                updateData,
            )

            expect(updatedCompany.description).to.be.null
            expect(updatedCompany.website).to.be.null
            expect(updatedCompany.email).to.be.null
            expect(updatedCompany.phone).to.be.null
            expect(updatedCompany.address).to.be.null
            expect(updatedCompany.name).to.equal(
                `Update Test Company ${nameCounter}`,
            ) // Unchanged
        })

        it("should throw error when updating to a duplicate name", async function () {
            // Create another company
            const anotherCompany = await companyService.createCompany({
                name: "Another Company",
            })

            const updateData: CompanyUpdate = {
                name: "Another Company",
            }

            try {
                await companyService.updateCompany(testCompanyId, updateData)
                expect.fail("Should have thrown an error")
            } catch (error) {
                expect((error as Error).message).to.include(
                    "Company with this name already exists",
                )
            }
        })
    })

    describe("Delete Company", function () {
        it("should delete a company", async function () {
            // Create a company to delete
            const companyData: CompanyCreateRequest = {
                name: "Company to Delete",
                description: "This company will be deleted",
            }
            const company = await companyService.createCompany(companyData)

            // Delete the company
            await companyService.deleteCompany(company.id)

            // Verify it's deleted
            const deletedCompany = await companyService.getCompanyById(
                company.id,
            )
            expect(deletedCompany).to.be.null
        })
    })

    describe("Get Companies", function () {
        before(async function () {
            // Create multiple test companies
            const timestamp = Date.now()
            const companiesData: CompanyCreateRequest[] = [
                {
                    name: `Tech Corp ${timestamp}`,
                    description: "Technology company",
                    website: "https://techcorp.com",
                },
                {
                    name: `Design Studio ${timestamp}`,
                    description: "Creative design studio",
                    website: "https://designstudio.com",
                },
                {
                    name: `Marketing Agency ${timestamp}`,
                    description: "Full service marketing",
                },
                {
                    name: `Consulting Firm ${timestamp}`,
                    description: "Business consulting services",
                    website: "https://consulting.com",
                    email: "info@consulting.com",
                },
            ]

            for (const companyData of companiesData) {
                await companyService.createCompany(companyData)
            }
        })

        it("should get all companies without filters", async function () {
            const companies = await companyService.getCompanies()

            expect(companies).to.be.an("array")
            expect(companies.length).to.be.greaterThan(4) // At least the 4 we created + any from other tests

            // Check that companies have branches
            companies.forEach((company) => {
                expect(company.branches).to.be.an("array")
                expect(company.branches).to.have.length.greaterThan(0)
            })
        })

        it("should get companies with limit", async function () {
            const companies = await companyService.getCompanies(2)

            expect(companies).to.be.an("array")
            expect(companies.length).to.equal(2)
        })

        it("should get companies with limit and offset", async function () {
            const firstPage = await companyService.getCompanies(2, 0)
            const secondPage = await companyService.getCompanies(2, 2)

            expect(firstPage).to.be.an("array")
            expect(secondPage).to.be.an("array")
            expect(firstPage.length).to.equal(2)
            expect(secondPage.length).to.equal(2)

            // Ensure they're different companies
            const firstPageIds = firstPage.map((c) => c.id)
            const secondPageIds = secondPage.map((c) => c.id)
            expect(firstPageIds).to.not.deep.equal(secondPageIds)
        })
    })
})
