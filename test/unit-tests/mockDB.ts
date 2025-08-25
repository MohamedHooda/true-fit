import { PrismockClient } from "prismock"
import { DB } from "../../src/persistence/db"

/**
 * Creates a mock database instance using Prismock for testing
 * This provides an in-memory SQLite database that implements the Prisma interface
 * @returns {DB} A mock database client
 */
function makeMockDB(): DB {
    const mockDB = new PrismockClient()
    return mockDB as DB
}

export default makeMockDB
