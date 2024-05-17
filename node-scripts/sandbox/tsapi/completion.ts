import ts from "typescript";
import assert from "node:assert";

/**
 * https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API
 * https://www.typescriptlang.org/dev/typescript-vfs/
 * https://github.com/microsoft/TypeScript/issues/5276
 */

await

function sandbox() {
    // {
    //     const obj = {
    //         xyz: 10,
    //         lmn: 13,
    //     };

    //     obj.lmn;
    // }
    // {
    //     const fn = (value: "foo" | "bar") => {};
    //     fn("");
    // }
};

await async function main() {

    const srcContent =
// `
// export {}
// let obj = {
// xyz: 10,
// lmn: 13
// };

// obj.lm`
`const fn = (value: "foo" | "bar") => {};
fn("");`
    ;

    const files = [`mysrc.ts`];

    const host = createLanguageServiceHost({
        files,
        srcContent,
        compilerOptions: {
            target:      ts.ScriptTarget.ES2017,
            declaration: true,
        },
    });
    const service = ts.createLanguageService(host, ts.createDocumentRegistry());
    const info = service.getCompletionsAtPosition(files[0], srcContent.length - 3, {});

    console.log(`---`);
    console.log(info);
    console.log(`|||`);

    function createLanguageServiceHost({ files, srcContent, compilerOptions, }: {
        files:           string[],
        srcContent:      string,
        /**
         * typeRoots here is no-op:
         * We may need to implement resolveTypeReferenceDirectives?
         */
        compilerOptions: ts.CompilerOptions,
    }): ts.LanguageServiceHost {
        return {
            getScriptFileNames,
            getScriptVersion,
            getScriptSnapshot,
            getCurrentDirectory,
            getCompilationSettings,
            getDefaultLibFileName,
            fileExists,
            readFile,
        };

        function getScriptFileNames() {
            return files;
        }
        function getScriptVersion(path: string) {
            return "0";
        }
        function getScriptSnapshot(fileName: string): ts.IScriptSnapshot {
            return ts.ScriptSnapshot.fromString(srcContent);
        }
        function getCurrentDirectory() {
            return process.cwd();
        }
        function getCompilationSettings(): ts.CompilerOptions {
            return compilerOptions;
        }
        function getDefaultLibFileName(options: ts.CompilerOptions): string {
            return ts.getDefaultLibFilePath(options);
        }
        function fileExists(path: string) {
            const exist = ts.sys.fileExists(path);
            return exist;
        }
        function readFile(path: string, encoding?: string): string {
            throw new Error("readFile is not implemented");
        }
    }

}();
