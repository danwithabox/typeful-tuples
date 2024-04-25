import { expect, test } from "vitest";
import { tuple } from "../src/index.js";

test(`tuple // TODO: improve test`, () => {
    const output = tuple([1, 2, 3, 4]);

    expect(output).toEqual([1, 2, 3, 4]);
});
