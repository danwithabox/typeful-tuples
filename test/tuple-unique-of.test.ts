import { expect, test } from "vitest";
import { tupleUniqueOf } from "../src/index";

test(`tupleUniqueOf() returns the input value unchanged`, () => {
    const input = [1, 2, 3];
    const output = tupleUniqueOf<(typeof input)[number]>()(input);

    expect(output).toEqual(input);
});
