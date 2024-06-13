import { expectTypeOf, test } from "vitest";
import { tupleUnique } from "../src/index";

test(`tupleUnique() returns the input unchanged, non-const literal`, () => {
    const output = tupleUnique([1]);
    expectTypeOf(output).toEqualTypeOf<[1]>();
});

test(`tupleUnique() returns the input unchanged, non-const variable`, () => {
    const input = [1];
    const output = tupleUnique(input);
    expectTypeOf(output).toEqualTypeOf<number[]>();
});

test(`tupleUnique() returns the input unchanged, as const literal`, () => {
    const output = tupleUnique([1] as const);
    expectTypeOf(output).toEqualTypeOf<readonly [1]>();
});

test(`tupleUnique() returns the input unchanged, as const variable`, () => {
    const input = [1] as const;
    const output = tupleUnique(input);
    expectTypeOf(output).toEqualTypeOf<readonly [1]>();
});
