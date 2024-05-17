import type { TupleNoInfer } from "./tuple-types.js";

export type InTuple<T, E> =
    T extends readonly [E] // Present as the only element?
        ? true
        : T extends readonly [...infer Rest, infer Last]
            ? [Last] extends [E] // Present as the last element?
                ? true
                : InTuple<Rest, E> // Recursively check if present as the only or the last element in the rest of tuple `T`.
            : false
;
export type UniqueTuple<T> =
    T extends readonly [...infer Rest, infer H]
        ? InTuple<Rest, H> extends true // Is last element present in the rest of tuple `T`?
            ? readonly [...UniqueTuple<Rest>, never] // If so, mark duplicate element with `never`, and recursively check the rest
            : readonly [...UniqueTuple<Rest>, H] // Else, keep element, and recursively check the rest
        : T // Deliberately not `never`, to make inference of `T` possible in functions
;

export type DepletingTuple<T, TUnused, TExhaustive extends boolean> =
    T extends readonly [] // Empty case
        ? [TUnused] extends [never]
            ? []
            : [TExhaustive] extends [false] ? (readonly [TUnused] | readonly []) : readonly [TUnused]
        : T extends readonly [infer H, ...infer Rest] // One, or more than one element case
            ? [H] extends [""]
                ? readonly [Exclude<TUnused, T[number]>, ...DepletingTuple<Rest, Exclude<TUnused, T[number]>, TExhaustive>]
                : readonly [H, ...DepletingTuple<Rest, Exclude<TUnused, T[number]>, TExhaustive>]
            : T
;

export function tupleUnique<const V, T extends readonly V[]>(values: UniqueTuple<T>): TupleNoInfer<T> { return values as any; }

export function tupleUniqueOf<const V>() {
    return function <T extends readonly (V | "")[]>(values: UniqueTuple<DepletingTuple<T, V, false>>): TupleNoInfer<T> { return values as TupleNoInfer<T>; };
}

export function tupleExhaustiveOf<const V>() {
    return function <T extends readonly (V | "")[]>(values: UniqueTuple<DepletingTuple<T, V, true>>): TupleNoInfer<T> { return values as TupleNoInfer<T>; };
}
