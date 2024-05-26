import { createFSBackedSystem, createVirtualTypeScriptEnvironment, type VirtualTypeScriptEnvironment } from "@typescript/vfs";
import ts from "typescript";
import { join } from "desm";

type LnCol = {
    /** 1-based, just like in the status bar of Visual Studio Code */
    Ln:  number,
    /** 1-based, just like in the status bar of Visual Studio Code */
    Col: number,
};

/**
 * Loosely based on:
 * - https://github.com/microsoft/TypeScript/issues/32916
 * - https://github.com/yunabe/tsapi-completions/blob/master/src/completions.spec.ts
 */
export function createVirtualTs(params: {
    /**
     * Probably best to use an absolute path via `import.meta.url` with `join` from the `desm` pacakge.
     * ```ts
     * const absoluteProjectRoot = join(import.meta.url, `../../`);
     * ```
    */
    projectRootPath: string,
    ts:              typeof import("typescript"),
    rootFiles?:      string[],
}) {
    const { projectRootPath, ts, rootFiles = [], } = params ?? {};

    const configFileName = ts.findConfigFile(
        projectRootPath,
        ts.sys.fileExists,
        "tsconfig.json",
    );
    if (configFileName === void 0) {
        throw new Error(
            `Provided root path does not contain a tsconfig.json file. Please point to a folder with a tsconfig.json file. ` +
            `Provided path: ${projectRootPath}`,
        );
    }

    const compilerOptions = function getCompilerOptions(params: { projectRootPath: string, }): ts.CompilerOptions {
        const { projectRootPath, } = params;

        const configFile = ts.readConfigFile(configFileName, ts.sys.readFile);
        if (!configFile.config) {
            console.warn(`ts.readConfigFile resulted in unusable config somehow, returning default config`);
            return {};
        }
        const compilerOptions = ts.parseJsonConfigFileContent(
            configFile.config,
            ts.sys,
            projectRootPath,
        ).options;
        return compilerOptions;
    }({ projectRootPath, });

    const { vfs, } = (() => {
        const fsFileMap = new Map<string, string>();
        const system = createFSBackedSystem(fsFileMap, projectRootPath, ts);
        const env = createVirtualTypeScriptEnvironment(system, rootFiles, ts, compilerOptions);

        const vfs = {
            fsFileMap,
            env,
        };
        return { vfs, };
    })();

    const { tooling, } = (function createTooling(params: { vfsEnv: VirtualTypeScriptEnvironment, }) {
        const { vfsEnv, } = params;

        const _markers = {
            /**
             * Place this marker character in the returned content at the desired cursor location.
             *
             * The marker character will be removed, its position passed to the `getCompletionsAtPosition` query.
             *
             * The character is deliberately obscure to help avoid conflicts with the given source code.
             *
             * Only the first occurence is handled and removed.
             */
            $c: `ᶜ`,
            /**
             * Place this marker character in the returned content on the desired line, recommended to be put at the end of the line.
             *
             * The marker character will be removed, its line number passed to the `getSemanticDiagnostics` query.
             *
             * The character is deliberately obscure to help avoid conflicts with the given source code.
             *
             * Only the first occurence is handled and removed.
             */
            $l: `ˡ`,
        } as const;
        type _markers = typeof _markers;
        function processMarkerInRawContent(rawContent: string, marker: keyof _markers) {
            const index = rawContent.indexOf(_markers[marker]);
            if (index === -1) return [rawContent, null] as const;
            return [rawContent.replace(_markers[marker], ""), index] as const;
        }
        function upsertSourceFile(fileName: string, content: string) {
            const doesFileExist = vfsEnv.getSourceFile(fileName) !== void 0;
            if (doesFileExist) vfsEnv.updateFile(fileName, content);
            else vfsEnv.createFile(fileName, content);
        }

        function getCompletionsAtPosition<S extends string>(
            fileName: S,
            markedContentFn: ({ $c, }: Pick<_markers, "$c">) => string,
            options?: ts.GetCompletionsAtPositionOptions,
        ) {
            const raw_content = markedContentFn(_markers);

            const [content, position] = processMarkerInRawContent(raw_content, "$c");
            upsertSourceFile(fileName, content);

            const raw_queryResult: ts.WithMetadata<ts.CompletionInfo> | undefined = (() => {
                if (position === null) return;
                const queryResult = vfsEnv.languageService.getCompletionsAtPosition(fileName, position, options);
                return queryResult;
            })();

            const entriesRaw = raw_queryResult?.entries ?? [];
            const entriesNames = entriesRaw.map(({ name, }) => name);

            const queryResult = {
                entriesRaw,
                entriesNames,
                raw: raw_queryResult,
            };

            return {
                fileName,
                content,
                queryResult,
            };
        }

        /**
         * If no line is marked with `$l`, then all semantis issues of the file are returned.
         */
        function getSemanticDiagnostics<S extends string>(
            fileName: S,
            markedContentFn: ({ $l, }: Pick<_markers, "$l">) => string,
        ) {
            const raw_content = markedContentFn(_markers);

            upsertSourceFile(fileName, raw_content);
            const [content, position] = processMarkerInRawContent(raw_content, "$l");
            const targetLine = (() => {
                if (position === null) return null;
                const sourceFile = vfsEnv.getSourceFile(fileName);
                if (sourceFile === void 0) return null;
                const { line, character, } = sourceFile.getLineAndCharacterOfPosition(position);
                return line;
            })();
            upsertSourceFile(fileName, content);

            const raw_queryResult = (() => {
                const diag_semantic = vfsEnv.languageService.getSemanticDiagnostics(fileName);
                const sourceFile = vfsEnv.getSourceFile(fileName);
                if (sourceFile === void 0) throw new Error("getSourceFile didn't return a file");

                const diags: {
                    diag:  ts.Diagnostic,
                    lines: number[],
                    start: LnCol & { position: number, },
                    end:   LnCol & { position: number, },
                }[] = [];
                for (const diag of diag_semantic) {
                    const { start, length, } = diag;

                    if ((start === void 0) || (length === void 0)) continue;

                    const { line: lineStarting, character: characterStarting, } = sourceFile.getLineAndCharacterOfPosition(start);
                    const { line: lineEnding, character: characterEnding, } = sourceFile.getLineAndCharacterOfPosition(start + length);
                    const isTargetLineWithinLineRange = (targetLine === null) || ((lineStarting <= targetLine) && (targetLine <= lineEnding));
                    const lines = new Array((lineEnding - lineStarting) + 1).fill(lineStarting).map((_, i) => _ + i);
                    if (isTargetLineWithinLineRange) diags.push({
                        diag, lines,
                        start: { Ln: lineStarting + 1, Col: characterStarting + 1, position: start, },
                        end:   { Ln: lineEnding, Col: characterEnding + 1, position: start + length, },
                    });
                }
                return diags;
            })();

            const entries = raw_queryResult ?? [];
            const diagnosticsRaw = entries.map(({ diag, }) => diag);
            const diagnostics = entries.map(({ diag, lines, start, end, }) => {
                const { code, messageText, length, } = diag;
                return { code, messageText, start, end, length, lines, };
            });

            const queryResult = {
                diagnosticsRaw,
                diagnostics,
                raw: raw_queryResult,
            };

            return {
                fileName,
                content,
                queryResult,
            };
        }

        /**
         * NOTE: the base path for virtual files is `./vfs`. Therefore, if you want to correctly import files, it's recommended to do this:
         *
         * ```ts
         * runQueryOnVirtualFile("getCompletionsAtPosition", "../myFile.ts", ({ $c, }) => `
         *     import { foo } from "./src/foo.js";
         *     foo()
         * `);
         * ```
         */
        const runQueryOnVirtualFile = {
            getCompletionsAtPosition,
            getSemanticDiagnostics,
        };

        const tooling = {
            runQueryOnVirtualFile,
        };
        return { tooling, };
    })({ vfsEnv: vfs.env, });

    return {
        vfs,
        tooling,
    };
}

