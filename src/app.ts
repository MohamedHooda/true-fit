// IMPORTANT: Make sure to import instrument at the very top
// import "./instrument"

import Fastify, { FastifyInstance } from "fastify"
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox"
import fastifySensible from "@fastify/sensible"
import fastifyMultipart from "@fastify/multipart"
import fastifySwagger from "@fastify/swagger"
import fastifySwaggerUI from "@fastify/swagger-ui"
import fastifyHealthcheck from "fastify-healthcheck"
import fastifyAutoload from "@fastify/autoload"
import fastifyStatic from "@fastify/static"
import fastifyCors from "@fastify/cors"
import { fastifyBasicAuth } from "@fastify/basic-auth"
import * as Sentry from "@sentry/node"
import Ajv from "ajv"
import addFormats from "ajv-formats"
import path from "path"
import connectDB from "./fastify-extensions/connectDB"
import services from "./fastify-extensions/services"
import events from "./fastify-extensions/events"
import { DB } from "./persistence/db"

import NodeCache from "node-cache"

import { DOCS_PREFIX, VERSION_PREFIX } from "./constants"
import {
    getInfoConfig,
    getLogoConfig,
    getThemeConfig,
} from "./helpers/swaggeruiconfig"
import validate from "./auth/swaggerAuth"

/**
 * Build the FastifyInstance
 * @param opts - Options to pass to Fastify
 * @returns {FastifyInstance} - a FastifyInstance
 */
export async function build(
    opts = {},
    db: DB,
    withStartUpTasks = false,
    withShutdownTasks = false,
): Promise<FastifyInstance> {
    const ajv = addFormats(
        new Ajv({
            useDefaults: true,
            coerceTypes: "array",
        }),
        ["uuid", "email", "date-time"],
    )

    const server = Fastify(opts).withTypeProvider<TypeBoxTypeProvider>()

    server.setValidatorCompiler(({ schema }) => {
        return ajv.compile(schema)
    })

    // Set up Sentry error handler
    Sentry.setupFastifyErrorHandler(server)

    server.register(fastifyHealthcheck, { logLevel: "warn" })
    server.register(fastifySwagger, {
        swagger: {
            info: getInfoConfig(),
            securityDefinitions: {
                bearerAuth: {
                    type: "apiKey",
                    name: "authorization",
                    in: "header",
                    description:
                        "Enter JWT Bearer token in format: Bearer <token>",
                },
            },
            security: [
                {
                    bearerAuth: [],
                },
            ],
        },
    })

    server
        .register(fastifyBasicAuth, {
            validate,
            authenticate: true,
        })
        .after(() => {
            server.addHook("onRoute", function hook(routeOptions) {
                if (routeOptions.url.startsWith(DOCS_PREFIX)) {
                    routeOptions.onRequest = server.basicAuth
                }
            })
        })

    server.register(fastifySwaggerUI, {
        uiConfig: {
            docExpansion: "list",
            deepLinking: true,
            oauth2RedirectUrl:
                process.env.BASE_URL ?? `http://localhost:4000/docs`,
        },
        initOAuth: {
            clientId: process.env.COGNITO_CLIENT_ID,
            appName: "True Fit API",
            scopeSeparator: " ",
            scopes: "email openid phone profile",
        },
        transformStaticCSP: (header) => {
            // Prepend the new script-src directive to the existing header
            return "script-src 'self' 'unsafe-eval';" + header
        },
        staticCSP: false,
        routePrefix: DOCS_PREFIX,
        logo: getLogoConfig(),
        theme: getThemeConfig(),
    })
    // Register dependencies
    server.register(connectDB(db))
    server.register(events)
    server.register(services)

    // Register JWT authentication middleware

    server.register(fastifySensible)
    server.register(fastifyMultipart, {
        limits: {
            fileSize: 10 * 1024 * 1024,
        },
    })

    server.decorate(
        "cache",
        new NodeCache({
            stdTTL: 60 * 3,
            checkperiod: 30,
        }),
    )

    server.register(fastifyCors, {
        origin: [
            `http://localhost:${process.env.PORT}`,
            `https://${process.env.DOMAIN}`,
            `http://localhost:3000`,
        ],
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "company-id",
            "accept",
        ],
    })
    server.register(fastifyAutoload, {
        dir: path.join(__dirname, "controllers/routes"),
    })
    server.register(fastifyStatic, {
        root: path.join(__dirname, "public-assets"),
        prefix: `/${VERSION_PREFIX}/public/`,
    })

    return server
}

export default build
