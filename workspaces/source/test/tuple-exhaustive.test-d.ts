import { test } from "vitest";
import { tupleExhaustiveOf, tupleUnique, tupleUniqueOf, type ExhaustiveTuple } from "../src/index.js";

test(`tuple-exhaustive-of // TODO: improve test`, () => {
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

    type res1 = ExhaustiveTuple<["foo"], Keys, never>;
    type resX = ExhaustiveTuple<["foo", ""], Keys, never>;
    type res2 = ExhaustiveTuple<["foo", "bar"], Keys, never>;
    type res3 = ExhaustiveTuple<["foo", "bar", "baz"], Keys, never>;
    type res4 = ExhaustiveTuple<["foo", "bar", "baz", "yay"], Keys, never>;
    type res5 = ExhaustiveTuple<["foo", "bar", "baz", "yay", "nay"], Keys, never>;
});
