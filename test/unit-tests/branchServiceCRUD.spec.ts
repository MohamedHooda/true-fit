import { expect } from "chai"
import pino from "pino"

import {
    Branch,
    BranchWithCompany,
    BranchCreateRequest,
    BranchUpdate,
    CompanyCreateRequest,
} from "../../src/types/company"
import getBranchService from "../../src/services/branches"
import getCompanyService from "../../src/services/companies"
import AwaitableEventRelaying from "../../src/services/events/awaitable"
import makeMockDB from "./mockDB"
import getBranchPool from "../../src/persistence/db/pool/branches"
import getCompanyPool from "../../src/persistence/db/pool/companies"

describe("BranchService CRUD", async function () {
    const logger = pino()
    const events = new AwaitableEventRelaying()
    const db = makeMockDB()
    const branchPool = getBranchPool(db, logger)
    const companyPool = getCompanyPool(db, logger)
    const branchService = getBranchService(branchPool, companyPool, events)
    const companyService = getCompanyService(companyPool, events)

    // Mock data setup
    let companyId: string

    before(async function () {
        // Create a test company
        const companyData: CompanyCreateRequest = {
            name: "Test Company for Branches",
            description: "A test company for branch testing",
            website: "https://test-company-branches.com",
        }
        const company = await companyService.createCompany(companyData)
        companyId = company.id
    })

    describe("Create Branch", function () {
        it("should create a branch with all required fields", async function () {
            const branchData: BranchCreateRequest = {
                name: "Downtown Office",
                city: "New York",
                country: "USA",
                address: "123 Main Street, NY 10001",
                email: "downtown@company.com",
                phone: "+1234567890",
                companyId: companyId,
            }

            const branch = await branchService.createBranch(branchData)

            expect(branch.name).to.equal("Downtown Office")
            expect(branch.city).to.equal("New York")
            expect(branch.country).to.equal("USA")
            expect(branch.address).to.equal("123 Main Street, NY 10001")
            expect(branch.email).to.equal("downtown@company.com")
            expect(branch.phone).to.equal("+1234567890")
            expect(branch.companyId).to.equal(companyId)
            expect(branch.id).to.be.a("string")
            expect(branch.createdAt).to.exist
        })

        it("should create a branch with minimal required fields", async function () {
            const branchData: BranchCreateRequest = {
                name: "Minimal Branch",
                companyId: companyId,
            }

            const branch = await branchService.createBranch(branchData)

            expect(branch.name).to.equal("Minimal Branch")
            expect(branch.companyId).to.equal(companyId)
            expect(branch.city).to.be.null
            expect(branch.country).to.be.null
            expect(branch.address).to.be.null
            expect(branch.email).to.be.null
            expect(branch.phone).to.be.null
            expect(branch.id).to.be.a("string")
            expect(branch.createdAt).to.exist
        })

        it("should throw error when creating branch without company ID", async function () {
            const branchData: BranchCreateRequest = {
                name: "No Company Branch",
            }

            try {
                await branchService.createBranch(branchData)
                expect.fail("Should have thrown an error")
            } catch (error) {
                expect((error as Error).message).to.include(
                    "Company ID is required",
                )
            }
        })

        it("should throw error when creating branch for non-existent company", async function () {
            const branchData: BranchCreateRequest = {
                name: "Invalid Company Branch",
                companyId: "non-existent-company-id",
            }

            try {
                await branchService.createBranch(branchData)
                expect.fail("Should have thrown an error")
            } catch (error) {
                expect((error as Error).message).to.include("Company not found")
            }
        })

        it("should throw error when creating branch with duplicate name for same company", async function () {
            const branchData: BranchCreateRequest = {
                name: "Duplicate Branch Name",
                companyId: companyId,
            }

            // Create first branch
            await branchService.createBranch(branchData)

            // Try to create second branch with same name for same company
            const duplicateData: BranchCreateRequest = {
                name: "Duplicate Branch Name",
                city: "Different City",
                companyId: companyId,
            }

            try {
                await branchService.createBranch(duplicateData)
                expect.fail("Should have thrown an error")
            } catch (error) {
                expect((error as Error).message).to.include(
                    "Branch with this name already exists for this company",
                )
            }
        })
    })

    describe("Get Branch", function () {
        let testBranchId: string

        before(async function () {
            const branchData: BranchCreateRequest = {
                name: "Test Retrieval Branch",
                city: "San Francisco",
                country: "USA",
                address: "456 Tech Avenue",
                companyId: companyId,
            }
            const branch = await branchService.createBranch(branchData)
            testBranchId = branch.id
        })

        it("should get a branch by ID with company", async function () {
            const branch = await branchService.getBranchById(testBranchId)

            expect(branch).to.not.be.null
            expect(branch!.id).to.equal(testBranchId)
            expect(branch!.name).to.equal("Test Retrieval Branch")
            expect(branch!.city).to.equal("San Francisco")
            expect(branch!.country).to.equal("USA")
            expect(branch!.company).to.be.an("object")
            expect(branch!.company.name).to.equal("Test Company for Branches")
        })

        it("should return null for non-existent branch ID", async function () {
            const branch = await branchService.getBranchById("non-existent-id")
            expect(branch).to.be.null
        })

        it("should get branches by company ID", async function () {
            const branches = await branchService.getBranchesByCompanyId(
                companyId,
            )

            expect(branches).to.be.an("array")
            expect(branches.length).to.be.greaterThan(0)
            branches.forEach((branch) => {
                expect(branch.companyId).to.equal(companyId)
            })
        })
    })

    describe("Update Branch", function () {
        let testBranchId: string
        let nameCounter = 0

        beforeEach(async function () {
            nameCounter++
            const branchData: BranchCreateRequest = {
                name: `Update Test Branch ${nameCounter}`,
                city: "Original City",
                country: "Original Country",
                address: "Original Address",
                email: "original@branch.com",
                phone: "+1111111111",
                companyId: companyId,
            }
            const branch = await branchService.createBranch(branchData)
            testBranchId = branch.id
        })

        it("should update branch name", async function () {
            const updateData: BranchUpdate = {
                name: "Updated Branch Name",
            }

            const updatedBranch = await branchService.updateBranch(
                testBranchId,
                updateData,
            )

            expect(updatedBranch.name).to.equal("Updated Branch Name")
            expect(updatedBranch.city).to.equal("Original City") // Unchanged
            expect(updatedBranch.id).to.equal(testBranchId)
        })

        it("should update branch location", async function () {
            const updateData: BranchUpdate = {
                city: "New City",
                country: "New Country",
                address: "New Address",
            }

            const updatedBranch = await branchService.updateBranch(
                testBranchId,
                updateData,
            )

            expect(updatedBranch.city).to.equal("New City")
            expect(updatedBranch.country).to.equal("New Country")
            expect(updatedBranch.address).to.equal("New Address")
            expect(updatedBranch.name).to.equal(
                `Update Test Branch ${nameCounter}`,
            ) // Unchanged
        })

        it("should update branch contact information", async function () {
            const updateData: BranchUpdate = {
                email: "newemail@branch.com",
                phone: "+9999999999",
            }

            const updatedBranch = await branchService.updateBranch(
                testBranchId,
                updateData,
            )

            expect(updatedBranch.email).to.equal("newemail@branch.com")
            expect(updatedBranch.phone).to.equal("+9999999999")
            expect(updatedBranch.name).to.equal(
                `Update Test Branch ${nameCounter}`,
            ) // Unchanged
        })

        it("should set fields to null when explicitly updated to null", async function () {
            const updateData: BranchUpdate = {
                city: null,
                country: null,
                address: null,
                email: null,
                phone: null,
            }

            const updatedBranch = await branchService.updateBranch(
                testBranchId,
                updateData,
            )

            expect(updatedBranch.city).to.be.null
            expect(updatedBranch.country).to.be.null
            expect(updatedBranch.address).to.be.null
            expect(updatedBranch.email).to.be.null
            expect(updatedBranch.phone).to.be.null
            expect(updatedBranch.name).to.equal(
                `Update Test Branch ${nameCounter}`,
            ) // Unchanged
        })

        it("should throw error when updating to a duplicate name within same company", async function () {
            // Create another branch
            const anotherBranch = await branchService.createBranch({
                name: "Another Branch",
                companyId: companyId,
            })

            const updateData: BranchUpdate = {
                name: "Another Branch",
            }

            try {
                await branchService.updateBranch(testBranchId, updateData)
                expect.fail("Should have thrown an error")
            } catch (error) {
                expect((error as Error).message).to.include(
                    "Branch with this name already exists for this company",
                )
            }
        })

        it("should throw error when updating non-existent branch", async function () {
            const updateData: BranchUpdate = {
                name: "Updated Name",
            }

            try {
                await branchService.updateBranch("non-existent-id", updateData)
                expect.fail("Should have thrown an error")
            } catch (error) {
                expect((error as Error).message).to.include("Branch not found")
            }
        })
    })

    describe("Delete Branch", function () {
        it("should delete a branch when not the last one", async function () {
            // Create two branches
            const branch1 = await branchService.createBranch({
                name: "Branch to Keep",
                companyId: companyId,
            })

            const branch2 = await branchService.createBranch({
                name: "Branch to Delete",
                companyId: companyId,
            })

            // Delete one branch
            await branchService.deleteBranch(branch2.id)

            // Verify it's deleted
            const deletedBranch = await branchService.getBranchById(branch2.id)
            expect(deletedBranch).to.be.null

            // Verify the other branch still exists
            const remainingBranch = await branchService.getBranchById(
                branch1.id,
            )
            expect(remainingBranch).to.not.be.null
        })

        it("should throw error when trying to delete the last branch of a company", async function () {
            // Create a new company with one branch
            const newCompany = await companyService.createCompany({
                name: "Single Branch Company",
            })

            // Get the default "Main" branch created with the company
            const branches = await branchService.getBranchesByCompanyId(
                newCompany.id,
            )
            expect(branches).to.have.length(1)

            try {
                await branchService.deleteBranch(branches[0].id)
                expect.fail("Should have thrown an error")
            } catch (error) {
                expect((error as Error).message).to.include(
                    "Cannot delete the last branch of a company",
                )
            }
        })

        it("should throw error when trying to delete non-existent branch", async function () {
            try {
                await branchService.deleteBranch("non-existent-id")
                expect.fail("Should have thrown an error")
            } catch (error) {
                expect((error as Error).message).to.include("Branch not found")
            }
        })
    })

    describe("Get Branches", function () {
        before(async function () {
            // Create multiple test branches for different companies
            const timestamp = Date.now()

            // Create another company for testing
            const anotherCompany = await companyService.createCompany({
                name: `Another Company ${timestamp}`,
            })

            const branchesData: BranchCreateRequest[] = [
                {
                    name: `North Branch ${timestamp}`,
                    city: "Seattle",
                    country: "USA",
                    companyId: companyId,
                },
                {
                    name: `South Branch ${timestamp}`,
                    city: "Austin",
                    country: "USA",
                    companyId: companyId,
                },
                {
                    name: `East Branch ${timestamp}`,
                    city: "Boston",
                    country: "USA",
                    companyId: anotherCompany.id,
                },
                {
                    name: `West Branch ${timestamp}`,
                    city: "Portland",
                    country: "USA",
                    companyId: anotherCompany.id,
                },
            ]

            for (const branchData of branchesData) {
                await branchService.createBranch(branchData)
            }
        })

        it("should get all branches without filters", async function () {
            const branches = await branchService.getBranches()

            expect(branches).to.be.an("array")
            expect(branches.length).to.be.greaterThan(4) // At least the 4 we created + any from other tests

            // Check that branches have company information
            branches.forEach((branch) => {
                expect(branch.company).to.be.an("object")
                expect(branch.company.name).to.be.a("string")
            })
        })

        it("should get branches with limit", async function () {
            const branches = await branchService.getBranches(2)

            expect(branches).to.be.an("array")
            expect(branches.length).to.equal(2)
        })

        it("should get branches with limit and offset", async function () {
            const firstPage = await branchService.getBranches(2, 0)
            const secondPage = await branchService.getBranches(2, 2)

            expect(firstPage).to.be.an("array")
            expect(secondPage).to.be.an("array")
            expect(firstPage.length).to.equal(2)
            expect(secondPage.length).to.equal(2)

            const firstPageIds = firstPage.map((b) => b.id)
            const secondPageIds = secondPage.map((b) => b.id)
            expect(firstPageIds).to.not.deep.equal(secondPageIds)
        })
    })
})
