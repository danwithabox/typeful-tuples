import { expectTypeOf, test } from "vitest";
import { tupleExhaustiveOf } from "../src/index";

type Allowed = "foo" | "bar" | "baz";

test(`tupleExhaustiveOf() returns the input unchanged, non-const literal`, () => {
    const output = tupleExhaustiveOf<Allowed>()(["foo", "bar", "baz"]);
    expectTypeOf(output).toEqualTypeOf<["foo", "bar", "baz"]>();
});

//#region NOTE: this is not an intended use-case, therefore I shouldn't really test it, probably

// test(`tupleExhaustiveOf() returns the input unchanged, non-const variable`, () => {
//     const input: Allowed[] = ["foo"];
//     const output = tupleExhaustiveOf<Allowed>()(input);
//     expectTypeOf(output).toEqualTypeOf<Allowed[]>();
// });

//#endregion

test(`tupleExhaustiveOf() returns the input unchanged, as const literal`, () => {
    const output = tupleExhaustiveOf<Allowed>()(["foo", "bar", "baz"] as const);
    expectTypeOf(output).toEqualTypeOf<readonly ["foo", "bar", "baz"]>();
});

test(`tupleExhaustiveOf() returns the input unchanged, as const variable`, () => {
    const input = ["foo", "bar", "baz"] as const;
    const output = tupleExhaustiveOf<Allowed>()(input);
    expectTypeOf(output).toEqualTypeOf<readonly ["foo", "bar", "baz"]>();
});
