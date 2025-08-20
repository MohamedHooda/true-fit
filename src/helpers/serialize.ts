export function serializeBigInt<T = any>(input: any): T {
    
    if (input === null || input === undefined) {
        return input
    }

    if (Array.isArray(input)) {
        return input.map((item) => serializeBigInt<any>(item)) as T
    }

    if (typeof input === "bigint") {
        return Number(input) as unknown as T
    }

    if (typeof input === "object") {
        const returnObject: Record<string, any> = {}
        Object.keys(input).forEach((key) => {
            returnObject[key] = serializeBigInt<any>(input[key])
        })
        return returnObject as T
    }

    return input
}
