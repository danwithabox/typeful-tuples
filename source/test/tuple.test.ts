import { expect, test } from "vitest";
import { tuple } from "../src/index.js";

test(`tuple() returns the input value unchanged`, () => {
    const input = [1, 2, 3];
    const output = tuple(input);

    expect(output).toEqual(input);
});
