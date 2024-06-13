import { expectTypeOf, test } from "vitest";
import { tuple } from "../src/index";

test(`tuple() returns the input unchanged, non-const literal`, () => {
    const output = tuple([1]);
    expectTypeOf(output).toEqualTypeOf<[1]>();
});

test(`tuple() returns the input unchanged, non-const variable`, () => {
    const input = [1];
    const output = tuple(input);
    expectTypeOf(output).toEqualTypeOf<number[]>();
});

test(`tuple() returns the input unchanged, as const literal`, () => {
    const output = tuple([1] as const);
    expectTypeOf(output).toEqualTypeOf<readonly [1]>();
});

test(`tuple() returns the input unchanged, as const variable`, () => {
    const input = [1] as const;
    const output = tuple(input);
    expectTypeOf(output).toEqualTypeOf<readonly [1]>();
});
