export interface Company {
    id: string
    name: string
    description: string | null
    website: string | null
    email: string | null
    phone: string | null
    address: string | null
    createdAt: Date
    updatedAt: Date
}

export interface CompanyWithBranches {
    id: string
    name: string
    description: string | null
    website: string | null
    email: string | null
    phone: string | null
    address: string | null
    createdAt: Date
    updatedAt: Date
    branches: Branch[]
}

export interface CompanyCreate {
    name: string
    description?: string | null
    website?: string | null
    email?: string | null
    phone?: string | null
    address?: string | null
}

export interface CompanyCreateRequest {
    name: string
    description?: string | null
    website?: string | null
    email?: string | null
    phone?: string | null
    address?: string | null
    branches?: BranchCreateRequest[]
}

export interface CompanyCreateResponse {
    id: string
    name: string
    description: string | null
    website: string | null
    email: string | null
    phone: string | null
    address: string | null
    createdAt: Date
    branches: BranchCreateResponse[]
}

export interface CompanyUpdate {
    name?: string
    description?: string | null
    website?: string | null
    email?: string | null
    phone?: string | null
    address?: string | null
}

export interface Branch {
    id: string
    name: string
    city: string | null
    country: string | null
    address: string | null
    email: string | null
    phone: string | null
    createdAt: Date
    updatedAt: Date
    companyId: string
}

export interface BranchWithCompany {
    id: string
    name: string
    city: string | null
    country: string | null
    address: string | null
    email: string | null
    phone: string | null
    createdAt: Date
    updatedAt: Date
    companyId: string
    company: Company
}

export interface BranchCreate {
    name: string
    city?: string | null
    country?: string | null
    address?: string | null
    email?: string | null
    phone?: string | null
    companyId: string
}

export interface BranchCreateRequest {
    name: string
    city?: string | null
    country?: string | null
    address?: string | null
    email?: string | null
    phone?: string | null
    companyId?: string // Optional when creating with company
}

export interface BranchCreateResponse {
    id: string
    name: string
    city: string | null
    country: string | null
    address: string | null
    email: string | null
    phone: string | null
    createdAt: Date
    companyId: string
}

export interface BranchUpdate {
    name?: string
    city?: string | null
    country?: string | null
    address?: string | null
    email?: string | null
    phone?: string | null
}
