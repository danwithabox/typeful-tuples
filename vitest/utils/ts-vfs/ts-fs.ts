import pathe from "pathe";
import ts from "typescript";

export function createTs(params: {
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
    const consoleLogPrefix = `[createTs]`;

    const { projectRootPath: _projectRootPath, ignoreMissingPackageJson = false, } = params ?? {};
    const projectRootPath = pathe.normalize(_projectRootPath);
    if (!pathe.isAbsolute(projectRootPath)) throw new Error(
        `${consoleLogPrefix} projectRootPath should be an absolute path after normalization. Instead it was ${projectRootPath}`,
    );

    const projectRootPackageJson = pathe.join(projectRootPath, `package.json`);
    const fileExists_packageJson = ts.sys.fileExists(projectRootPackageJson);

    if (!ignoreMissingPackageJson) {
        if (!fileExists_packageJson) {
            throw new Error(
                `${consoleLogPrefix} Could not find "package.json" in the provided root path. Please point to a folder with a "package.json" file, or set "ignoreMissingPackageJson" to "true". ` +
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
            `${consoleLogPrefix} Could not find a "tsconfig.json" file with "ts.findConfigFile()" starting from the provided root path. Please point to a folder with a discoverable "tsconfig.json" file. ` +
            `Provided path, resolved: "${projectRootPath}"`,
        );
    }

    const compilerOptions = function getCompilerOptions(params: { projectRootPath: string, }): ts.CompilerOptions {
        const { projectRootPath, } = params;

        const configFile = ts.readConfigFile(tsconfigFilePath, ts.sys.readFile);
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

    const { host, program, typeChecker, languageService, } = (() => {
        const rootFileNames: string[] = [];
        const host = ts.createCompilerHost(compilerOptions, /* setParentNodes */ true);
        const program = ts.createProgram({ host, options: compilerOptions, rootNames: rootFileNames, });
        const typeChecker = program.getTypeChecker();

        const files: ts.MapLike<{ version: number, }> = {};
        rootFileNames.forEach(fileName => {
            files[fileName] = { version: 0, };
        });
        const _languageServiceHost: ts.LanguageServiceHost = {
            getScriptFileNames: () => rootFileNames,
            getScriptVersion:   fileName => files[fileName].version.toString(),
            getScriptSnapshot:  fileName => {
                const file = ts.sys.readFile(fileName);
                if (!file) return void 0;
                return ts.ScriptSnapshot.fromString(file.toString());
            },
            getCurrentDirectory:    () => process.cwd(), // TODO: what does this control? can I swap this for the projectRootPath?
            // getCurrentDirectory:    () => projectRootPath,
            getCompilationSettings: () => compilerOptions,
            getDefaultLibFileName:  options => ts.getDefaultLibFilePath(options),
            fileExists:             ts.sys.fileExists,
            readFile:               ts.sys.readFile,
            readDirectory:          ts.sys.readDirectory,
            directoryExists:        ts.sys.directoryExists,
            getDirectories:         ts.sys.getDirectories,
        };

        const languageService = ts.createLanguageService(_languageServiceHost, ts.createDocumentRegistry());

        return { host, program, typeChecker, languageService, };
    })();

    return {
        tsconfigFilePath,
        host,
        program,
        typeChecker,
        languageService,
        compilerOptions,
    } as const;
}
