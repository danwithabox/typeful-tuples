import { uniqueTuple } from "../src/index.js";
import { expect, test } from "vitest";

// /** Idk what the fuck to do about this, there is no `NaN` type it's just `number` so it fucks things up */
// const valuesFUCK_NOPE1 = uniqueTuple([0, NaN,                   3, 4, 1, 2]);
// const valuesFUCK_NOPE2 = uniqueTuple([0,                        3, 4, 1, 2, NaN]); // wtf why no error
// const valuesFUCK_NOPEX = uniqueTuple([NaN, 0,                        3, 4, 1, 2]); // wtf why no error
// const valuesFUCK_NOPE3 = uniqueTuple([0,                        3, 4, 1, 100, 100]); // whew it's not a general tail issue
// const valuesFUCK_YEP_1 = uniqueTuple([0, NaN as any as symbol,  3, 4, 1, 2]); // workaround?
// const valuesFUCK_NOPE4 = uniqueTuple([NaN as any as symbol,        NaN as any as symbol]); // nope
// const valuesFUCK_NOPE5 = uniqueTuple([NaN as any as unique symbol, NaN as any as unique symbol]); // 'unique symbol' not allowed

// const valuesFUCK_MAYBE = uniqueTuple([NaN as unknown, NaN as unknown]); // Maybe I should exclude `unknown`?

test(`uniqueTuple() returns the input unchanged`, () => {
    const input = [1, 2, 3];
    const output = uniqueTuple(input);

    expect(output).toEqual(input);
});
