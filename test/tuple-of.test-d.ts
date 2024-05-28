import { expectTypeOf, test } from "vitest";
import { tupleOf } from "../src/index";

type Allowed = "1" | "2" | "3";

test(`tupleUniqueOf() can not accept non-const input`, () => {
    const input = ["1"];
    // @ts-expect-error unacceptable input
    const output = tupleOf<Allowed>()(input);
    // @ts-expect-error invalid
    expectTypeOf(output).toEqualTypeOf<typeof input>();
});

test(`tupleOf() returns the input type unchanged, non-readonly`, () => {
    {
        const output = tupleOf<Allowed>()(["1"]);
        expectTypeOf(output).toEqualTypeOf<["1"]>();
    }
});

test(`tupleOf() returns the input type unchanged, as const`, () => {
    {
        const input = ["1"] as const;
        const output = tupleOf<Allowed>()(input);
        expectTypeOf(output).toEqualTypeOf<typeof input>();
    }
    {
        const output = tupleOf<Allowed>()(["1"] as const);
        expectTypeOf(output).toEqualTypeOf<readonly ["1"]>();
    }
});

test(`tupleOf() doesn't have uniqueness check, unlike tupleUnique() and tupleUniqueOf()`, () => {
    const output = tupleOf<Allowed>()(["1", "1", "1", "1"]);
    expectTypeOf(output).toEqualTypeOf<["1", "1", "1", "1"]>();
});

test(`tupleOf() checks for not allowed elements`, () => {
    const output = tupleOf<Allowed>()([
        "1",
        "2",
        // @ts-expect-error invalid input
        "4",
    ]);
    expectTypeOf(output).toEqualTypeOf<readonly Allowed[]>();

    tupleOf<Allowed>()([
        // @ts-expect-error invalid input
        "4",
        "2",
        "3",
    ]);

    tupleOf<Allowed>()([
        // @ts-expect-error invalid input
        "4",
        "2",
        // @ts-expect-error invalid input
        "4",
    ]);

    tupleOf<Allowed>()([
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
        const output = tupleOf<Allowed>()(input);
    }
});
