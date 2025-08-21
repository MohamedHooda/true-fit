import { PrismaClient } from "@prisma/client"
import { handleDBError } from "helpers/serviceError"
import {
    Branch,
    BranchWithCompany,
    BranchCreate,
    BranchCreateResponse,
    BranchUpdate,
} from "types/company"
import { Logger } from "types/logging"

export interface BranchPool {
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
     * @param {BranchCreate} branch - The branch to create
     * @returns {Promise<BranchCreateResponse>} - The created branch
     */
    createBranch(branch: BranchCreate): Promise<BranchCreateResponse>

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

    /**
     * Check if a branch name exists for a company
     * @param {string} companyId - The company ID
     * @param {string} name - The branch name
     * @param {string} excludeId - Optional branch ID to exclude from check (for updates)
     * @returns {Promise<boolean>} - Whether the branch name exists
     */
    branchNameExistsForCompany(
        companyId: string,
        name: string,
        excludeId?: string,
    ): Promise<boolean>
}

class BranchPoolImpl implements BranchPool {
    constructor(
        private readonly prisma: PrismaClient,
        private readonly logger: Logger,
    ) {}

    async getBranchById(id: string): Promise<BranchWithCompany | null> {
        try {
            const branch = await this.prisma.branch.findUnique({
                where: { id },
                include: {
                    company: true,
                },
            })

            return branch
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getBranchesByCompanyId(companyId: string): Promise<Branch[]> {
        try {
            return this.prisma.branch.findMany({
                where: { companyId },
                orderBy: { createdAt: "asc" },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async createBranch(branch: BranchCreate): Promise<BranchCreateResponse> {
        try {
            const created = await this.prisma.branch.create({
                data: branch,
                select: {
                    id: true,
                    name: true,
                    city: true,
                    country: true,
                    address: true,
                    email: true,
                    phone: true,
                    createdAt: true,
                    companyId: true,
                },
            })

            return created
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async deleteBranch(id: string): Promise<void> {
        try {
            await this.prisma.branch.delete({
                where: { id },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getBranches(
        limit: number = 50,
        offset: number = 0,
    ): Promise<BranchWithCompany[]> {
        try {
            return this.prisma.branch.findMany({
                include: {
                    company: true,
                },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: offset,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async updateBranch(id: string, branch: BranchUpdate): Promise<Branch> {
        try {
            return this.prisma.branch.update({
                where: { id },
                data: branch,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async branchNameExistsForCompany(
        companyId: string,
        name: string,
        excludeId?: string,
    ): Promise<boolean> {
        try {
            const existing = await this.prisma.branch.findFirst({
                where: {
                    companyId,
                    name,
                    ...(excludeId && { id: { not: excludeId } }),
                },
            })

            return !!existing
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }
}

export default function getBranchPool(
    prisma: PrismaClient,
    logger: Logger,
): BranchPool {
    return new BranchPoolImpl(prisma, logger)
}
