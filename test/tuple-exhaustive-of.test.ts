import { beforeAll, describe, expect, test } from "vitest";
import { tupleExhaustiveOf } from "../src/index";
import ts from "typescript";

describe(`tupleExhaustiveOf()`, () => {
    const { sourceFiles: sf, virtualTs, } = globalThis;

    test(`returns the input value unchanged`, () => {
        const input = [1, 2, 3];
        const output = tupleExhaustiveOf<(typeof input)[number]>()(input);

        expect(output).toEqual(input);
    });

    describe(`IDE / language server developer experience`, () => {
        beforeAll(() => {
            const importDiagnostics = virtualTs.tooling.runQueryOnVirtualFile.getSemanticDiagnostics(sf["../index.ts"], ({ $l, $imports, }) => /* ts */`
                import { tupleExhaustiveOf } from "${$imports["./src/index.js"]}";${$l}
            `);
            expect(importDiagnostics.queryResult.diagnostics).toEqual([]);
        });

        test(`autocomplete shows the correct options`, () => {
            console.log("ts version", ts.version);
            console.log("cwd", process.cwd());
        });
    });
});
