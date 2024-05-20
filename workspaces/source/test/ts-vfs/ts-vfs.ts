import { createFSBackedSystem, createVirtualTypeScriptEnvironment, type VirtualTypeScriptEnvironment } from "@typescript/vfs";
import ts from "typescript";
import { join } from "desm";

function createVirtualTs(params: {
    /**
     * Probably best to use an absolute path via `import.meta.url` with `join` from the `desm` pacakge.
     * ```ts
     * const absoluteProjectRoot = join(import.meta.url, `../../`);
     * ```
    */
    projectRootPath: string,
    ts:              typeof ts,
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
            system,
            env,
        };
        return { vfs, };
    })();

    const { tooling, } = (function createTooling(params: { vfsEnv: VirtualTypeScriptEnvironment, }) {
        const { vfsEnv, } = params;

        const _markers = {
            /**
             * Place this marker character in the returned content.
             *
             * The marker character will be removed, its position passed to the `getCompletionsAtPosition` query.
             *
             * The character is deliberately obscure to help avoid conflicts with the given source code.
             *
             * Only the first occurance is handled and removed.
             */
            $ʃ: `ʃ`,
        } as const;
        type _markers = typeof _markers;

        function setFileRunQuery<S extends `${string}.ts`>(
            op: "getCompletionsAtPosition",
            fileName: S,
            markedContentFn: ({ $ʃ, }: Pick<_markers, "$ʃ">) => string,
            options?: ts.GetCompletionsAtPositionOptions,
        ) {
            const raw_content = markedContentFn(_markers);
            const [content, pos] = (() => {
                const index = raw_content.indexOf(_markers.$ʃ);
                if (index === -1) return [raw_content, null];
                return [raw_content.replace(_markers.$ʃ, ""), index];
            })();

            const doesFileExist = vfsEnv.getSourceFile(fileName) !== void 0;
            if (doesFileExist) vfsEnv.updateFile(fileName, content);
            else vfsEnv.createFile(fileName, content);

            const raw_queryResult: ts.WithMetadata<ts.CompletionInfo> | undefined = (() => {
                if (pos === null) return;
                const queryResult = vfsEnv.languageService.getCompletionsAtPosition(fileName, pos, options);
                return queryResult;
            })();

            const entries = raw_queryResult?.entries ?? [];
            const entriesNames = entries.map(({ name, }) => name);

            const queryResult = {
                entries,
                entriesNames,
                raw: raw_queryResult,
            };

            return {
                fileName,
                content,
                queryResult,
            };
        }

        const tooling = {
            setFileRunQuery,
        };
        return { tooling, };
    })({ vfsEnv: vfs.env, });

    return {
        vfs,
        tooling,
    };
}

await async function main() {
    const absoluteProjectRoot = join(import.meta.url, `../../`);

    const {
        vfs,
        tooling: {
            setFileRunQuery: runQueryOnVirtualFile,
        },
    } = createVirtualTs({
        projectRootPath: absoluteProjectRoot,
        ts,
    });

    // env.getSourceFile("index.ts")?.getPositionOfLineAndCharacter
    // const source = env.getSourceFile("index.ts")?.fileName;
    // const source2 = env.getSourceFile("../src/index.ts")?.fileName;

    // console.log("source", source);
    // console.log("source2", source2);
    // console.log("completions", completions);










    /**
     * TODO:
     *  - import paths should be from root folder
     *  - if possible: on createVirtualTs() init, compile-check that imports are available
     *  - make sure typescript versions are honored in workspaces
     */
    {
        const result = runQueryOnVirtualFile("getCompletionsAtPosition", "index.ts", ({ $ʃ, }) => /* ts */`
            import { tupleUniqueOf } from "../src/index.js";
            tupleUniqueOf<"foo" | "bar">()(["foo", "${$ʃ}"]);
        `);

        console.log(result.queryResult.entriesNames);
    }
    {
        const result = runQueryOnVirtualFile("getCompletionsAtPosition", "index.ts", ({ $ʃ, }) => /* ts */`
            import { tupleUniqueOf } from "../src/index.js";
            tupleUniqueOf<"foo" | "bar">()(["bar", "${$ʃ}"]);
        `);

        console.log(result.queryResult.entriesNames);
    }
}();
