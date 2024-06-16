import { describe, expectTypeOf, test } from "vitest";
import { tuple, tupleExhaustiveOf, tupleOf, tupleUnique, tupleUniqueOf } from "../src/index";

describe(`smoke tests`, () => {
    test("for tuple()", () => {
        const value = tuple([1, "a", true, ["a", "b"], { a: [false, false], }]);
        expectTypeOf(value).toEqualTypeOf<[1, "a", true, readonly ["a", "b"], { readonly a: readonly [false, false], }]>();
    });

    test("for tupleOf()", () => {
        {
            const value = tupleOf<number | string | boolean>()([1, "a", "b", true, false, 2]);
            expectTypeOf(value).toEqualTypeOf<[number, string, string, true, false, number]>();
        }
        {
            const value = tupleOf<number | string | boolean>()([1, "a", "b", true, false, 2] as const);
            expectTypeOf(value).toEqualTypeOf<readonly [1, "a", "b", true, false, 2]>();
        }
        {
            const value = tupleOf<number | string | boolean>()(tuple([1, "a", "b", true, false, 2]));
            expectTypeOf(value).toEqualTypeOf<[1, "a", "b", true, false, 2]>();
        }
        {
            const value = tupleOf<number | string | boolean>()(tuple([1, "a", "b", true, false, 2] as const));
            expectTypeOf(value).toEqualTypeOf<readonly [1, "a", "b", true, false, 2]>();
        }
        {
            const value = tupleOf<boolean | 1 | 2 | "a" | "b">()([1, "a", "b", true, false, 2]);
            expectTypeOf(value).toEqualTypeOf<[1, "a", "b", true, false, 2]>();
        }
        {
            const value = tupleOf<boolean | 1 | 2 | "a" | "b">()([1, "a", "b", true, false, 2] as const);
            expectTypeOf(value).toEqualTypeOf<readonly [1, "a", "b", true, false, 2]>();
        }
    });

    test("for tupleUnique()", () => {
        {
            const value = tupleUnique([1, ["a", "b"], ["a", "x"], { a: [false, true], }, { b: [false, true], }, true, false, 2]);
            expectTypeOf(value).toEqualTypeOf<[1, readonly ["a", "b"], readonly ["a", "x"], { readonly a: readonly [false, true], }, { readonly b: readonly [false, true], }, true, false, 2]>();
        }
        {
            // @ts-expect-error invalid
            const value = tupleUnique([1, ["a", "b"], ["a", "b"], { a: [false, true], },  { a: [false, true], }, true, true,  1]);
        }
    });

    test("for tupleUniqueOf()", () => {
        {
            const value = tupleUniqueOf<number | string | boolean>()([
                1, "a",
                // @ts-expect-error invalid
                "b",
                true, false,
                // @ts-expect-error invalid
                2,
            ]);
        }
        {
            const value = tupleUniqueOf<number | string | boolean>()([1, "a", "b", true, false, 2] as const);
            expectTypeOf(value).toEqualTypeOf<readonly [1, "a", "b", true, false, 2]>();
        }
        {
            const value = tupleUniqueOf<number | string | boolean>()([1, "a",
                // @ts-expect-error invalid
                "a",
                true, false, 2,
            ] as const);
        }
        {
            const value = tupleUniqueOf<number | string | boolean>()(tuple([1, "a", "b", true, false, 2]));
            expectTypeOf(value).toEqualTypeOf<[1, "a", "b", true, false, 2]>();
        }
        {
            const value = tupleUniqueOf<number | string | boolean>()(
                // @ts-expect-error invalid
                tuple([1, "a", "a", true, false, 2]),
            );
        }
        {
            const value = tupleUniqueOf<number | string | boolean>()(tuple([1, "a", "b", true, false, 2] as const));
            expectTypeOf(value).toEqualTypeOf<readonly [1, "a", "b", true, false, 2]>();
        }
        {
            const value = tupleUniqueOf<number | string | boolean>()(
                // @ts-expect-error invalid
                tuple([1, "a", "a", true, false, 2] as const),
            );
        }
        {
            const value = tupleUniqueOf<boolean | 1 | 2 | "a" | "b">()([1, "a", "b", true, false, 2]);
            expectTypeOf(value).toEqualTypeOf<[1, "a", "b", true, false, 2]>();
        }
        {
            const value = tupleUniqueOf<boolean | 1 | 2 | "a" | "b">()([1, "a",
                // @ts-expect-error invalid
                "a",
                true, false, 2,
            ]);
        }
        {
            const value = tupleUniqueOf<boolean | 1 | 2 | "a" | "b">()([1, "a", "b", true, false, 2] as const);
            expectTypeOf(value).toEqualTypeOf<readonly [1, "a", "b", true, false, 2]>();
        }
        {
            const value = tupleUniqueOf<boolean | 1 | 2 | "a" | "b">()([1, "a",
                // @ts-expect-error invalid
                "a",
                true, false, 2,
            ] as const);
        }
    });

    test("for tupleExhaustiveOf()", () => {
        {
            const value = tupleExhaustiveOf<number | string | boolean>()([
                1, "a",
                // @ts-expect-error invalid
                "b",
                true, false,
                // @ts-expect-error invalid
                2,
            ]);
        }
        {
            const value = tupleExhaustiveOf<number | string | boolean>()(
                // @ts-expect-error invalid
                [1, "a", "b", true, false, 2] as const,
            );
        }
        {
            const value = tupleExhaustiveOf<number | string | boolean>()([1, "a",
                // @ts-expect-error invalid
                "a",
                true, false, 2,
            ] as const);
        }
        {
            const value = tupleExhaustiveOf<number | string | boolean>()(
                // @ts-expect-error invalid
                tuple([1, "a", "b", true, false, 2]),
            );
        }
        {
            const value = tupleExhaustiveOf<number | string | boolean>()(
                // @ts-expect-error invalid
                tuple([1, "a", "a", true, false, 2]),
            );
        }
        {
            const value = tupleExhaustiveOf<number | string | boolean>()(
                // @ts-expect-error invalid
                tuple([1, "a", "b", true, false, 2] as const),
            );
        }
        {
            const value = tupleExhaustiveOf<number | string | boolean>()(
                // @ts-expect-error invalid
                tuple([1, "a", "a", true, false, 2] as const),
            );
        }
        {
            const value = tupleExhaustiveOf<boolean | 1 | 2 | "a" | "b">()([1, "a", "b", true, false, 2]);
            expectTypeOf(value).toEqualTypeOf<[1, "a", "b", true, false, 2]>();
        }
        {
            const value = tupleExhaustiveOf<boolean | 1 | 2 | "a" | "b">()([1, "a",
                // @ts-expect-error invalid
                "a",
                true, false, 2,
            ]);
        }
        {
            const value = tupleExhaustiveOf<boolean | 1 | 2 | "a" | "b">()([1, "a", "b", true, false, 2] as const);
            expectTypeOf(value).toEqualTypeOf<readonly [1, "a", "b", true, false, 2]>();
        }
        {
            const value = tupleExhaustiveOf<boolean | 1 | 2 | "a" | "b">()([1, "a",
                // @ts-expect-error invalid
                "a",
                true, false, 2,
            ] as const);
        }
    });
});
