import { expect, test } from "vitest";
import { tupleUnique } from "../src/index.js";

// /** Idk what to do about this, there is no `NaN` type it's just `number` so it screws things up */
// const values_NOPE1 = uniqueTuple([0, NaN,                   3, 4, 1, 2]);
// const values_NOPE2 = uniqueTuple([NaN, 0,                        3, 4, 1, 2]); // wtf why no error
// const values_YEP_1 = uniqueTuple([0, NaN as any as symbol,  3, 4, 1, 2]); // workaround?
// const values_NOPE4 = uniqueTuple([NaN as any as symbol,        NaN as any as symbol]); // nope
// const values_NOPE5 = uniqueTuple([NaN as any as unique symbol, NaN as any as unique symbol]); // 'unique symbol' not allowed

// const values_MAYBE = uniqueTuple([NaN as unknown, NaN as unknown]);
// Maybe I should exclude `unknown`?

test(`uniqueTuple() returns the input unchanged`, () => {
    const input = [1, 2, 3];
    const output = tupleUnique(input);

    expect(output).toEqual(input);
});
