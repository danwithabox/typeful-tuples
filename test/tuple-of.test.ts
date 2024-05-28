import { expect, test } from "vitest";
import { tupleOf } from "../src/index";

test(`tupleOf() returns the input value unchanged`, () => {
    const input = [1, 2, 3];
    const output = tupleOf<(typeof input)[number]>()(input);

    expect(output).toEqual(input);
});
