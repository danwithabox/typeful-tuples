import { tuple, tupleOf } from "./tuple.js";

type FORWARD_InTuple<T, H> =
    // See if X is the first element in array T
    T extends readonly [H, ...infer _Rest]
        ? true
        // If not, is X the only element in T?
        : T extends readonly [H]
            ? true
            // No match, check if there's any elements left in T and loop recursive
            : T extends readonly [infer _, ...infer Rest]
                ? FORWARD_InTuple<Rest, H>
                // There's nothing left in the array and we found no match
                : false
;

type InTuple<T, H> =
    // See if X is the first element in array T
    T extends readonly [...infer _Rest, H]
        ? true
        // If not, is X the only element in T?
        : T extends readonly [H]
            ? true
            // No match, check if there's any elements left in T and loop recursive
            : T extends readonly [...infer Rest, infer _]
                ? FORWARD_InTuple<Rest, H>
                // There's nothing left in the array and we found no match
                : false
;
type FORWARD_UniqueTuple<T> =
    T extends readonly [infer H, ...infer Rest]
        // We've just extracted X from T, having Rest be the remaining values.
        // Let's see if X is in Rest, and if it is, we know we have a duplicate
        ? FORWARD_InTuple<Rest, H> extends true
            ? readonly [never, ...FORWARD_UniqueTuple<Rest>]
            // X is not duplicated, move on to check the next value, and see
            // if that's also unique.
            : readonly [H, ...FORWARD_UniqueTuple<Rest>]
            // T did not extend [X, ...Rest], so there's nothing to do - just return T
            : T
;
type UniqueTuple<T> =
    T extends readonly [...infer Rest, infer H]
        // We've just extracted X from T, having Rest be the remaining values.
        // Let's see if X is in Rest, and if it is, we know we have a duplicate
        ? InTuple<Rest, H> extends true
            ? readonly [...UniqueTuple<Rest>, never]
            // X is not duplicated, move on to check the next value, and see
            // if that's also unique.
            : readonly [...UniqueTuple<Rest>, H]
            // T did not extend [X, ...Rest], so there's nothing to do - just return T
            : T
;

// TODO: type-only examples and tests

export function uniqueTuple<const V, T extends readonly V[]>(values: UniqueTuple<T>) { return values; }
export function uniqueTupleOf<const V>() {
    return function <T extends readonly V[]>(values: UniqueTuple<T>) { return values; };
}

function sandbox() {
    type Allowed = 1 | 2 | 3;
    const output = uniqueTuple([1, 2, 3, 4] satisfies Allowed[]);
    const output1 = uniqueTuple([1, 2, 3, 4] as const satisfies Allowed[]);
    const outputx = uniqueTuple(tuple([1, 4, 3, 4]) satisfies Allowed[]);
    const outputy = uniqueTuple(tuple([1, 4, 3, 4]));

    const out = uniqueTupleOf<Allowed>()([2, 1, 1]);

    const input = tupleOf<Allowed>()([1, 2, 3, 1]);
    const output2 = uniqueTuple(input);

    const output3 = uniqueTuple(tupleOf<Allowed>()([1, 2, 3, 1]));
}

// TODO: utility for this, `uniqueTupleOf<T>`?
// const values1_YEP2 = uniqueTuple([1, 2, 7, 7, 9] as const satisfies (1 | 2 | 7)[]);
// TODO: also, if so, tupleOf<T>
