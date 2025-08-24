import { expect } from "chai"
import pino from "pino"
import { UserRole } from "@prisma/client"

import {
    User,
    UserWithSessions,
    UserCreateRequest,
    UserUpdate,
    LoginRequest,
} from "../../src/types/user"
import { CompanyCreateRequest } from "../../src/types/company"
import getUserService from "../../src/services/users"
import getCompanyService from "../../src/services/companies"
import AwaitableEventRelaying from "../../src/services/events/awaitable"
import makeMockDB from "./mockDB"
import getUserPool from "../../src/persistence/db/pool/users"
import getCompanyPool from "../../src/persistence/db/pool/companies"

describe("UserService CRUD", async function () {
    const logger = pino()
    const events = new AwaitableEventRelaying()
    const db = makeMockDB()
    const userPool = getUserPool(db, logger)
    const companyPool = getCompanyPool(db, logger)
    const userService = getUserService(userPool, events)
    const companyService = getCompanyService(companyPool, events)

    // Mock data setup
    let companyId: string

    before(async function () {
        // Create a test company
        const companyData: CompanyCreateRequest = {
            name: "Test Company for Users",
            description: "A test company for user testing",
            website: "https://test-company-users.com",
        }
        const company = await companyService.createCompany(companyData)
        companyId = company.id

        // Set JWT_SECRET for testing
        process.env.JWT_SECRET = "test-jwt-secret-for-unit-tests"
    })

    describe("Create User", function () {
        it("should create a user with all required fields", async function () {
            const userData: UserCreateRequest = {
                email: "john.doe@example.com",
                firstName: "John",
                lastName: "Doe",
                password: "securePassword123",
                role: UserRole.RECRUITER,
                companyId: companyId,
            }

            const user = await userService.createUser(userData)

            expect(user.email).to.equal("john.doe@example.com")
            expect(user.firstName).to.equal("John")
            expect(user.lastName).to.equal("Doe")
            expect(user.role).to.equal(UserRole.RECRUITER)
            expect(user.companyId).to.equal(companyId)
            expect(user.id).to.be.a("string")
            expect(user.createdAt).to.exist
            // Password should not be returned
            expect((user as any).password).to.be.undefined
            expect((user as any).passwordHash).to.be.undefined
        })

        it("should create a user with minimal required fields", async function () {
            const userData: UserCreateRequest = {
                email: "jane.smith@example.com",
                firstName: "Jane",
                lastName: "Smith",
                password: "password123",
            }

            const user = await userService.createUser(userData)

            expect(user.email).to.equal("jane.smith@example.com")
            expect(user.firstName).to.equal("Jane")
            expect(user.lastName).to.equal("Smith")
            expect(user.role).to.equal(UserRole.RECRUITER) // Default role
            expect(user.companyId).to.be.null
            expect(user.id).to.be.a("string")
            expect(user.createdAt).to.exist
        })

        it("should create an admin user", async function () {
            const userData: UserCreateRequest = {
                email: "admin@example.com",
                firstName: "Admin",
                lastName: "User",
                password: "adminPassword123",
                role: UserRole.ADMIN,
            }

            const user = await userService.createUser(userData)

            expect(user.email).to.equal("admin@example.com")
            expect(user.role).to.equal(UserRole.ADMIN)
            expect(user.companyId).to.be.null
        })
    })

    describe("Get User", function () {
        let testUserId: string
        let testUserEmail: string

        before(async function () {
            const userData: UserCreateRequest = {
                email: "test.retrieval@example.com",
                firstName: "Test",
                lastName: "Retrieval",
                password: "password123",
                role: UserRole.RECRUITER,
                companyId: companyId,
            }
            const user = await userService.createUser(userData)
            testUserId = user.id
            testUserEmail = user.email
        })

        it("should get a user by ID with sessions", async function () {
            const user = await userService.getUserById(testUserId)

            expect(user).to.not.be.null
            expect(user!.id).to.equal(testUserId)
            expect(user!.email).to.equal("test.retrieval@example.com")
            expect(user!.firstName).to.equal("Test")
            expect(user!.lastName).to.equal("Retrieval")
            expect(user!.role).to.equal(UserRole.RECRUITER)
            expect(user!.companyId).to.equal(companyId)
            expect(user!.sessions).to.be.an("array")
        })

        it("should get a user by email", async function () {
            const user = await userService.getUserByEmail(testUserEmail)

            expect(user).to.not.be.null
            expect(user!.id).to.equal(testUserId)
            expect(user!.email).to.equal("test.retrieval@example.com")
            expect(user!.firstName).to.equal("Test")
            expect(user!.lastName).to.equal("Retrieval")
        })

        it("should return null for non-existent user ID", async function () {
            const user = await userService.getUserById("non-existent-id")
            expect(user).to.be.null
        })

        it("should return null for non-existent email", async function () {
            const user = await userService.getUserByEmail(
                "nonexistent@example.com",
            )
            expect(user).to.be.null
        })
    })

    describe("Update User", function () {
        let testUserId: string
        let emailCounter = 0

        beforeEach(async function () {
            emailCounter++
            const userData: UserCreateRequest = {
                email: `update.test${emailCounter}@example.com`,
                firstName: "Original",
                lastName: "Name",
                password: "password123",
                role: UserRole.READONLY,
                companyId: companyId,
            }
            const user = await userService.createUser(userData)
            testUserId = user.id
        })

        it("should update user name", async function () {
            const updateData: UserUpdate = {
                firstName: "Updated",
                lastName: "NewName",
            }

            const updatedUser = await userService.updateUser(
                testUserId,
                updateData,
            )

            expect(updatedUser.firstName).to.equal("Updated")
            expect(updatedUser.lastName).to.equal("NewName")
            expect(updatedUser.email).to.equal(
                `update.test${emailCounter}@example.com`,
            ) // Unchanged
            expect(updatedUser.id).to.equal(testUserId)
        })

        it("should update user email", async function () {
            const updateData: UserUpdate = {
                email: `newemail${emailCounter}@example.com`,
            }

            const updatedUser = await userService.updateUser(
                testUserId,
                updateData,
            )

            expect(updatedUser.email).to.equal(
                `newemail${emailCounter}@example.com`,
            )
            expect(updatedUser.firstName).to.equal("Original") // Unchanged
        })

        it("should update user role", async function () {
            const updateData: UserUpdate = {
                role: UserRole.RECRUITER,
            }

            const updatedUser = await userService.updateUser(
                testUserId,
                updateData,
            )

            expect(updatedUser.role).to.equal(UserRole.RECRUITER)
            expect(updatedUser.firstName).to.equal("Original") // Unchanged
        })

        it("should update user company", async function () {
            // Create another company
            const anotherCompany = await companyService.createCompany({
                name: `Another Company ${emailCounter}`,
            })

            const updateData: UserUpdate = {
                companyId: anotherCompany.id,
            }

            const updatedUser = await userService.updateUser(
                testUserId,
                updateData,
            )

            expect(updatedUser.companyId).to.equal(anotherCompany.id)
            expect(updatedUser.firstName).to.equal("Original") // Unchanged
        })

        it("should set company to null when explicitly updated to null", async function () {
            const updateData: UserUpdate = {
                companyId: null,
            }

            const updatedUser = await userService.updateUser(
                testUserId,
                updateData,
            )

            expect(updatedUser.companyId).to.be.null
            expect(updatedUser.firstName).to.equal("Original") // Unchanged
        })
    })

    describe("Delete User", function () {
        it("should delete a user", async function () {
            // Create a user to delete
            const userData: UserCreateRequest = {
                email: "delete.test@example.com",
                firstName: "Delete",
                lastName: "Test",
                password: "password123",
            }
            const user = await userService.createUser(userData)

            // Delete the user
            await userService.deleteUser(user.id)

            // Verify it's deleted
            const deletedUser = await userService.getUserById(user.id)
            expect(deletedUser).to.be.null
        })
    })

    describe("Get Users", function () {
        before(async function () {
            // Create multiple test users
            const timestamp = Date.now()
            const usersData: UserCreateRequest[] = [
                {
                    email: `alice.developer.${timestamp}@example.com`,
                    firstName: "Alice",
                    lastName: "Developer",
                    password: "password123",
                    role: UserRole.RECRUITER,
                    companyId: companyId,
                },
                {
                    email: `bob.designer.${timestamp}@example.com`,
                    firstName: "Bob",
                    lastName: "Designer",
                    password: "password123",
                    role: UserRole.READONLY,
                },
                {
                    email: `charlie.manager.${timestamp}@example.com`,
                    firstName: "Charlie",
                    lastName: "Manager",
                    password: "password123",
                    role: UserRole.ADMIN,
                },
            ]

            for (const userData of usersData) {
                await userService.createUser(userData)
            }
        })

        it("should get all users", async function () {
            const users = await userService.getUsers()

            expect(users).to.be.an("array")
            expect(users.length).to.be.greaterThan(3) // At least the 3 we created + any from other tests

            // Check that users have sessions array
            users.forEach((user) => {
                expect(user.sessions).to.be.an("array")
            })
        })
    })

    describe("Authentication", function () {
        let testUser: { id: string; email: string; password: string }

        before(async function () {
            const userData: UserCreateRequest = {
                email: "auth.test@example.com",
                firstName: "Auth",
                lastName: "Test",
                password: "securePassword123",
                role: UserRole.RECRUITER,
                companyId: companyId,
            }
            const user = await userService.createUser(userData)
            testUser = {
                id: user.id,
                email: user.email,
                password: "securePassword123",
            }
        })

        it("should login user with valid credentials", async function () {
            const loginData: LoginRequest = {
                email: testUser.email,
                password: testUser.password,
            }

            const loginResponse = await userService.login(
                loginData,
                "test-user-agent",
                "127.0.0.1",
            )

            expect(loginResponse.token).to.be.a("string")
            expect(loginResponse.user).to.be.an("object")
            expect(loginResponse.user.id).to.equal(testUser.id)
            expect(loginResponse.user.email).to.equal(testUser.email)
            expect(loginResponse.user.firstName).to.equal("Auth")
            expect(loginResponse.user.lastName).to.equal("Test")
            expect(loginResponse.user.role).to.equal(UserRole.RECRUITER)
            expect(loginResponse.user.companyId).to.equal(companyId)
        })

        it("should throw error for invalid email", async function () {
            const loginData: LoginRequest = {
                email: "invalid@example.com",
                password: "password123",
            }

            try {
                await userService.login(loginData)
                expect.fail("Should have thrown an error")
            } catch (error) {
                expect((error as Error).message).to.include(
                    "Invalid credentials",
                )
            }
        })

        it("should throw error for invalid password", async function () {
            const loginData: LoginRequest = {
                email: testUser.email,
                password: "wrongPassword",
            }

            try {
                await userService.login(loginData)
                expect.fail("Should have thrown an error")
            } catch (error) {
                expect((error as Error).message).to.include(
                    "Invalid credentials",
                )
            }
        })

        it("should verify valid JWT token", async function () {
            // First login to get a token
            const loginData: LoginRequest = {
                email: testUser.email,
                password: testUser.password,
            }
            const loginResponse = await userService.login(loginData)

            // Then verify the token
            const authenticatedUser = await userService.verifyToken(
                loginResponse.token,
            )

            expect(authenticatedUser.id).to.equal(testUser.id)
            expect(authenticatedUser.email).to.equal(testUser.email)
            expect(authenticatedUser.firstName).to.equal("Auth")
            expect(authenticatedUser.lastName).to.equal("Test")
            expect(authenticatedUser.role).to.equal(UserRole.RECRUITER)
            expect(authenticatedUser.companyId).to.equal(companyId)
            expect(authenticatedUser.sessionId).to.be.a("string")
        })

        it("should throw error for invalid JWT token", async function () {
            try {
                await userService.verifyToken("invalid-jwt-token")
                expect.fail("Should have thrown an error")
            } catch (error) {
                expect((error as Error).message).to.include(
                    "Invalid or expired token",
                )
            }
        })

        it("should logout user (deactivate session)", async function () {
            // First login to get a token and session
            const loginData: LoginRequest = {
                email: testUser.email,
                password: testUser.password,
            }
            const loginResponse = await userService.login(loginData)

            // Verify token works
            const authenticatedUser = await userService.verifyToken(
                loginResponse.token,
            )

            // Logout the session
            await userService.logout(authenticatedUser.sessionId)

            // Try to verify token again - should fail
            try {
                await userService.verifyToken(loginResponse.token)
                expect.fail("Should have thrown an error")
            } catch (error) {
                expect((error as Error).message).to.include(
                    "Invalid or expired",
                )
            }
        })

        it("should logout all sessions for a user", async function () {
            // Create multiple sessions for the user
            const loginData: LoginRequest = {
                email: testUser.email,
                password: testUser.password,
            }

            const session1 = await userService.login(loginData, "agent1", "ip1")
            const session2 = await userService.login(loginData, "agent2", "ip2")

            // Verify both tokens work
            const auth1 = await userService.verifyToken(session1.token)
            const auth2 = await userService.verifyToken(session2.token)

            expect(auth1.sessionId).to.not.equal(auth2.sessionId)

            // Logout all sessions
            await userService.logoutAll(testUser.id)

            // Try to verify both tokens - should fail
            try {
                await userService.verifyToken(session1.token)
                expect.fail("Should have thrown an error")
            } catch (error) {
                expect((error as Error).message).to.include(
                    "Invalid or expired",
                )
            }

            try {
                await userService.verifyToken(session2.token)
                expect.fail("Should have thrown an error")
            } catch (error) {
                expect((error as Error).message).to.include(
                    "Invalid or expired",
                )
            }
        })
    })

    describe("Password Management", function () {
        let testUser: { id: string; email: string; password: string }

        beforeEach(async function () {
            const userData: UserCreateRequest = {
                email: `password.test.${Date.now()}@example.com`,
                firstName: "Password",
                lastName: "Test",
                password: "currentPassword123",
                role: UserRole.RECRUITER,
            }
            const user = await userService.createUser(userData)
            testUser = {
                id: user.id,
                email: user.email,
                password: "currentPassword123",
            }
        })

        it("should change user password with valid current password", async function () {
            // First, get the user to have the password hash available
            const userBefore = await userService.getUserByEmail(testUser.email)
            expect(userBefore).to.not.be.null

            // Change password
            await userService.changePassword(
                testUser.id,
                "currentPassword123",
                "newPassword456",
            )

            // Try to login with old password - should fail
            try {
                await userService.login({
                    email: testUser.email,
                    password: "currentPassword123",
                })
                expect.fail("Should have thrown an error")
            } catch (error) {
                expect((error as Error).message).to.include(
                    "Invalid credentials",
                )
            }

            // Try to login with new password - should work
            const loginResponse = await userService.login({
                email: testUser.email,
                password: "newPassword456",
            })

            expect(loginResponse.token).to.be.a("string")
            expect(loginResponse.user.id).to.equal(testUser.id)
        })

        it("should throw error when changing password with incorrect current password", async function () {
            try {
                await userService.changePassword(
                    testUser.id,
                    "wrongCurrentPassword",
                    "newPassword456",
                )
                expect.fail("Should have thrown an error")
            } catch (error) {
                expect((error as Error).message).to.include(
                    "Current password is incorrect",
                )
            }
        })
    })
})
