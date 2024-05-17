import { createDefaultMapFromNodeModules, createFSBackedSystem, createSystem, createVirtualTypeScriptEnvironment } from "@typescript/vfs";
import ts from "typescript";
import { expect } from "vitest";

/**
 * TODO:
 *  - ability to find marker comment in AST (// ^ @ts-query), and cursor location above it, expressed as a position in the source string
 *  - modify `queryResultFn` AST as described below
 *  - run file by importing it from a virtual index.ts file
 */
function queryTypeScriptVFS(
    queryKindSupported: "getCompletionsAtPosition",
    contextFn: () => void,
    queryResultFn: ({ info, }: { info: ts.WithMetadata<ts.CompletionInfo> | undefined, }) => void,
) {
    queryResultFn(void 0 as any); // Parameter will be shadowed when executed with the testing tool
}

queryTypeScriptVFS("getCompletionsAtPosition",
    () => {
        // @ts-expect-error ignore incomplete code
        const arr: "foo"[] = [""];
                            //^ @ts-query
    },
    ({ info, }) => {
        // in the VFS, modify function body AST to include this, shadowing `info`:
        // info = QUERY_RESULT as any;

        const isAutocompleteCorrect: boolean = (
            (info?.entries.some(({ name, }) => name === "foo") ?? false)
            && (info?.entries.some(({ name, }) => name === "bar") ?? false)
        );

        expect(isAutocompleteCorrect).toBeTruthy();
    },
);

/**
 * TODO:
 * - somehow pair existing code with checks
 */

// const fsMap = new Map<string, string>();
const fsMap = createDefaultMapFromNodeModules({ target: ts.ScriptTarget.ESNext, });
fsMap.set(
"index.ts",
`const fn = (value: "foo" | "bar") => {};
fn("");`,
);
const system = createSystem(fsMap);
// createFSBackedSystem()
// const system = ts.sys;

const compilerOpts = {};
const env = createVirtualTypeScriptEnvironment(system, ["index.ts"], ts, compilerOpts);

// You can then interact with the languageService to introspect the code
// const result = env.languageService.getDocumentHighlights("index.ts", 0, ["index.ts"]);
const result = env.languageService.getCompletionsAtPosition("index.ts", fsMap.get("index.ts")!.length - 3, {});
env.getSourceFile("")?.forEachChild(node => node);

console.log(result);
