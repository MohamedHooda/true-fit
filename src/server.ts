import dotenv from "dotenv"
dotenv.config()

import { envToLogger } from "./config"

import build from "./app"
import { makeDB } from "persistence/db"

build(
    { logger: envToLogger(process.env.ENV || "development") },
    makeDB(),
    true,
    true,
).then((server) => {
    server.listen(
        { port: process.env.PORT, host: "0.0.0.0" },
        function (err, _address) {
            if (err) {
                server.log.error(err)
                process.exit(1)
            }
        },
    )
})
