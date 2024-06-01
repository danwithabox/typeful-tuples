import { join } from "desm";
import { createVirtualTs } from "../../vitest/utils/ts-vfs/ts-vfs";
import ts from "typescript";
import { createTs } from "../../vitest/utils/ts-vfs/ts-fs";

await async function main() {
    // const __virtualTs = createVirtualTs({
    //     projectRootPath: join(import.meta.url, `../../`),
    // });
    const virtualizedTs = createTs({
        projectRootPath: join(import.meta.url, `../../`),
    });

    // const virtualCwd = virtualTs.vfs.env.sys.getCurrentDirectory();
    // const f1 = `./dummy-vitest.workspace.ts`; // Relative to process.cwd(), NOT virtualCwd
    // const file = virtualTs.vfs.env.getSourceFile(f1);
    // const file1 = virtualTs.vfs.env.sys.readFile(f1);
    // // const file2 = virtualTs.vfs.env.createFile(`../src/index2.ts`, file1)
    // // console.log("cwd", virtualCwd);
    // // console.log("file", file);
    // // console.log("file1", file1);
    // if (file1 === void 0) throw new Error(`File not found by "sys.readFile()"`);

    // const sourceFile = ts.createSourceFile(
    //     "dummy-vitest.workspace.ts",
    //     file1,
    //     { languageVersion: virtualTs.tsconfig.compilerOptions.target ?? ts.ScriptTarget.ESNext, },
    //     /* setParentNodes */ true,
    // );

    // virtualTs.vfs.env.createFile("typecheck.ts", sourceFile.text);
    // const sourceFileVirtual = virtualTs.vfs.env.getSourceFile("typecheck.ts");
    // if (sourceFileVirtual === void 0) throw new Error("sourceFileVirtual missing");

    // console.log("sourceFile");
    // console.log(sourceFile);

    const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => (rootNode) => {
        const memory = {
            /** Instead of this, use typechecker to identify function */
            callsiteNameOf_defineWorkspace: void 0 as string | undefined,
        };


        const visitor: ts.Visitor = (node) => {
            node = ts.visitEachChild(node, visitor, context);
            // const typeChecker = __virtualTs.vfs.env.languageService.getProgram()?.getTypeChecker();
            const typeChecker = virtualizedTs.languageService.getProgram()?.getTypeChecker();
            switch (node.kind) {
                case ts.SyntaxKind.ArrayLiteralExpression: {
                    // console.log("node", node);
                    break;
                }
                case ts.SyntaxKind.ImportDeclaration: {
                    const _node = node as ts.ImportDeclaration;
                    const _namedBindings = _node.importClause?.namedBindings;
                    if (_namedBindings?.kind === ts.SyntaxKind.NamedImports) {
                        _namedBindings.elements.map(importSpecifier => {
                            const {
                                name: { escapedText: name, },
                                propertyName: _propertyName,
                            } = importSpecifier;
                            const propertyName = _propertyName?.escapedText;

                            if (name === "defWspace") {
                                console.log("check");
                                const sym = virtualizedTs.typeChecker.getSymbolAtLocation(importSpecifier.name);
                                console.log("sym", sym);
                            }
                            // if (name === "defWspace") {
                            //     console.group({ name, propertyName, });
                            //     // const sym = __virtualTs.typeChecker.getSymbolAtLocation(importSpecifier.name);
                            //     const sym = virtualizedTs.typeChecker.getSymbolAtLocation(importSpecifier.name);
                            //     if (sym) {
                            //         // const refs = __virtualTs.vfs.env.languageService.findReferences("typecheck.ts", _node.getStart());
                            //         const refs = virtualizedTs.languageService.findReferences("typecheck.ts", _node.getStart());
                            //         const references = refs?.flatMap(ref => ref.references) ?? [];
                            //         references.flatMap(reference => {
                            //             // reference
                            //         });
                            //     }
                            //     console.log("sym", sym);
                            //     console.groupEnd();
                            // }

                        });
                    }
                    break;
                }
                case ts.SyntaxKind.Identifier: {
                    const _node = node as ts.Identifier;
                    console.log("_node", _node.escapedText);
                    // const sym = __virtualTs.typeChecker.getSymbolAtLocation(_node);
                    const sym = virtualizedTs.typeChecker.getSymbolAtLocation(_node);
                    break;
                }
                default: break;
            }
            return node;
        };
        return ts.visitNode(rootNode, visitor) as ts.SourceFile;
    };

    const sourceFile = virtualizedTs.host.getSourceFile("./dummy-vitest.workspace.ts", ts.ScriptTarget.ESNext);
    if (!sourceFile) throw new Error(`sourceFile missing`);

    // const transformationResult = ts.transform(sourceFile, [transformer]);
    // const transformationResult = ts.transform(sourceFileVirtual, [transformer]);
    // transformationResult.transformed;

    /**
     * I thought not using a transformer would fix it, according to this: https://github.com/microsoft/TypeScript/issues/48706
     */
    const walk = (node: ts.Node, visitCb: (node: ts.Node) => void) => {
        node.forEachChild(node => {
            visitCb(node);
            walk(node, visitCb);
        });
    };
    // sourceFile.forEachChild(node => {
    //     const sym = virtualizedTs.typeChecker.getSymbolAtLocation(node);
    //     console.log("non-transform sym", node.getText(), sym);
    // });
    walk(sourceFile, node => {
        const sym = virtualizedTs.typeChecker.getSymbolAtLocation(node);
        console.log("non-transform sym", node.getText(), sym);
    });
}();
