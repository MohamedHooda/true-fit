import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify"

const validate = (
    username: string,
    password: string,
    _req: FastifyRequest,
    _reply: FastifyReply,
    done: HookHandlerDoneFunction,
) => {
    if (
        username === process.env.SWAGGER_USERNAME &&
        password === process.env.SWAGGER_PASSWORD
    ) {
        done()
    } else {
        done(new Error("Unauthorized"))
    }
}

export default validate
