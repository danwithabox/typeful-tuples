import { afterAll, beforeAll, expect, inject } from "vitest";
import { join } from "desm";
import ts from "typescript";
import { createVirtualTs, defineVirtualSourceFiles } from "../utils/ts-vfs/ts-vfs";

const _sourceFiles = defineVirtualSourceFiles([
    { path: `../index.ts`, imports: [`./src/index`], },
]);

beforeAll(() => {
    { //#region Setting up globals
        const typescriptAliasExpectedVersion = inject("typescriptAliasExpectedVersion");
        expect(typescriptAliasExpectedVersion).toBe(ts.version);

        globalThis.sourceFiles = _sourceFiles;
        globalThis.virtualTs = createVirtualTs({ projectRootPath: join(import.meta.url, `../../`), });
    } //#endregion

    { //#region Checking that VFS imports work correctly, to avoid falsely passing tests
        const { sourceFiles: sf, virtualTs, } = globalThis;
        const importDiagnostics = virtualTs.tooling.runQueryOnVirtualFile.getSemanticDiagnostics(sf["../index.ts"], ({ $l, $imports, }) => /* ts */`
            import { tupleExhaustiveOf } from "${$imports["./src/index"]}";${$l}
        `);
        expect(importDiagnostics.queryResult.diagnostics).toEqual([]);
    } //#endregion
});

afterAll(() => {
    // @ts-expect-error always available from the tests' perspective
    delete globalThis.sourceFiles;
    // @ts-expect-error always available from the tests' perspective
    delete globalThis.virtualTs;
});

declare global {
    /* eslint-disable no-var */
    var sourceFiles: typeof _sourceFiles;
    var virtualTs: ReturnType<typeof createVirtualTs>;
    /* eslint-enable no-var */
}
