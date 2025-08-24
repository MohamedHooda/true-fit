declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV?: string
            ENV: "local" | "dev" | "release" | "qa" | "uat" | "prod"
            PORT: number
            DATABASE_URL: string
            SWAGGER_USERNAME: string
            SWAGGER_PASSWORD: string
            JWT_SECRET: string
        }
    }
}

export {}
