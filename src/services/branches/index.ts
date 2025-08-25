import {
    Branch,
    BranchWithCompany,
    BranchCreateRequest,
    BranchCreateResponse,
    BranchUpdate,
} from "types/company"
import { BranchPool } from "persistence/db/pool/branches"
import { CompanyPool } from "persistence/db/pool/companies"
import { ITrueFitEventRelaying } from "services/events"

export interface IBranchService {
    /**
     * Get a branch by ID
     * @param {string} id - The ID of the branch to get
     * @returns {Promise<BranchWithCompany | null>} - The branch with company
     */
    getBranchById(id: string): Promise<BranchWithCompany | null>

    /**
     * Get branches by company ID
     * @param {string} companyId - The ID of the company
     * @returns {Promise<Branch[]>} - The branches for the company
     */
    getBranchesByCompanyId(companyId: string): Promise<Branch[]>

    /**
     * Create a branch
     * @param {BranchCreateRequest} branch - The branch to create
     * @returns {Promise<BranchCreateResponse>} - The created branch
     */
    createBranch(branch: BranchCreateRequest): Promise<BranchCreateResponse>

    /**
     * Delete a branch
     * @param {string} id - The ID of the branch to delete
     * @returns {Promise<void>}
     */
    deleteBranch(id: string): Promise<void>

    /**
     * Get all branches
     * @param {number} limit - Maximum number of branches to return
     * @param {number} offset - Number of branches to skip
     * @returns {Promise<BranchWithCompany[]>} - The branches with companies
     */
    getBranches(limit?: number, offset?: number): Promise<BranchWithCompany[]>

    /**
     * Update a branch
     * @param {string} id - The ID of the branch to update
     * @param {BranchUpdate} branch - The branch data to update
     * @returns {Promise<Branch>} - The updated branch
     */
    updateBranch(id: string, branch: BranchUpdate): Promise<Branch>
}

class BranchService implements IBranchService {
    constructor(
        private readonly branchPool: BranchPool,
        private readonly companyPool: CompanyPool,
        private readonly events: ITrueFitEventRelaying,
    ) {}

    async getBranchById(id: string): Promise<BranchWithCompany | null> {
        return this.branchPool.getBranchById(id)
    }

    async getBranchesByCompanyId(companyId: string): Promise<Branch[]> {
        return this.branchPool.getBranchesByCompanyId(companyId)
    }

    async createBranch(
        branch: BranchCreateRequest,
    ): Promise<BranchCreateResponse> {
        if (!branch.companyId) {
            throw new Error("Company ID is required")
        }

        // Validate that the company exists
        const company = await this.companyPool.getCompanyById(branch.companyId)
        if (!company) {
            throw new Error("Company not found")
        }

        // Validate branch name uniqueness within the company
        const nameExists = await this.branchPool.branchNameExistsForCompany(
            branch.companyId,
            branch.name,
        )
        if (nameExists) {
            throw new Error(
                "Branch with this name already exists for this company",
            )
        }

        const branchToCreate = {
            name: branch.name,
            city: branch.city || null,
            country: branch.country || null,
            address: branch.address || null,
            email: branch.email || null,
            phone: branch.phone || null,
            companyId: branch.companyId,
        }

        const createdBranch = await this.branchPool.createBranch(branchToCreate)

        // Emit branch created event

        // await this.events.dispatchEvent({
        //     type: "BRANCH_CREATED",
        //     payload: {
        //         branchId: createdBranch.id,
        //         name: createdBranch.name,
        //         companyId: createdBranch.companyId,
        //     }
        // })

        return createdBranch
    }

    async deleteBranch(id: string): Promise<void> {
        // Get branch before deletion for validation and event
        const branch = await this.branchPool.getBranchById(id)
        if (!branch) {
            throw new Error("Branch not found")
        }

        // Check if this is the last branch for the company
        const companyBranches = await this.branchPool.getBranchesByCompanyId(
            branch.companyId,
        )
        if (companyBranches.length === 1) {
            throw new Error("Cannot delete the last branch of a company")
        }

        await this.branchPool.deleteBranch(id)

        // Emit branch deleted event

        // await this.events.dispatchEvent({
        //     type: "BRANCH_DELETED",
        //     payload: {
        //         branchId: id,
        //         name: branch.name,
        //         companyId: branch.companyId,
        //     }
        // })
    }

    async getBranches(
        limit?: number,
        offset?: number,
    ): Promise<BranchWithCompany[]> {
        return this.branchPool.getBranches(limit, offset)
    }

    async updateBranch(id: string, branch: BranchUpdate): Promise<Branch> {
        // Get existing branch to validate company and current state
        const existingBranch = await this.branchPool.getBranchById(id)
        if (!existingBranch) {
            throw new Error("Branch not found")
        }

        // Validate branch name uniqueness within the company if name is being updated
        if (branch.name) {
            const nameExists = await this.branchPool.branchNameExistsForCompany(
                existingBranch.companyId,
                branch.name,
                id, // Exclude current branch from check
            )
            if (nameExists) {
                throw new Error(
                    "Branch with this name already exists for this company",
                )
            }
        }

        const updatedBranch = await this.branchPool.updateBranch(id, branch)

        // Emit branch updated event

        // await this.events.dispatchEvent({
        //     type: "BRANCH_UPDATED",
        //     payload: {
        //         branchId: id,
        //         companyId: existingBranch.companyId,
        //         changes: branch,
        //     }
        // })

        return updatedBranch
    }
}

export default function getBranchService(
    branchPool: BranchPool,
    companyPool: CompanyPool,
    events: ITrueFitEventRelaying,
): IBranchService {
    return new BranchService(branchPool, companyPool, events)
}
