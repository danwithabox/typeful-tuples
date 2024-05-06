import { expect, test } from "vitest";
import { tupleUnique } from "../src/index.js";

test(`tupleUnique() returns the input value unchanged`, () => {
    const input = [1, 2, 3];
    const output = tupleUnique(input);

    expect(output).toEqual(input);
});
