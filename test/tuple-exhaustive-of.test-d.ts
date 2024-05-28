import { expectTypeOf, test } from "vitest";
import { tuple, tupleOf, tupleExhaustiveOf } from "../src/index";

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

test(`tupleExhaustiveOf() checks for not allowed elements`, () => {
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

test(`tupleExhaustiveOf() checks for exhaustiveness`, () => {
    {
        const output = tupleExhaustiveOf<Allowed>()(
            // @ts-expect-error Source has 2 element(s) but target requires 3. ts(2345)
            ["1", "2"],
        );
        expectTypeOf(output).toEqualTypeOf<["1", "2"]>();
    }

    {
        const input = ["1", "2"] as const;
        const output = tupleExhaustiveOf<Allowed>()(
            // @ts-expect-error Source has 2 element(s) but target requires 3. ts(2345)
            input,
        );
        expectTypeOf(output).toEqualTypeOf<readonly ["1", "2"]>();
    }
});

test(`tupleExhaustiveOf autocomplete checks`, () => {
    type Keys = "foo" | "bar" | "baz";

    const curried = tupleExhaustiveOf<Keys>();

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
