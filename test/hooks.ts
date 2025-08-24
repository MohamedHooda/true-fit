import dotenv from "dotenv"

export const mochaHooks = (): Mocha.RootHookObject => {
    return {
        beforeAll(done) {
            dotenv.config()
            done()
        },
    }
}
