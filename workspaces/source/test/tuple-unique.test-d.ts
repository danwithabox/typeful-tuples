import { expectTypeOf, test } from "vitest";
import { tupleUnique } from "../src/index.js";

test(`uniqueTuple() returns the input unchanged, number[]`, () => {
    const input = [1];
    const output = tupleUnique(input);

    expectTypeOf(output).toEqualTypeOf<typeof input>();
});

test(`uniqueTuple() returns the input unchanged, [number] as const`, () => {
    const input = [1] as const;
    const output = tupleUnique(input);

    expectTypeOf(output).toEqualTypeOf<typeof input>();
});

test(`uniqueTuple() returns the input unchanged, mixed values as const`, () => {
    const input = [1, "2", [3], { a: true, }] as const;
    const output = tupleUnique(input);

    expectTypeOf(output).toEqualTypeOf<typeof input>();
});

test(`unique, indirect non-const argument, is accepted`, () => {
    const input = [1, 2, 3];
    expectTypeOf(input).toEqualTypeOf<number[]>();

    tupleUnique(input);
});
test(`unique, indirect const argument, is accepted`, () => {
    const input = [1, 2, 3] as const;
    expectTypeOf(input).toEqualTypeOf<readonly [1, 2, 3]>();

    tupleUnique(input);
});

test(`direct argument, non-unique, minimal amount of items, last item is not accepted`, () => {
    tupleUnique([
        1,
        // @ts-expect-error middle item of input is deliberately not unique
        1,
    ]);
});

test(`direct argument, non-unique, middle item is not accepted`, () => {
    tupleUnique([
        1,
        // @ts-expect-error middle item of input is deliberately not unique
        1,
        2,
    ]);
});

test(`direct argument, non-unique, last item is not accepted`, () => {
    tupleUnique([
        1,
        2,
        // @ts-expect-error last item of input is deliberately not unique
        1,
    ]);
});

test(`direct argument, non-unique, multiple middle items are not accepted`, () => {
    tupleUnique([
        1,
        // @ts-expect-error first middle item of input is deliberately not unique
        1,
        2,
        // @ts-expect-error second middle item of input is deliberately not unique
        2,
        3,
    ]);
});

test(`direct argument, non-unique, multiple primitive types`, () => {
    const values_correct = tupleUnique([1, 2, "a", "b", true, false]);
    const values_invalid = tupleUnique([
        1,
        // @ts-expect-error not unique
        1,
        "a",
        // @ts-expect-error not unique
        "a",
        true,
        // @ts-expect-error not unique
        true,
    ]);
});

test(`direct argument, non-unique, multiple composite types`, () => {
    const values_correct = tupleUnique([1, 2, ["a"], ["b"], { a: true, }, { b: true, }, { a: false, }]);
    const values_invalid = tupleUnique([
        1,
        // @ts-expect-error not unique
        1,
        ["a"],
        // @ts-expect-error not unique
        ["a"],
        { a: [true, false], },
        { b: true, },
        { a: [false, true], },
        // @ts-expect-error not unique
        { a: [true, false], },
    ]);
});


