import { PrismaClient } from "@prisma/client"
import { handleDBError } from "helpers/serviceError"
import {
    Company,
    CompanyWithBranches,
    CompanyCreate,
    CompanyCreateResponse,
    CompanyUpdate,
    Branch,
    BranchCreate,
    BranchCreateRequest,
    BranchCreateResponse,
} from "types/company"
import { Logger } from "types/logging"

export interface CompanyPool {
    /**
     * Get a company by ID
     * @param {string} id - The ID of the company to get
     * @returns {Promise<CompanyWithBranches | null>} - The company with branches
     */
    getCompanyById(id: string): Promise<CompanyWithBranches | null>

    /**
     * Get a company by name
     * @param {string} name - The name of the company to get
     * @returns {Promise<Company | null>} - The company
     */
    getCompanyByName(name: string): Promise<Company | null>

    /**
     * Create a company
     * @param {CompanyCreate} company - The company to create
     * @returns {Promise<Company>} - The created company
     */
    createCompany(company: CompanyCreate): Promise<Company>

    /**
     * Create a company with branches
     * @param {CompanyCreate} company - The company to create
     * @param {BranchCreateRequest[]} branches - The branches to create
     * @returns {Promise<CompanyCreateResponse>} - The created company with branches
     */
    createCompanyWithBranches(
        company: CompanyCreate,
        branches: BranchCreateRequest[],
    ): Promise<CompanyCreateResponse>

    /**
     * Delete a company
     * @param {string} id - The ID of the company to delete
     * @returns {Promise<void>}
     */
    deleteCompany(id: string): Promise<void>

    /**
     * Get all companies
     * @param {number} limit - Maximum number of companies to return
     * @param {number} offset - Number of companies to skip
     * @returns {Promise<CompanyWithBranches[]>} - The companies with branches
     */
    getCompanies(
        limit?: number,
        offset?: number,
    ): Promise<CompanyWithBranches[]>

    /**
     * Update a company
     * @param {string} id - The ID of the company to update
     * @param {CompanyUpdate} company - The company data to update
     * @returns {Promise<Company>} - The updated company
     */
    updateCompany(id: string, company: CompanyUpdate): Promise<Company>
}

class CompanyPoolImpl implements CompanyPool {
    constructor(
        private readonly prisma: PrismaClient,
        private readonly logger: Logger,
    ) {}

    async getCompanyById(id: string): Promise<CompanyWithBranches | null> {
        try {
            const company = await this.prisma.company.findUnique({
                where: { id },
                include: {
                    branches: {
                        orderBy: { createdAt: "asc" },
                    },
                },
            })

            return company
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getCompanyByName(name: string): Promise<Company | null> {
        try {
            return this.prisma.company.findUnique({
                where: { name },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async createCompany(company: CompanyCreate): Promise<Company> {
        try {
            return this.prisma.company.create({
                data: company,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async createCompanyWithBranches(
        company: CompanyCreate,
        branches: BranchCreateRequest[],
    ): Promise<CompanyCreateResponse> {
        try {
            // Use transaction to create company and branches together
            const result = await this.prisma.$transaction(async (tx) => {
                // Create the company first
                const createdCompany = await tx.company.create({
                    data: company,
                })

                // Prepare branches data with company ID
                const branchesToCreate = branches.map((branch) => ({
                    ...branch,
                    companyId: createdCompany.id,
                }))

                // Create all branches
                const createdBranches = await Promise.all(
                    branchesToCreate.map((branch) =>
                        tx.branch.create({
                            data: branch,
                        }),
                    ),
                )

                return {
                    ...createdCompany,
                    branches: createdBranches,
                }
            })

            return result
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async deleteCompany(id: string): Promise<void> {
        try {
            await this.prisma.company.delete({
                where: { id },
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async getCompanies(
        limit: number = 50,
        offset: number = 0,
    ): Promise<CompanyWithBranches[]> {
        try {
            return this.prisma.company.findMany({
                include: {
                    branches: {
                        orderBy: { createdAt: "asc" },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: offset,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }

    async updateCompany(id: string, company: CompanyUpdate): Promise<Company> {
        try {
            return this.prisma.company.update({
                where: { id },
                data: company,
            })
        } catch (err) {
            handleDBError(err, this.logger)
        }
    }
}

export default function getCompanyPool(
    prisma: PrismaClient,
    logger: Logger,
): CompanyPool {
    return new CompanyPoolImpl(prisma, logger)
}