async function main() {
    const absoluteProjectRoot = join(import.meta.url, `../../`);

    const {
        vfs,
        tooling: {
            runQueryOnVirtualFile,
        },
    } = createVirtualTs({
        projectRootPath: absoluteProjectRoot,
        ts,
    });


    // const source = env.getSourceFile("index.ts")?.fileName;
    // const source2 = env.getSourceFile("../src/index.ts")?.fileName;

    // console.log("source", source);
    // console.log("source2", source2);
    // console.log("completions", completions);

    /**
     * TODO:
     *  - if possible: on createVirtualTs() init, compile-check that imports are available
     *      - util to run code for errors
     *          - utils: semantic error: code, messageText
     *  - make sure typescript versions are honored in workspaces
     */
    // tupleExhaustiveOf<"foo" | "bar" | "asd">()(["foo", "asd"]);
    {
        const result = runQueryOnVirtualFile.getCompletionsAtPosition("../index.ts", ({ $c, }) => /* ts */`
            import { tupleUniqueOf } from "./src/index.js";
            tupleUniqueOf<"foo" | "bar">()(["foo", "${$c}"]);
        `);

        console.log(result.queryResult.entriesNames);
    }
    {
        const result = runQueryOnVirtualFile.getCompletionsAtPosition("../index.ts", ({ $c, }) => /* ts */`
            import { tupleUniqueOf } from "./src/index.js";
            tupleUniqueOf<"foo" | "bar">()(["bar", "${$c}"]);
            tupleUniqueOf<"foo" | "bar">()(["bar", {

            }]);
        `);

        console.log(result.queryResult.entriesNames);
    }

    {
        const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, }) => /* ts */`
            import { tupleUniqueOf } from "./src/index.js";
            tupleUniqueOf<"foo" | "bar">()(["bxar", {}]);${$l}
            tupleUniqueOf<"foo" | "bar">()(["bar",{

            }]);
        `);

        console.log("semantics 1", result.queryResult.diagnostics);
    }
    {
        const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, }) => /* ts */`
            import { tupleUniqueOf } from "./src/index.js";
            tupleUniqueOf<"foo" | "bar">()(["bar", ""]);
            tupleUniqueOf<"foo" | "bar">()(["bar", {
                ${$l}
            }]);
        `);

        console.log("semantics 2", result.queryResult.diagnostics);
    }
    // TODO: this has a "next" method on its result for some reason
    {
        const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, }) => /* ts */`
            import { tupleExhaustiveOf } from "./src/index.js";
            tupleExhaustiveOf<"foo" | "bar" | "asd">()(["foo", "asd"]);${$l}
        `);

        console.log("semantics 3", result.queryResult.diagnostics);
    }
}
