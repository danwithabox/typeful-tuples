import type { _InferenceBoxedTuple, _TupleSimplify } from "./tuple-types.js";

export type InferConstTuple<T> = T extends readonly [infer H, ...infer Rest] ? readonly [H, ...Rest] : T;

export function tuple<const V, T extends readonly V[]>(values: InferConstTuple<T>): _TupleSimplify<T> { return values as _TupleSimplify<T>; }
tuple.box = function <const V, T extends readonly V[]>(values: InferConstTuple<T>): _InferenceBoxedTuple<T> { return { unbox: tuple<V, T>(values), }; };

export function tupleOf<const V>() {
    return function <T extends readonly V[]>(values: InferConstTuple<T>): _TupleSimplify<T> { return values as _TupleSimplify<T>; };
}
tupleOf.box = function <const V>() {
    return function <T extends readonly V[]>(values: InferConstTuple<T>): _InferenceBoxedTuple<T> { return { unbox: tupleOf<V>()<T>(values), }; };
};
