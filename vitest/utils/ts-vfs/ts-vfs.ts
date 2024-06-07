import { createFSBackedSystem, createVirtualTypeScriptEnvironment, type VirtualTypeScriptEnvironment } from "@typescript/vfs";
import ts from "typescript";
import { join } from "desm";
import type { Except } from "type-fest";
import pathe from "pathe";
import { defineVirtualSourceFiles, type VirtualFile } from "./virtualized-files";

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
     * The root path to resolve virtual files from. This affects what should be written in `defineVirtualSourceFiles()`.
     *
     * Actual root path will be `./vfs` relative to this path, due to `"@typescript/vfs"` package internals. See JSDoc of `defineVirtualSourceFiles()` for more.
     *
     * Probably best to use an absolute path via `import.meta.url` with `join` from the `desm` pacakge.
     * ```ts
     * const absoluteProjectRoot = join(import.meta.url, `../../`);
     * ```
    */
    projectRootPath:           string,
    /**
     * To ease the discovery of configuration issues with file paths and imports, pointing `projectRootPath` at a folder containing `package.json` is enforced.
     *
     * Sometimes, this enforcement could be unnecessary, set this option to `true` to not check for `package.json`.
     *
     * @default false
     */
    ignoreMissingPackageJson?: boolean,
}) {
    const { projectRootPath: _projectRootPath, ignoreMissingPackageJson = false, } = params ?? {};
    const projectRootPath = pathe.normalize(_projectRootPath);

    const projectRootPackageJson = pathe.join(projectRootPath, `package.json`);
    const fileExists_packageJson = ts.sys.fileExists(projectRootPackageJson);

    if (!ignoreMissingPackageJson) {
        if (!fileExists_packageJson) {
            throw new Error(
                `[createVirtualTs] Could not find "package.json" in the provided root path. Please point to a folder with a "package.json" file, or set "ignoreMissingPackageJson" to "true". ` +
                `Provided path, resolved: "${projectRootPath}"`,
            );
        }
    }

    const tsconfigFilePath = ts.findConfigFile(
        projectRootPath,
        ts.sys.fileExists,
        "tsconfig.json",
    );
    if (tsconfigFilePath === void 0) {
        throw new Error(
            `[createVirtualTs] Could not find a "tsconfig.json" file with "ts.findConfigFile()" starting from the provided root path. Please point to a folder with a discoverable "tsconfig.json" file. ` +
            `Provided path, resolved: "${projectRootPath}"`,
        );
    }

    const compilerOptions = function getCompilerOptions(params: { projectRootPath: string, }): ts.CompilerOptions {
        const { projectRootPath, } = params;

        const configFile = ts.readConfigFile(tsconfigFilePath, ts.sys.readFile);
        if (!configFile.config) {
            console.warn(`[createVirtualTs] ts.readConfigFile resulted in unusable config somehow, returning default config`);
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
        const rootFiles: string[] = [];
        const env = createVirtualTypeScriptEnvironment(system, rootFiles, ts, compilerOptions);

        const vfs = {
            fsFileMap,
            env,
        };
        return { vfs, };
    })();

    const program = vfs.env.languageService.getProgram() ?? void 0;
    if (program === void 0) throw new Error(`[createVirtualTs] getProgram() somehow returned undefined.`);
    const typeChecker = program.getTypeChecker();

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

        function getCompletionsAtPosition<T extends VirtualFile>(
            virtualFile: T,
            markedContentFn: ({ $c, $imports, }: Pick<_markers, "$c"> & { $imports: T["imports"], }) => string,
            options?: ts.GetCompletionsAtPositionOptions,
        ) {
            const { path: fileName, imports: $imports, } = virtualFile;
            const raw_content = markedContentFn({ ..._markers, $imports, });

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
         * If no line is marked with `$l`, then all semantic, issues of the file are returned.
         */
        function getSemanticDiagnostics<T extends VirtualFile>(
            virtualFile: T,
            markedContentFn: ({ $l, $imports, }: Pick<_markers, "$l"> & { $imports: T["imports"], }) => string,
        ) {
            const { path: fileName, imports: $imports, } = virtualFile;
            const raw_content = markedContentFn({ ..._markers, $imports, });

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

            type TsVfs_ToolingResult_SemanticDiagnostic = {
                diag:  ts.Diagnostic,
                lines: number[],
                start: LnCol & { position: number, },
                end:   LnCol & { position: number, },
            };
            type TsVfs_ToolingResult_SemanticDiagnostic_Processed = {
                code:     number,
                messages: TsVfs_ToolingResult_SemanticDiagnostic_Processed_UnwrappedDiagnosticMessageChain[],
                start:    LnCol & { position: number, },
                end:      LnCol & { position: number, },
                length:   number | undefined,
                lines:    number[],
            };
            const raw_queryResult = (() => {
                const diag_semantic = vfsEnv.languageService.getSemanticDiagnostics(fileName);
                const sourceFile = vfsEnv.getSourceFile(fileName);
                if (sourceFile === void 0) throw new Error("getSourceFile didn't return a file");

                const diags: TsVfs_ToolingResult_SemanticDiagnostic[] = [];
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

            const entries = raw_queryResult;
            const diagnosticsRaw = entries.map(({ diag, }) => diag);
            const diagnostics = entries.map(({ diag, lines, start, end, }): TsVfs_ToolingResult_SemanticDiagnostic_Processed => {
                const { category, code, messageText, length, } = diag;
                const unwrappedMessageChain = ((): TsVfs_ToolingResult_SemanticDiagnostic_Processed_UnwrappedDiagnosticMessageChain[] => {
                    if (typeof messageText === "string") return [{ messageText, category, code, }]; // Not sure if this ever runs, but typing suggests it might
                    else return [...unwrapDiagnosticMessageChain(messageText)];
                })();
                return { code, messages: unwrappedMessageChain, start, end, length, lines, };
            });

            const queryResult = {
                diagnosticsRaw,
                diagnostics,
            };

            return {
                fileName,
                content,
                queryResult,
            };
        }

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
        ts,
        tsconfig: {
            tsconfigFilePath,
            compilerOptions,
        },
        vfs,
        program,
        typeChecker,
        tooling,
    } as const;
}

// await main();
async function main() {
    const absoluteProjectRoot = join(import.meta.url, `../../../`);

    const {
        vfs,
        tooling: {
            runQueryOnVirtualFile,
        },
    } = createVirtualTs({
        projectRootPath: absoluteProjectRoot,
    });

    // tupleExhaustiveOf<"foo" | "bar" | "asd">()(["foo", "asd"]);

    const sf = defineVirtualSourceFiles([
        { path: `../index.ts`, imports: [`./src/index.js`], },
        // { path: `../index2.ts`, imports: [`./src/index2.js`, `..src/index3.js`], },
    ]);

    {
        const result = runQueryOnVirtualFile.getCompletionsAtPosition(sf["../index.ts"], ({ $c, $imports, }) => /* ts */`
            import { tupleUniqueOf } from "${$imports["./src/index.js"]}";
            tupleUniqueOf<"foo" | "bar">()(["foo", "${$c}"]);
        `);

        console.log(result.queryResult.entriesNames);
    }
    {
        const result = runQueryOnVirtualFile.getCompletionsAtPosition(sf["../index.ts"], ({ $c, $imports, }) => /* ts */`
            import { tupleUniqueOf } from "${$imports["./src/index.js"]}";
            tupleUniqueOf<"foo" | "bar">()(["bar", "${$c}"]);
            tupleUniqueOf<"foo" | "bar">()(["bar", {

            }]);
        `);

        console.log(result.queryResult.entriesNames);
    }

    {
        const result = runQueryOnVirtualFile.getSemanticDiagnostics(sf["../index.ts"], ({ $l, $imports, }) => /* ts */`
        import { tupleUniqueOf } from "${$imports["./src/index.js"]}";
            tupleUniqueOf<"foo" | "bar">()(["bxar", {}]);${$l}
            tupleUniqueOf<"foo" | "bar">()(["bar",{

            }]);
        `);

        console.log("semantics 1", result.queryResult.diagnostics);
    }
    {
        const result = runQueryOnVirtualFile.getSemanticDiagnostics(sf["../index.ts"], ({ $l, $imports, }) => /* ts */`
            import { tupleUniqueOf } from "${$imports["./src/index.js"]}";
            tupleUniqueOf<"foo" | "bar">()(["bar", ""]);
            tupleUniqueOf<"foo" | "bar">()(["bar", {
                ${$l}
            }]);
        `);

        console.log("semantics 2", result.queryResult.diagnostics);
    }
    {
        const result = runQueryOnVirtualFile.getSemanticDiagnostics(sf["../index.ts"], ({ $l, $imports, }) => /* ts */`
            import { tupleExhaustiveOf } from "${$imports["./src/index.js"]}";
            tupleExhaustiveOf<"foo" | "bar" | "asd">()(["foo", "asd"]);${$l}
        `);

        console.log("semantics 3 raw", result.queryResult.diagnosticsRaw);
        console.log("semantics 3", result.queryResult.diagnostics);
    }
}

export type TsVfs_ToolingResult_SemanticDiagnostic_Processed_UnwrappedDiagnosticMessageChain = Except<ts.DiagnosticMessageChain, "next">;
function* unwrapDiagnosticMessageChain(toUnwrap: ts.DiagnosticMessageChain): Generator<
    TsVfs_ToolingResult_SemanticDiagnostic_Processed_UnwrappedDiagnosticMessageChain,
    void,
    unknown
> {
    let chain: ts.DiagnosticMessageChain[] = [toUnwrap];
    while (chain.length) {
        const _nextChain: ts.DiagnosticMessageChain[] = [];
        for (const diagnostic of chain) {
            _nextChain.push(...(diagnostic.next ?? []));
            delete diagnostic.next;
            yield diagnostic as Except<ts.DiagnosticMessageChain, "next">;
        }
        chain = _nextChain;
    }
}
