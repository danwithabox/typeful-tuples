import { test } from "vitest";
import { tuple, tupleOf, tupleUnique, tupleUniqueOf } from "../src/index.js";

test(`unique-tuple-of // TODO: improve test`, () => {
    type Allowed = 1 | 2 | 3;
    // @ts-expect-error invalid
    const output = tupleUnique([1, 2, 3, 4] satisfies Allowed[]);
    // @ts-expect-error invalid
    const output1 = tupleUnique([1, 2, 3, 4] as const satisfies Allowed[]);
    // @ts-expect-error invalid
    const outputx = tupleUnique(tuple([1, 4, 3, 4]) satisfies Allowed[]);
    const outputy = tupleUnique(tuple([1, 4, 3, 4]));

    // @ts-expect-error invalid
    const out = tupleUniqueOf<Allowed>()([2, 1, 1]);

    const input = tupleOf<Allowed>()([1, 2, 3, 1]);
    // @ts-expect-error invalid
    const output2 = tupleUnique(input);

    const output3 = tupleUnique(tupleOf<Allowed>()([1, 2, 3, 1]));
});
