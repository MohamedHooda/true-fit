import {
    FastifyInstance,
    FastifyPluginAsync,
    FastifyPluginOptions,
    FastifyRequest,
} from "fastify"
import fp from "fastify-plugin"
import jwt from "jsonwebtoken"
import { AuthenticatedUser } from "types/user"

/**
 * Verify JWT token and extract user information
 */
async function verifyToken(token: string, fastify: FastifyInstance): Promise<AuthenticatedUser> {
    try {
        // Use the userService to verify token (it handles JWT verification and session validation)
        const userService = fastify.services.getUserService()
        const authenticatedUser = await userService.verifyToken(token)

        return authenticatedUser
    } catch (error) {
        throw new Error("Invalid token")
    }
}

const JWTAuthenticator: FastifyPluginAsync = async (
    fastify: FastifyInstance,
    _options: FastifyPluginOptions,
) => {
    // Decorate request with user property
    fastify.decorateRequest("user", null)

    // Add authentication hook
    fastify.addHook("preHandler", async (request: FastifyRequest, reply) => {
        // Skip authentication for public routes
        if (request.routeConfig?.public) {
            return
        }

        // Get authorization header
        let token = request.headers.authorization
        if (!token) {
            return reply
                .code(401)
                .send({ error: "Missing authorization header" })
        }

        try {
            // Remove Bearer prefix
            token = token.replace("Bearer ", "")
            
            // Verify token and get user
            const user = await verifyToken(token, fastify)
            
            // Attach user to request
            request.user = user

        } catch (err) {
            console.log(err)
            fastify.log.error(err, "Token validation failed")
            return reply
                .code(401)
                .send({ error: "Invalid authorization header" })
        }
    })

    // Helper decorator to require specific roles
    fastify.decorate("requireRole", (allowedRoles: string[]) => {
        return async (request: FastifyRequest, reply: any) => {
            if (!request.user) {
                return reply
                    .code(401)
                    .send({ error: "Authentication required" })
            }

            if (!allowedRoles.includes(request.user.role)) {
                return reply
                    .code(403)
                    .send({ error: "Insufficient permissions" })
            }
        }
    })

    // Helper decorator for authentication check
    fastify.decorate("authenticate", async (request: FastifyRequest, reply: any) => {
        if (!request.user) {
            return reply
                .code(401)
                .send({ error: "Authentication required" })
        }
    })
}

export default fp(JWTAuthenticator, {
    name: "jwt-auth",
    dependencies: ["services"]
})
