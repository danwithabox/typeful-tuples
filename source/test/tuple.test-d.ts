import { expectTypeOf, test } from "vitest";
import { tuple } from "../src/index.js";

test(`tuple() returns the input type unchanged, non-const`, () => {
    {
        const input = [1];
        const output = tuple(input);
        expectTypeOf(output).toEqualTypeOf<typeof input>();
    }
    {
        const output = tuple([1]);
        expectTypeOf(output).toEqualTypeOf<[1]>();
    }
});

test(`tuple() returns the input type unchanged, as const`, () => {
    {
        const input = [1] as const;
        const output = tuple(input);
        expectTypeOf(output).toEqualTypeOf<typeof input>();
    }
    {
        const output = tuple([1] as const);
        expectTypeOf(output).toEqualTypeOf<readonly [1]>();
    }
});

test(`tuple() doesn't have uniqueness check, unlike tupleUnique()`, () => {
    const output = tuple([1, 1, 1, 1]);
    expectTypeOf(output).toEqualTypeOf<[1, 1, 1, 1]>();
});
