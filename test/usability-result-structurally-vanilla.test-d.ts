import { expectTypeOf, test } from "vitest";
import { tupleUnique } from "../src/index";

test("result type is structurally the same as a normal tuple, without extra props, because those could break assignability and mapped types", () => {
    const result = tupleUnique(["foo", "bar"]);
    expectTypeOf(result).toEqualTypeOf<["foo", "bar"]>();
});
