import { join } from "desm";
import { createTs } from "../../vitest/utils/ts-vfs/ts-fs";
import ts from "typescript";

await async function main() {
    const tsTool = createTs({
        projectRootPath: join(import.meta.url, `../../`),
    });

    const sourceFile = tsTool.host.getSourceFile(`./dummy-vitest.workspace.ts`, tsTool.compilerOptions.target ?? ts.ScriptTarget.ESNext);
    if (!sourceFile) throw new Error("getSourceFile() did not find the target file");

    function walkTransform<T extends ts.Node>(
        rootNode: ts.Node,
        context: ts.TransformationContext | undefined,
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        visitorCb: (node: ts.Node, abort: AbortController["abort"]) => (void | ts.VisitResult<ts.Node>),
    ): T {
        const ac = new AbortController();

        const visitor: ts.Visitor = (node) => {
            if (ac.signal.aborted) return node;

            const visitorResult = visitorCb(
                node,
                // Deliberately written out, because `.abort` is not bound to the `this` context
                (reason?: any) => ac.abort(reason),
            );
            if (visitorResult !== void 0) return visitorResult;

            return ts.visitEachChild(node, visitor, context);
        };
        return ts.visitNode(rootNode, visitor) as T;
    }

    function walkFind<T extends ts.Node>(
        rootNode: ts.Node,
        context: ts.TransformationContext | undefined,
        // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        visitorCb: (node: ts.Node, abort: AbortController["abort"]) => (T | undefined | void),
    ): T | undefined {
        let found: T | undefined;
        const ac = new AbortController();

        const visitor: ts.Visitor = (node) => {
            if (ac.signal.aborted) return node;

            const visitorResult = visitorCb(
                node,
                // Deliberately written out, because `.abort` is not bound to the `this` context
                (reason?: any) => ac.abort(reason),
            );
            if (visitorResult !== void 0) {
                found = visitorResult;
                ac.abort();
            }

            return ts.visitEachChild(node, visitor, context);
        };
        ts.visitNode(rootNode, visitor) as ts.Node;
        return found;
    }

    const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => (rootNode) => {
        const nodeOf = <T extends ts.Node>(walkFindFn: Parameters<typeof walkFind<T>>[2]) => {
            return (nodeStart?: ts.Node) => (nodeStart !== void 0) ? walkFind<T>(nodeStart, context, walkFindFn) : void 0;
        };

        const nodeOf_ExportAssignment = nodeOf(node => {
            if (ts.isExportAssignment(node)) return node;
        });
        const nodeOf_Identifier_defineWorkspace = nodeOf(node => {
            const correctName = `defineWorkspace`;

            if (ts.isCallExpression(node)) {
                if (ts.isIdentifier(node.expression)) {
                    if (node.expression.escapedText === correctName) return node;
                }
            }
        });
        const nodeOfArrayLiteralExpression = nodeOf(node => {
            if (ts.isArrayLiteralExpression(node)) return node;
        });

        const node1 = nodeOf_ExportAssignment(rootNode);
        const node2 = nodeOf_Identifier_defineWorkspace(node1);
        const node3 = nodeOfArrayLiteralExpression(node2);

        if (node3 === void 0) throw new Error(`Couldn't find "defineWorkspace()"'s array in the source file.`);

        return walkTransform(rootNode, context, (node, abort) => {
            if (node === node3) {
                /**
                 * TODO:
                 * - process node3 to get versions
                 * - take Transform_AliasedTsVersions and apply it based on processed versions
                 */
                return factory_array();
            }
        });
    };

    const transformationResult = ts.transform(sourceFile, [transformer], tsTool.compilerOptions);
    /**
     * Printer is required, because .text, and .getText, etc, doesn't take changes into account:
     * https://github.com/microsoft/TypeScript/issues/50204
     */
    const printer = ts.createPrinter();

    const source_new = printer.printFile(transformationResult.transformed[0]);
    console.log("transformed?", source_new);
}();

type Transform_AliasedTsVersions = {
    add:    string[],
    remove: string[],
    update: { from: string, to: string, }[],
};

function factory_array() {
    const { factory, } = ts;

    return factory.createArrayLiteralExpression(
        [
            factory.createCallExpression(
                factory.createIdentifier("vitestConfigWithAliasedTs"),
                void 0,
                [
                   factory.createStringLiteral("5.4.5"),
                ],
            ),
            // factory.createCallExpression(
            //     factory.createIdentifier("vitestConfigWithAliasedTs"),
            //     void 0,
            //     [
            //         factory.createNoSubstitutionTemplateLiteral(
            //             "5.5.0-beta",
            //             "5.5.0-beta",
            //         ),
            //         factory.createObjectLiteralExpression(
            //             [factory.createPropertyAssignment(
            //                 factory.createIdentifier("test"),
            //                 factory.createObjectLiteralExpression(
            //                     [],
            //                     true,
            //                 ),
            //             )],
            //             true,
            //         ),
            //     ],
            // ),
        ],
        true,
    );
}
