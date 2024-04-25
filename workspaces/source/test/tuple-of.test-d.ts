import { test } from "vitest";
import { tuple, tupleOf } from "../src/index.js";

test(`tuple-of // TODO: improve test`, () => {
    type Allowed = 1 | 2 | 3;
    // @ts-expect-error invalid
    const output = tuple([1, 2, 3, 4] as const satisfies Allowed[]);

    // @ts-expect-error invalid
    const out1 = tupleOf<Allowed>()([2, 1, 4]);
    const out2 = tupleOf<Allowed>()([2, 1, 3]);
});
