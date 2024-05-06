import { expect, test } from "vitest";
import { tupleExhaustiveOf } from "../src/index.js";

test(`tupleExhaustiveOf() returns the input value unchanged`, () => {
    const input = [1, 2, 3];
    const output = tupleExhaustiveOf<(typeof input)[number]>()(input);

    expect(output).toEqual(input);
});
