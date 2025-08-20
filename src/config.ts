import pino from "pino"
import pretty from "pino-pretty"
import { Logger } from "./types/logging"

///Determine the log level based on the current environment
function logLevel(env: string): string {
    switch (env) {
        case "uat": {
            return "info"
        }
        case "prod": {
            return "error"
        }
        default: {
            return "debug"
        }
    }
}

///Generate the logger options for fastify
export function envToLogger(env: typeof process.env.ENV): Logger {
    switch (env) {
        case "local": {
            const stream = pretty({
                levelFirst: false,
                colorize: env !== "local" ? false : true,
                ignore: "pid,hostname,name",
                singleLine: true,
            })
            return pino(
                {
                    name: "Logger",
                    level: logLevel(env),
                },
                stream,
            )
        }
        default: {
            return pino({
                name: "Logger",
                level: logLevel(env),
                redact: {
                    paths: ["pid", "hostname", "name"],
                    remove: true,
                },
                formatters: {
                    level(label, number) {
                        return { level: label }
                    },
                },
            })
        }
    }
}
