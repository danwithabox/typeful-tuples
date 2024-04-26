import { expectTypeOf, test } from "vitest";
import { tuple } from "../src/index.js";

test(`tuple // TODO: improve test`, () => {
    const output = tuple([1, 2, 3, 4]);

    expectTypeOf(output).toEqualTypeOf<1>();
});
