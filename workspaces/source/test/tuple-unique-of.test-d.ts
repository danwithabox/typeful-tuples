import { expectTypeOf, test } from "vitest";
import { tuple, tupleOf, tupleUniqueOf } from "../src/index.js";

type Allowed = "1" | "2" | "3";

test(`tupleUniqueOf() cannot accept non-const input`, () => {
    const input = [1];
    // @ts-expect-error unacceptable input
    const output = tupleUniqueOf<Allowed>()(input);

    // @ts-expect-error invalid
    expectTypeOf(output).toEqualTypeOf<typeof input>();
});

test(`tupleUniqueOf() returns the input type unchanged, as const`, () => {
    {
        const input = ["1"] as const;
        const output = tupleUniqueOf<Allowed>()(input);
        expectTypeOf(output).toEqualTypeOf<typeof input>();
    }
    {
        const input = tuple(["1"]);
        const output = tupleUniqueOf<Allowed>()(input);
        expectTypeOf(output).toEqualTypeOf<typeof input>();
    }
    {
        const input = tupleOf<Allowed>()(["1"]);
        const output = tupleUniqueOf<Allowed>()(input);
        expectTypeOf(output).toEqualTypeOf<typeof input>();
    }
    {
        const output = tupleUniqueOf<Allowed>()(["1"]);
        expectTypeOf(output).toEqualTypeOf<["1"]>();
    }

    {
        const curried = tupleUniqueOf<Allowed>();
        const output = curried(["1"]);
        expectTypeOf(output).toEqualTypeOf<["1"]>();
    }
    {
        const curried = tupleUniqueOf<Allowed>();
        const output = curried(["1"] as const);
        expectTypeOf(output).toEqualTypeOf<readonly ["1"]>();
    }

    {
        const output = tupleUniqueOf<Allowed>()(["1"] as const);
        expectTypeOf(output).toEqualTypeOf<readonly ["1"]>();
    }
});

test(`tupleUniqueOf() checks for non-unique elements`, () => {
    {
        const input = ["1", "2", "3", "1"] as const;
        // @ts-expect-error invalid input
        const output = tupleUniqueOf<Allowed>()(input);
        expectTypeOf(output).toEqualTypeOf<typeof input>();
    }
    {
        const output = tupleUniqueOf<Allowed>()([
            "1",
            "2",
            "3",
            // @ts-expect-error invalid input
            "1",
        ]);
        expectTypeOf(output).toEqualTypeOf<["1", "2", "3", "1"]>();
    }
});

test(`tupleOf() checks for not allowed elements`, () => {
    const output = tupleUniqueOf<Allowed>()([
        "1",
        "2",
        // @ts-expect-error invalid input
        "4",
    ]);
    expectTypeOf(output).toEqualTypeOf<readonly ("" | Allowed)[]>();

    tupleUniqueOf<Allowed>()([
        // @ts-expect-error invalid input
        "4",
        "2",
        "3",
    ]);

    tupleUniqueOf<Allowed>()([
        // @ts-expect-error invalid input
        "4",
        "2",
        // @ts-expect-error invalid input
        "4",
    ]);

    tupleUniqueOf<Allowed>()([
        // @ts-expect-error invalid input
        "4",
        // @ts-expect-error invalid input
        "4",
        // @ts-expect-error invalid input
        "4",
    ]);

    {
        const input = ["4", "2", "4"] as const;
        // @ts-expect-error invalid input
        const output = tupleUniqueOf<Allowed>()(input);
    }
});
