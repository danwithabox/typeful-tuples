import { beforeAll, beforeEach, describe, expect, test } from "vitest";
import { tupleExhaustiveOf } from "../src/index.js";
import { createVirtualTs } from "./ts-vfs/ts-vfs.js";
import { join } from "desm";
import ts from "typescript";

await async function main() {

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
                    ts,
                });
            };

            beforeAll(() => {
                _createVirtualTs();

                const importDiagnostics = virtualTS.tooling.runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, }) => /* ts */`
                    import { tupleExhaustiveOf } from "./src/index.js";${$l}
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
}();
