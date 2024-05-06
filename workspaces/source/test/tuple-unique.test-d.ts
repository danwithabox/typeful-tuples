import { expectTypeOf, test } from "vitest";
import { tupleUnique } from "../src/index.js";

test(`tupleUnique() returns the input type unchanged, non-const`, () => {
    {
        const input = [1];
        const output = tupleUnique(input);
        expectTypeOf(output).toEqualTypeOf<typeof input>();
    }
    {
        const output = tupleUnique([1]);
        expectTypeOf(output).toEqualTypeOf<[1]>();
    }
});

test(`tupleUnique() returns the input type unchanged, as const`, () => {
    {
        const input = [1] as const;
        const output = tupleUnique(input);
        expectTypeOf(output).toEqualTypeOf<typeof input>();
    }
    {
        const output = tupleUnique([1] as const);
        expectTypeOf(output).toEqualTypeOf<readonly [1]>();
    }
});

test(`tupleUnique() returns the input type unchanged, mixed values as const`, () => {
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

// TODO: allow NaN and symbols and whatever else such values which are distinct but lack a distinct type, to be used, maybe type-fest alreadt has an util
// describe(`types that require a transformation into an opaque type to produce expected behaviour`, () => {
//     test(`unique symbols work`, () => {
//         const sym1 = Symbol("sym1");
//         const sym2 = Symbol("sym2");
//         const sym3 = Symbol("sym3");

//         const values = tupleUnique([sym1, sym2, sym3]);
//     });

//     test(`NaN can be exempted from uniqueness check manually`, () => {
//         /** Idk what to do about this, there is no `NaN` type it's just `number` so it screws things up */
//         const values_NOPE1 = tupleUnique([0, NaN,                   3, 4, 1, 2]);
//         const values_NOPE2 = tupleUnique([NaN, 0,                        3, 4, 1, 2]); // interestingly, no error
//         const values_YEP_1 = tupleUnique([0, NaN as any as symbol,  3, 4, 1, 2]); // workaround?
//         const values_NOPE4 = tupleUnique([NaN as any as symbol,        NaN as any as symbol]); // nope
//         const values_NOPE5 = tupleUnique([NaN as any as unique symbol, NaN as any as unique symbol]); // 'unique symbol' not allowed

//         const values_MAYBE = tupleUnique([NaN as unknown, NaN as unknown]);
//         // Maybe I should exclude `unknown`? Or turn these into an opaque type? because other things like Number.POSITIVE_INFINITY could be desired too
//     });
// });
