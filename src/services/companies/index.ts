import {
    Company,
    CompanyWithBranches,
    CompanyCreateRequest,
    CompanyCreateResponse,
    CompanyUpdate,
} from "types/company"
import { CompanyPool } from "persistence/db/pool/companies"
import { ITrueFitEventRelaying } from "services/events"

export interface ICompanyService {
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
     * @param {CompanyCreateRequest} company - The company to create
     * @returns {Promise<CompanyCreateResponse>} - The created company
     */
    createCompany(company: CompanyCreateRequest): Promise<CompanyCreateResponse>

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

class CompanyService implements ICompanyService {
    constructor(
        private readonly pool: CompanyPool,
        private readonly events: ITrueFitEventRelaying,
    ) {}

    async getCompanyById(id: string): Promise<CompanyWithBranches | null> {
        return this.pool.getCompanyById(id)
    }

    async getCompanyByName(name: string): Promise<Company | null> {
        return this.pool.getCompanyByName(name)
    }

    async createCompany(
        company: CompanyCreateRequest,
    ): Promise<CompanyCreateResponse> {
        // Validate company name uniqueness
        const existingCompany = await this.pool.getCompanyByName(company.name)
        if (existingCompany) {
            throw new Error("Company with this name already exists")
        }

        // Extract company data and branches
        const { branches = [], ...companyData } = company

        let result: CompanyCreateResponse

        if (branches.length > 0) {
            // Create company with specified branches
            result = await this.pool.createCompanyWithBranches(
                companyData,
                branches,
            )
        } else {
            // Create company with default "Main" branch
            const defaultBranch = {
                name: "Main",
                city: null,
                country: null,
                address: null,
                email: null,
                phone: null,
            }

            result = await this.pool.createCompanyWithBranches(companyData, [
                defaultBranch,
            ])
        }

        // Emit company created event

        // await this.events.dispatchEvent({
        //     type: "COMPANY_CREATED",
        //     payload: {
        //         companyId: result.id,
        //         name: result.name,
        //         branchCount: result.branches.length,
        //     }
        // })

        return result
    }

    async deleteCompany(id: string): Promise<void> {
        // Get company before deletion for event
        const company = await this.pool.getCompanyById(id)

        await this.pool.deleteCompany(id)

        if (company) {
            // Emit company deleted event
            // await this.events.dispatchEvent({
            //     type: "COMPANY_DELETED",
            //     payload: {
            //         companyId: id,
            //         name: company.name,
            //     }
            // })
        }
    }

    async getCompanies(
        limit?: number,
        offset?: number,
    ): Promise<CompanyWithBranches[]> {
        return this.pool.getCompanies(limit, offset)
    }

    async updateCompany(id: string, company: CompanyUpdate): Promise<Company> {
        // Validate company name uniqueness if name is being updated
        if (company.name) {
            const existingCompany = await this.pool.getCompanyByName(
                company.name,
            )
            if (existingCompany && existingCompany.id !== id) {
                throw new Error("Company with this name already exists")
            }
        }

        const updatedCompany = await this.pool.updateCompany(id, company)

        // Emit company updated event

        // await this.events.dispatchEvent({
        //     type: "COMPANY_UPDATED",
        //     payload: {
        //         companyId: id,
        //         changes: company,
        //     }
        // })

        return updatedCompany
    }
}

export default function getCompanyService(
    pool: CompanyPool,
    events: ITrueFitEventRelaying,
): ICompanyService {
    return new CompanyService(pool, events)
}
