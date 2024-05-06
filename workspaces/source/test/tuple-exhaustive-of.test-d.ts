import { expectTypeOf, test } from "vitest";
import { tuple, tupleUnique, tupleOf, tupleUniqueOf, tupleExhaustiveOf, type DepletingTuple } from "../src/index.js";

test(`tupleExhaustiveOf // TODO: improve test`, () => {
    type Keys = "foo" | "bar" | "baz" | "yay" | "nay";

    const curry = tupleExhaustiveOf<Keys>();
    const result = curry(["bar", "foo", "baz", "nay", "yay"]);

    const result2 = tupleExhaustiveOf<Keys>()(["foo", "nay", "yay", "bar", "baz"]);
    const result3 = tupleUniqueOf<Keys>()(["foo", "baz", "yay", "bar"]);
    const result4 = tupleUniqueOf<Keys>()(["bar"]);
    // @ts-expect-error invalid
    const result5 = tupleUniqueOf<Keys>()(["bar", "bar"]);
    const result6 = tupleUnique(["foo"]); // TODO: rename to tupleUnique?

    const docEventMap = tupleUniqueOf<keyof DocumentEventMap>()(["focus", "blur", "abort"]);

    // TODO: first element is anything, fix that
    // TODO: mention, that only maybe UniqueTuple<T> is recommend to be used as a parameter,
    //       everything else should be used as a "source of truth", and then only accept tuples

    type res1 = DepletingTuple<["foo"], Keys, never>;
    type resX = DepletingTuple<["foo", ""], Keys, never>;
    type res2 = DepletingTuple<["foo", "bar"], Keys, never>;
    type res3 = DepletingTuple<["foo", "bar", "baz"], Keys, never>;
    type res4 = DepletingTuple<["foo", "bar", "baz", "yay"], Keys, never>;
    type res5 = DepletingTuple<["foo", "bar", "baz", "yay", "nay"], Keys, never>;
});


type Allowed = "1" | "2" | "3";

test(`tupleExhaustiveOf() cannot accept non-const input`, () => {
    const input = [1];
    // @ts-expect-error unacceptable input
    const output = tupleExhaustiveOf<Allowed>()(input);

    // @ts-expect-error invalid
    expectTypeOf(output).toEqualTypeOf<typeof input>();
});

test(`tupleExhaustiveOf() returns the input type unchanged, as const`, () => {
    {
        const input = ["1", "2", "3"] as const;
        const output = tupleExhaustiveOf<Allowed>()(input);
        expectTypeOf(output).toEqualTypeOf<typeof input>();
    }
    {
        const input = tuple(["1", "2", "3"]);
        const output = tupleExhaustiveOf<Allowed>()(input);
        expectTypeOf(output).toEqualTypeOf<typeof input>();
    }
    {
        const input = tupleOf<Allowed>()(["1", "2", "3"]);
        const output = tupleExhaustiveOf<Allowed>()(input);
        expectTypeOf(output).toEqualTypeOf<typeof input>();
    }
    {
        const output = tupleExhaustiveOf<Allowed>()(["1", "2", "3"]);
        expectTypeOf(output).toEqualTypeOf<["1", "2", "3"]>();
    }

    {
        const curried = tupleExhaustiveOf<Allowed>();
        const output = curried(["1", "2", "3"]);
        expectTypeOf(output).toEqualTypeOf<["1", "2", "3"]>();
    }
    {
        const curried = tupleExhaustiveOf<Allowed>();
        const output = curried(["1", "2", "3"] as const);
        expectTypeOf(output).toEqualTypeOf<readonly ["1", "2", "3"]>();
    }

    {
        const output = tupleExhaustiveOf<Allowed>()(["1", "2", "3"] as const);
        expectTypeOf(output).toEqualTypeOf<readonly ["1", "2", "3"]>();
    }
});

test(`tupleExhaustiveOf() checks for non-unique elements`, () => {
    {
        const input = ["1", "2", "3", "1"] as const;
        // @ts-expect-error invalid input
        const output = tupleExhaustiveOf<Allowed>()(input);
        expectTypeOf(output).toEqualTypeOf<typeof input>();
    }
    {
        const output = tupleExhaustiveOf<Allowed>()([
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
    const output = tupleExhaustiveOf<Allowed>()([
        "1",
        "2",
        // @ts-expect-error invalid input
        "4",
    ]);
    expectTypeOf(output).toEqualTypeOf<readonly ("" | Allowed)[]>();

    tupleExhaustiveOf<Allowed>()([
        // @ts-expect-error invalid input
        "4",
        "2",
        "3",
    ]);

    tupleExhaustiveOf<Allowed>()([
        // @ts-expect-error invalid input
        "4",
        "2",
        // @ts-expect-error invalid input
        "4",
    ]);

    tupleExhaustiveOf<Allowed>()([
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
        const output = tupleExhaustiveOf<Allowed>()(input);
    }
});

// TODO: test for exhaustiveness
