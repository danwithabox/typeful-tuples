import type { TupleNoInfer } from "./tuple-types";

export type InferConstTuple<T> = T extends readonly [infer H, ...infer Rest] ? readonly [H, ...Rest] : T;

export function tuple<const V, T extends readonly V[]>(values: InferConstTuple<T>): TupleNoInfer<T> { return values as TupleNoInfer<T>; }

export function tupleOf<const V>() {
    return function <T extends readonly V[]>(values: InferConstTuple<T>): TupleNoInfer<T> { return values as TupleNoInfer<T>; };
}
