import { expectTypeOf, test } from "vitest";
import { tupleUnique } from "../src/index.js";

test("result type is exactly shaped as a tuple, without extra props that could break assignability and mapped types", () => {
    const result = tupleUnique(["foo", "bar"]);
    expectTypeOf(result).toEqualTypeOf<["foo", "bar"]>();
});
