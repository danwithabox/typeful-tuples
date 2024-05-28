import { afterAll, beforeAll, expect, inject } from "vitest";
import { join } from "desm";
import ts from "typescript";
import { createVirtualTs, defineVirtualSourceFiles } from "../utils/ts-vfs/ts-vfs";

const _sourceFiles = defineVirtualSourceFiles([
    { path: `../index.ts`, imports: [`./src/index.js`], },
]);


beforeAll(() => {
    const typescriptAliasExpectedVersion = inject("typescriptAliasExpectedVersion");
    expect(typescriptAliasExpectedVersion).toBe(ts.version);

    globalThis.sourceFiles = _sourceFiles;
    globalThis.virtualTs = createVirtualTs({ projectRootPath: join(import.meta.url, `../`), });

    console.log("globalThis.sourceFiles", typeof globalThis.sourceFiles);
    console.log("globalThis.virtualTs", typeof globalThis.virtualTs);
});

afterAll(() => {
    // @ts-expect-error always available from the tests' perspective
    delete globalThis.sourceFiles;
    // @ts-expect-error always available from the tests' perspective
    delete globalThis.virtualTs;

    console.log("globals removed");
});

declare global {
    /* eslint-disable no-var */
    var sourceFiles: typeof _sourceFiles;
    var virtualTs: ReturnType<typeof createVirtualTs>;
    /* eslint-enable no-var */
}
