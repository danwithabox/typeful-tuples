import { describe, expect, test } from "vitest";
import { tupleExhaustiveOf } from "../src/index";

describe(`tupleExhaustiveOf()`, () => {

    test(`returns the input value unchanged`, () => {
        const input = [1, 2, 3];
        const output = tupleExhaustiveOf<(typeof input)[number]>()(input);

        expect(output).toEqual(input);
    });

    describe(`IDE / language server developer experience`, () => {
        const { sourceFiles: sf, virtualTs, } = globalThis;

        test(`autocomplete shows the correct options`, () => {

        });
    });
});
