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

export function uniqueTuple<const V, T extends readonly V[]>(values: UniqueTuple<T>) { return values; }
export function uniqueTupleOf<const V>() {
    return function <T extends readonly V[]>(values: UniqueTuple<T>) { return values; };
}

