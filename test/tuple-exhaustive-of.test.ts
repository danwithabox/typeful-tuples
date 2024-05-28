import { beforeAll, beforeEach, describe, expect, test } from "vitest";
import { tupleExhaustiveOf } from "../src/index";
import { createVirtualTs, defineVirtualSourceFiles } from "../vitest/utils/ts-vfs/ts-vfs";
import { join } from "desm";
import ts from "typescript";

const sf = defineVirtualSourceFiles([
    { path: `../index.ts`, imports: [`./src/index.js`], },
]);

describe(`tupleExhaustiveOf()`, () => {

    test(`returns the input value unchanged`, () => {
        const input = [1, 2, 3];
        const output = tupleExhaustiveOf<(typeof input)[number]>()(input);

        expect(output).toEqual(input);
    });

    describe(`IDE / language server developer experience`, () => {
        const absoluteProjectRoot = join(import.meta.url, `../`);

        let virtualTS: ReturnType<typeof createVirtualTs>;
        const _createVirtualTs = () => {
            virtualTS = createVirtualTs({
                projectRootPath: absoluteProjectRoot,
            });
        };

        beforeAll(() => {
            _createVirtualTs();

            const importDiagnostics = virtualTS.tooling.runQueryOnVirtualFile.getSemanticDiagnostics(sf["../index.ts"], ({ $l, $imports, }) => /* ts */`
                import { tupleExhaustiveOf } from "${$imports["./src/index.js"]}";${$l}
            `);
            expect(importDiagnostics.queryResult.diagnostics).toEqual([]);
        });
        beforeEach(() => {
            _createVirtualTs();
        });

        test(`autocomplete shows the correct options`, () => {
            console.log("ts version", ts.version);
            console.log("cwd", process.cwd());
        });
    });
});
