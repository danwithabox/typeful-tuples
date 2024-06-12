import { createFSBackedSystem, createVirtualTypeScriptEnvironment, type VirtualTypeScriptEnvironment } from "@typescript/vfs";
import ts from "typescript";
import type { Except } from "type-fest";
import pathe from "pathe";
import type { VirtualFile_Define, VirtualFiles_Transform } from "./virtualized-files";

export const sym_getCompletionsAtPosition_result = Symbol("sym_getCompletionsAtPosition_result");
export function is_TsVfs_ToolingResult_getCompletionsAtPosition(value: any): value is TsVfs_ToolingResult_getCompletionsAtPosition {
    return sym_getCompletionsAtPosition_result in value;
}
export type TsVfs_ToolingResult_getCompletionsAtPosition = {
    [sym_getCompletionsAtPosition_result]: null,

    fileName:    string,
    content:     string,
    queryResult: {
        raw:          ts.WithMetadata<ts.CompletionInfo> | undefined,
        entriesNames: string[],
    },
};

export const sym_getSemanticDiagnostics_result = Symbol("sym_getSemanticDiagnostics_result");
export function is_TsVfs_ToolingResult_getSemanticDiagnostics(value: any): value is TsVfs_ToolingResult_getSemanticDiagnostics {
    return sym_getSemanticDiagnostics_result in value;
}
export type TsVfs_ToolingResult_getSemanticDiagnostics_SemanticDiagnostic = {
    code:     number,
    messages: TsVfs_ToolingResult_getSemanticDiagnostics_SemanticDiagnostic_UnwrappedDiagnosticMessageChain[],
    start:    LnCol & { position: number, },
    end:      LnCol & { position: number, },
    length:   number | undefined,
    lines:    number[],
};
export type TsVfs_ToolingResult_getSemanticDiagnostics = {
    [sym_getSemanticDiagnostics_result]: null,

    fileName:    string,
    content:     string,
    queryResult: {
        raw:         ts.Diagnostic[],
        diagnostics: TsVfs_ToolingResult_getSemanticDiagnostics_SemanticDiagnostic[],
    },
};

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
export function createVirtualTs<const TSourceFiles extends VirtualFiles_Transform<VirtualFile_Define[]>>(params: {
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
    sourceFiles:               TSourceFiles,
    /**
     * To ease the discovery of configuration issues with file paths and imports, pointing `projectRootPath` at a folder containing `package.json` is enforced.
     *
     * Sometimes, this enforcement could be unnecessary, set this option to `true` to not check for `package.json`.
     *
     * @default false
     */
    ignoreMissingPackageJson?: boolean,
}) {
    const { projectRootPath: _projectRootPath, sourceFiles, ignoreMissingPackageJson = false, } = params ?? {};
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

        function getCompletionsAtPosition<K extends keyof TSourceFiles>(
            sourceFileEntry: K,
            markedContentFn: ({ $c, $imports, }: Pick<_markers, "$c"> & { $imports: TSourceFiles[K]["imports"], }) => string,
            options?: ts.GetCompletionsAtPositionOptions,
        ): TsVfs_ToolingResult_getCompletionsAtPosition {
            const sourceFile = sourceFiles[sourceFileEntry];
            const { path: fileName, imports: $imports, } = sourceFile;
            const raw_content = markedContentFn({ ..._markers, $imports, });

            const [content, position] = processMarkerInRawContent(raw_content, "$c");
            upsertSourceFile(fileName, content);

            const raw_queryResult: ts.WithMetadata<ts.CompletionInfo> | undefined = (() => {
                if (position === null) return;
                const queryResult = vfsEnv.languageService.getCompletionsAtPosition(fileName, position, options);
                return queryResult;
            })();

            const entriesNames = (raw_queryResult?.entries ?? []).map(({ name, }) => name);

            const queryResult = {
                raw: raw_queryResult,
                entriesNames,
            };

            return {
                [sym_getCompletionsAtPosition_result]: null,
                fileName,
                content,
                queryResult,
            };
        }

        /**
         * If no line is marked with `$l`, then all semantic issues of the file are returned as an array.
         *
         * Also returns an array, when a line has multiple semantic issues.
         *
         * Multiple semantic issues may also exist in one array entry, but as multiple messages.
         *
         * TODO: (:rework-flatten-processed-diag) could maybe flatten diagnostics and messages, not sure what's the point of having code on the diagnostic level and the diagnostic message level, would rather have duplicate lines and start and pos and etc?
         */
        function getSemanticDiagnostics<K extends keyof TSourceFiles>(
            sourceFileEntry: K,
            markedContentFn: ({ $l, $imports, }: Pick<_markers, "$l"> & { $imports: TSourceFiles[K]["imports"], }) => string,
        ): TsVfs_ToolingResult_getSemanticDiagnostics {
            const sourceFile = sourceFiles[sourceFileEntry];
            const { path: fileName, imports: $imports, } = sourceFile;
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

            const raw_queryResult = vfsEnv.languageService.getSemanticDiagnostics(fileName);
            const sourceFileOf_raw_queryResult = vfsEnv.getSourceFile(fileName);
            if (sourceFileOf_raw_queryResult === void 0) throw new Error(`"getSemanticDiagnostics()" accompanying "getSourceFile()" didn't return a file - this shouldn't happen`);

            const diagnostics = raw_queryResult.flatMap((diag): TsVfs_ToolingResult_getSemanticDiagnostics_SemanticDiagnostic[] => {
                const { category, code, messageText, start, length, } = diag;

                if ((start === void 0) || (length === void 0)) return [];

                const { line: lineStarting, character: characterStarting, } = sourceFileOf_raw_queryResult.getLineAndCharacterOfPosition(start);
                const { line: lineEnding, character: characterEnding, } = sourceFileOf_raw_queryResult.getLineAndCharacterOfPosition(start + length);
                const isTargetLineWithinLineRange = (targetLine === null) || ((lineStarting <= targetLine) && (targetLine <= lineEnding));
                if (!isTargetLineWithinLineRange) return [];

                const lines = new Array((lineEnding - lineStarting) + 1).fill(lineStarting).map((_, i) => _ + i);
                const _start = { Ln: lineStarting + 1, Col: characterStarting + 1, position: start, };
                const _end =   { Ln: lineEnding, Col: characterEnding + 1, position: start + length, };

                const unwrappedMessageChain = ((): TsVfs_ToolingResult_getSemanticDiagnostics_SemanticDiagnostic_UnwrappedDiagnosticMessageChain[] => {
                    if (typeof messageText === "string") return [{ messageText, category, code, }]; // Not sure if this ever runs, but typing suggests it might
                    else return [...unwrapDiagnosticMessageChain(messageText)];
                })();
                return [{ code, messages: unwrappedMessageChain, start: _start, end: _end, length, lines, }];
            });

            const queryResult = {
                raw: raw_queryResult,
                diagnostics,
            };

            return {
                [sym_getSemanticDiagnostics_result]: null,
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

export type TsVfs_ToolingResult_getSemanticDiagnostics_SemanticDiagnostic_UnwrappedDiagnosticMessageChain = Except<ts.DiagnosticMessageChain, "next">;
function* unwrapDiagnosticMessageChain(toUnwrap: ts.DiagnosticMessageChain): Generator<
    TsVfs_ToolingResult_getSemanticDiagnostics_SemanticDiagnostic_UnwrappedDiagnosticMessageChain,
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
