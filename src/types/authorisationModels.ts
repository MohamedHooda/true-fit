export class Company {
    id?: string

    constructor(id?: string) {
        this.id = id
    }
}

export class Branch {
    id?: string
    companyId?: string

    constructor(id?: string, companyId?: string) {
        this.id = id
        this.companyId = companyId
    }
}
