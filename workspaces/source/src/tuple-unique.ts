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
            : [TExhaustive] extends [false] ? ([TUnused] | []) : [TUnused]
        // : T extends readonly [infer H] // One element case
        //     ? [H] extends [""]
        //         ? [...Exhaustive<readonly [], Exclude<TUnused, T[number]>, TExhaust>] // TODO: UNSURE why not TUnused
        //         : [H, ...Exhaustive<readonly [], Exclude<TUnused, T[number]>, TExhaust>]
            : T extends readonly [infer H, ...infer Rest] // One, or more than one element case
                ? [H] extends [""]
                    ? [TUnused, ...DepletingTuple<Rest, Exclude<TUnused, T[number]>, TExhaustive>]
                    : [H, ...DepletingTuple<Rest, Exclude<TUnused, T[number]>, TExhaustive>]
                : T
;

export function tupleUnique<const V, T extends readonly V[]>(values: UniqueTuple<T>) { return values; }

export function tupleUniqueOf<const V>() {
    return function <T extends readonly (V | "")[]>(values: UniqueTuple<DepletingTuple<T, V, false>>): T { return values as T; };
}

export function tupleExhaustiveOf<const V>() {
    return function <T extends readonly (V | "")[]>(values: UniqueTuple<DepletingTuple<T, V, true>>): T { return values as T; };
}