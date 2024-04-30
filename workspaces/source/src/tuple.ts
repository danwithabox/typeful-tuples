export type InferConstTuple<T> = T extends readonly [infer H, ...infer Rest] ? [H, ...Rest] : T;

export function tuple<const V, T extends readonly V[]>(values: InferConstTuple<T>) { return values; }

export function tupleOf<const V>() {
    return function <T extends readonly V[]>(values: InferConstTuple<T>) { return values; };
}
