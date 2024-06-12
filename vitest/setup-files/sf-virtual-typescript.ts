import { beforeAll, expect, inject } from "vitest";
import { virtualTs } from "../utils/vitest-virtual-typescript";
import "../utils/custom-matchers";

beforeAll(() => {
    { //#region Checking that VFS imports work correctly, to avoid falsely passing tests
        const typescriptAliasExpectedVersion = inject("typescriptAliasExpectedVersion");
        expect(typescriptAliasExpectedVersion).toBe(virtualTs.ts.version);

        const importDiagnostics = virtualTs.tooling.runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, $imports, }) => /* ts */`
            import { tupleExhaustiveOf } from "${$imports["./src/index"]}";${$l}
        `);
        expect(importDiagnostics.queryResult.diagnostics).toEqual([]);
    } //#endregion
});
