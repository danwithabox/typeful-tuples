import { test } from "vitest";
import { tuple, tupleOf, uniqueTuple, uniqueTupleOf } from "../src/index.js";

test(`unique-tuple-of // TODO: improve test`, () => {
    type Allowed = 1 | 2 | 3;
    // @ts-expect-error invalid
    const output = uniqueTuple([1, 2, 3, 4] satisfies Allowed[]);
    // @ts-expect-error invalid
    const output1 = uniqueTuple([1, 2, 3, 4] as const satisfies Allowed[]);
    // @ts-expect-error invalid
    const outputx = uniqueTuple(tuple([1, 4, 3, 4]) satisfies Allowed[]);
    const outputy = uniqueTuple(tuple([1, 4, 3, 4]));

    // @ts-expect-error invalid
    const out = uniqueTupleOf<Allowed>()([2, 1, 1]);

    const input = tupleOf<Allowed>()([1, 2, 3, 1]);
    // @ts-expect-error invalid
    const output2 = uniqueTuple(input);

    const output3 = uniqueTuple(tupleOf<Allowed>()([1, 2, 3, 1]));
});
