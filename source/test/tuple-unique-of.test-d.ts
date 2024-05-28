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
    {
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
    }

    {
        const input = ["4", "2", "4"] as const;
        // @ts-expect-error invalid input
        const output = tupleUniqueOf<Allowed>()(input);
    }
});

test(`tupleUniqueOf autocomplete checks`, () => {
    type Keys = "foo" | "bar" | "baz";

    const curried = tupleUniqueOf<Keys>();

    {
        // All options are used up without error, so each element can only be the element itself
        curried(["foo", "bar", "baz"]);
        expectTypeOf(curried<["foo", "bar", "baz"]>).parameter(0).toHaveProperty(0).toEqualTypeOf<"foo">();
        expectTypeOf(curried<["foo", "bar", "baz"]>).parameter(0).toHaveProperty(1).toEqualTypeOf<"bar">();
        expectTypeOf(curried<["foo", "bar", "baz"]>).parameter(0).toHaveProperty(2).toEqualTypeOf<"baz">();
    }

    {
        // @ts-expect-error Bring up autocomplete inside the parameter `""`, the options should be `"bar"` and `"baz"` and `"foo"`
        curried([""]);
        expectTypeOf(curried<[""]>).parameter(0).toHaveProperty(0).toEqualTypeOf<"foo" | "bar" | "baz">();
    }
    {
        // @ts-expect-error Bring up autocomplete inside the parameter `""`, the options should be `"bar"` and `"foo"`
        curried(["baz", ""]);
        expectTypeOf(curried<["baz", ""]>).parameter(0).toHaveProperty(0).toEqualTypeOf<"baz">();
        expectTypeOf(curried<["baz", ""]>).parameter(0).toHaveProperty(1).toEqualTypeOf<"foo" | "bar">();
    }
    {
        // @ts-expect-error Bring up autocomplete inside the parameter `""`, the options should be `"bar"` and `"foo"`
        curried(["", "baz"]);
        expectTypeOf(curried<["", "baz"]>).parameter(0).toHaveProperty(0).toEqualTypeOf<"foo" | "bar">();
        expectTypeOf(curried<["", "baz"]>).parameter(0).toHaveProperty(1).toEqualTypeOf<"baz">();
    }

    {
        // @ts-expect-error Bring up autocomplete inside the parameter `""`, the options should be `"bar"`
        curried(["", "bar", "baz"]);
        expectTypeOf(curried<["", "bar", "baz"]>).parameter(0).toHaveProperty(0).toEqualTypeOf<"foo">();
        expectTypeOf(curried<["", "bar", "baz"]>).parameter(0).toHaveProperty(1).toEqualTypeOf<"bar">();
        expectTypeOf(curried<["", "bar", "baz"]>).parameter(0).toHaveProperty(2).toEqualTypeOf<"baz">();
    }

    {
        // @ts-expect-error Bring up autocomplete inside the parameter `""`, the options should be `"bar"`
        curried(["foo", "", "baz"]);
        expectTypeOf(curried<["foo", "", "baz"]>).parameter(0).toHaveProperty(0).toEqualTypeOf<"foo">();
        expectTypeOf(curried<["foo", "", "baz"]>).parameter(0).toHaveProperty(1).toEqualTypeOf<"bar">();
        expectTypeOf(curried<["foo", "", "baz"]>).parameter(0).toHaveProperty(2).toEqualTypeOf<"baz">();
    }

    {
        // @ts-expect-error Bring up autocomplete inside the parameter `""`, the options should be `"baz"`
        curried(["foo", "bar", ""]);
        expectTypeOf(curried<["foo", "bar", ""]>).parameter(0).toHaveProperty(0).toEqualTypeOf<"foo">();
        expectTypeOf(curried<["foo", "bar", ""]>).parameter(0).toHaveProperty(1).toEqualTypeOf<"bar">();
        expectTypeOf(curried<["foo", "bar", ""]>).parameter(0).toHaveProperty(2).toEqualTypeOf<"baz">();
    }

    {
        // @ts-expect-error Bring up autocomplete inside the parameter `""`, the options should be `"baz"`
        curried(["foo", "bar", "baz", ""]);
        expectTypeOf(curried<["foo", "bar", "baz", ""]>).parameter(0).toHaveProperty(0).toEqualTypeOf<"foo">();
        expectTypeOf(curried<["foo", "bar", "baz", ""]>).parameter(0).toHaveProperty(1).toEqualTypeOf<"bar">();
        expectTypeOf(curried<["foo", "bar", "baz", ""]>).parameter(0).toHaveProperty(2).toEqualTypeOf<"baz">();
        expectTypeOf(curried<["foo", "bar", "baz", ""]>).parameter(0).toHaveProperty(3).toEqualTypeOf<never>();
    }
});
