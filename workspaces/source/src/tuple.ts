import type { _TupleSimplify } from "./tuple-simplify.js";

export type InferConstTuple<T> = T extends readonly [infer H, ...infer Rest] ? readonly [H, ...Rest] : T;

export function tuple<const V, T extends readonly V[]>(values: InferConstTuple<T>): _TupleSimplify<T> { return values as T; }

export function tupleOf<const V>() {
    return function <T extends readonly V[]>(values: InferConstTuple<T>): _TupleSimplify<T> { return values as T; };
}
