export type InferConstTuple<T> = T extends readonly [infer H, ...infer Rest] ? [H, ...Rest] : T;

export function tuple<const V, T extends readonly V[]>(values: InferConstTuple<T>) { return values; }

export function tupleOf<const V>() {
    return function <T extends readonly V[]>(values: InferConstTuple<T>) { return values; };

}

function sandbox() {
    type Allowed = 1 | 2 | 3;
    const output = tuple([1, 2, 3, 4] as const satisfies Allowed[]);

    const out1 = tupleOf<Allowed>()([2, 1, 4]);
    const out2 = tupleOf<Allowed>()([2, 1, 3]);
}
