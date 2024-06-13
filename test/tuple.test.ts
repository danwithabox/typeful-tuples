import { describe, expect, test } from "vitest";
import { tuple } from "../src/index";
import { virtualTs } from "../vitest/utils/vitest-virtual-typescript";

describe(`tuple()`, () => {
    const { tooling: { runQueryOnVirtualFile, }, } = virtualTs;

    test(`returns the input value unchanged`, () => {
        const input = [1, 2, 3];
        const output = tuple(input);
        expect(output).toEqual(input);
    });

    describe(`developer experience, expected feedback in IDE`, () => {

        describe(`uniqueness checks`, () => {

            test(`diagnostics result, when provided non-unique tuple is \`["foo", "foo"]\`: there is no error, due to deliberately not having a uniqueness check`, () => {
                const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, $imports, }) => /* ts */`
                    import { tuple } from "${$imports["./src/index"]}";

                    tuple(["foo", "foo"]);
                `);

                expect(result).toHaveSemanticDiagnostics([]);
            });

        });

    });
});
