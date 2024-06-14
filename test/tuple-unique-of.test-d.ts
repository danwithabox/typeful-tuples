import { expectTypeOf, test } from "vitest";
import { tupleUniqueOf } from "../src/index";

type Allowed = "foo" | "bar" | "baz";

test(`tupleUniqueOf() returns the input unchanged, non-const literal`, () => {
    const output = tupleUniqueOf<Allowed>()(["foo"]);
    expectTypeOf(output).toEqualTypeOf<["foo"]>();
});

test(`tupleUniqueOf() returns the input unchanged, non-const variable`, () => {
    const input: Allowed[] = ["foo"];
    const output = tupleUniqueOf<Allowed>()(input);
    expectTypeOf(output).toEqualTypeOf<Allowed[]>();
});

test(`tupleUniqueOf() returns the input unchanged, as const literal`, () => {
    const output = tupleUniqueOf<Allowed>()(["foo"] as const);
    expectTypeOf(output).toEqualTypeOf<readonly ["foo"]>();
});

test(`tupleUniqueOf() returns the input unchanged, as const variable`, () => {
    const input = ["foo"] as const;
    const output = tupleUniqueOf<Allowed>()(input);
    expectTypeOf(output).toEqualTypeOf<typeof input>();
});
