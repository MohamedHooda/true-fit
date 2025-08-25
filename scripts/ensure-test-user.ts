#!/usr/bin/env ts-node

import axios from "axios"

// Configuration
const BASE_URL = "http://localhost:4000"
const TEST_USER = {
    email: "user@example.com",
    password: "string",
    firstName: "Test",
    lastName: "User",
    role: "ADMIN" as const,
}

// Create axios instance
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
})

// Check if user exists by trying to login
async function userExists(): Promise<boolean> {
    try {
        console.log(`🔍 Checking if user ${TEST_USER.email} exists...`)

        const response = await api.post("/v1/users/login", {
            email: TEST_USER.email,
            password: TEST_USER.password,
        })

        if (response.data.token) {
            console.log(
                `✅ User ${TEST_USER.email} exists and credentials are valid`,
            )
            return true
        }

        return false
    } catch (error: any) {
        if (error.response?.status === 401) {
            console.log(
                `❌ User ${TEST_USER.email} exists but credentials are invalid`,
            )
            return false
        }

        console.log(`❌ User ${TEST_USER.email} does not exist`)
        return false
    }
}

// Create the test user
async function createTestUser(): Promise<boolean> {
    try {
        console.log(`🔨 Creating test user ${TEST_USER.email}...`)

        const response = await api.post("/v1/users", TEST_USER)

        if (response.data.user) {
            console.log(`✅ Successfully created user ${TEST_USER.email}`)
            console.log(`👤 User ID: ${response.data.user.id}`)
            console.log(`🔑 Role: ${response.data.user.role}`)
            return true
        }

        return false
    } catch (error: any) {
        if (error.response?.status === 409) {
            console.log(`⚠️  User ${TEST_USER.email} already exists`)
            return true
        }

        console.error(
            "❌ Failed to create test user:",
            error.response?.data || error.message,
        )
        return false
    }
}

// Main function
async function ensureTestUser(): Promise<boolean> {
    try {
        console.log("🎯 TrueFit API - Test User Setup")
        console.log("=================================")
        console.log("")

        // Check if user exists and credentials work
        const exists = await userExists()

        if (exists) {
            console.log("✅ Test user is ready!")
            return true
        }

        // Create the user if it doesn't exist
        const created = await createTestUser()

        if (created) {
            // Verify the user can login
            const canLogin = await userExists()
            if (canLogin) {
                console.log("✅ Test user created and verified!")
                return true
            } else {
                console.error("❌ Test user created but cannot login")
                return false
            }
        }

        console.error("❌ Failed to ensure test user exists")
        return false
    } catch (error: any) {
        console.error("❌ Script failed:", error.message)
        return false
    }
}

// Export for use in other scripts
export { ensureTestUser, TEST_USER }

// Run if called directly
if (require.main === module) {
    ensureTestUser().then((success) => {
        process.exit(success ? 0 : 1)
    })
}
