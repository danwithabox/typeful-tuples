import type { TupleNoInfer } from "./tuple-types";

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

/**
 * TODO: mention this in typeful-tuples documentation as a pattern, AND make a task out of it, to implement "composability" helpers, figure out a minimal use case, explain that direct parameterizing doesn't work
 * TODO: would async version be needed?
 * TODO: pickerCb allows `pickerCb({ pickUniqueOf: _tt_skillsToolbox, })` and pickerCb({ pickUniqueOf: _tt_category, }), returned curried function of `tupleUniqueOf` probably needs to be an opaque type
 */
type PickerCb_tupleUniqueOf<T extends ReturnType<typeof tupleUniqueOf>> = ({ pickUniqueOf, }: { pickUniqueOf: T, }) => (Exclude<ReturnType<T>[number], "">)[];
/**
 * TODO: extract to a test
 */
function sandbox() {
    type Allowed = "foo" | "bar" | "baz";
    const mapAllowed = {
        foo: 1,
        bar: 2,
        baz: 3,
    } satisfies Record<Allowed, number>;

    const _tt_allowed = tupleUniqueOf<Allowed>();
    function usesUniqueParams(
        pickerCb: PickerCb_tupleUniqueOf<typeof _tt_allowed>,
    ): (typeof mapAllowed[Allowed])[] {
        const picked = pickerCb({ pickUniqueOf: _tt_allowed, });
        const ret = picked.map(pick => mapAllowed[pick]);
        return ret;
    }

    // TODO: is it possible to have inferred result values?
    const mapped = usesUniqueParams(({ pickUniqueOf, }) => pickUniqueOf(["foo", "baz"]));
}
