import { Type, Static } from "@sinclair/typebox"

export type FilterCondition<T> = {
    equals?: T
    lt?: T
    lte?: T
    gt?: T
    gte?: T
    contains?: T
    not?: T
    // notIn?: T[]
    // in?: T[]
}

export type Filters<T> = {
    [P in keyof T]?: FilterCondition<T[P]>
}

export const FilterQueryParamSchema = Type.Object({
    filter: Type.Optional(Type.RegEx(/(\w+:[^,]+)(?:,(\w+:[^,]+))*/)),
})

export type FilterQueryParam = Static<typeof FilterQueryParamSchema>
