import { expectTypeOf, test } from "vitest";
import { tupleOf } from "../src/index";

type Allowed = "foo" | "bar" | "baz";

test(`tupleOf() returns the input unchanged, non-const literal`, () => {
    const output = tupleOf<Allowed>()(["foo"]);
    expectTypeOf(output).toEqualTypeOf<["foo"]>();
});

test(`tupleOf() returns the input unchanged, as const literal`, () => {
    const output = tupleOf<Allowed>()(["foo"] as const);
    expectTypeOf(output).toEqualTypeOf<readonly ["foo"]>();
});

test(`tupleOf() returns the input unchanged, as const variable`, () => {
    const input = ["foo"] as const;
    const output = tupleOf<Allowed>()(input);
    expectTypeOf(output).toEqualTypeOf<typeof input>();
});
