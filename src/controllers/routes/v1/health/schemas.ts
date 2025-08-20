export const HealthCheckSchema = {
    schema: {
        tags: ["Health"],
        summary: "Health check",
        description: "Check if the server is running",
        response: {
            200: {
                type: "object",
                properties: {
                    message: { type: "string" },
                },
            },
        },
    },
}
