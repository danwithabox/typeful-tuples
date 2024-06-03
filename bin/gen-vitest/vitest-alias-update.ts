import { join } from "desm";
import { createTs } from "../../vitest/utils/ts-vfs/ts-fs";
import ts from "typescript";
import { walkMaybeToNodeOf, walkTransform } from "../../vitest/utils/ts-vfs/walk";
import { ESLint } from "eslint";
import { EOL } from "node:os";

/**
 * TODO:
 *  - more robust matching, such as handling rename of identifiers
 *      - blocked by the type-checker throwing errors around "flags", similar to this: https://github.com/microsoft/TypeScript/issues/58371
 */
const CORRECT_IDENTIFIERS = {
    "defineWorkspace":           "defineWorkspace",
    "vitestConfigWithAliasedTs": "vitestConfigWithAliasedTs",
} as const;

const transformRecipe: TransformRecipe_AliasedTsVersions = {
    add:    ["5.4.4"],
    remove: ["5.4.5"],
    update: [{ from: "5.5.0-beta", to: "5.6.1-beta", }],
};

const tsTool = createTs({
    projectRootPath: join(import.meta.url, `../../`),
});

const filePath = `./dummy-vitest.workspace.ts`;

function makeAdaptedSourceFile(filePath: string) {
    const MARKER_tsEmptyLine = `// @ts-empty-line`;

    const file = tsTool.host.readFile(filePath);
    if (file === void 0) throw new Error(`host.readFile() did not find the target file`);

    const fileNormalizedLF = file.replace(/\r\n/ug, "\n");
    const encodedEmptyLines = fileNormalizedLF.split(`\n`).map(_ => _ === "" ? MARKER_tsEmptyLine : _).join(`\n`);

    const sourceFile = ts.createSourceFile(
        filePath,
        encodedEmptyLines,
        tsTool.compilerOptions.target ?? ts.ScriptTarget.ESNext,
    );
    const decodeEmptyLines = (sourceFileText: string): string => {
        const decoded = sourceFileText.split(`\n`).map(_ => _ === MARKER_tsEmptyLine ? "" : _);
        const decoded_CLRF = decoded.join(EOL);
        return decoded_CLRF;
    };

    return {
        sourceFile,
        decodeEmptyLines,
    };
}

const { sourceFile, decodeEmptyLines, } = makeAdaptedSourceFile(filePath);

const nodeOf_ExportAssignment = walkMaybeToNodeOf(node => {
    if (ts.isExportAssignment(node)) return node;
});
const nodeOf_Identifier_defineWorkspace = walkMaybeToNodeOf(node => {
    const correctName = CORRECT_IDENTIFIERS.defineWorkspace;

    if (ts.isCallExpression(node)) {
        if (ts.isIdentifier(node.expression)) {
            if (node.expression.escapedText === correctName) return node;
        }
    }
});
const nodeOf_ArrayLiteralExpression = walkMaybeToNodeOf(node => {
    if (ts.isArrayLiteralExpression(node)) return node;
});

export function astOperation_parseVersions(): string[] {
    const node1 = nodeOf_ExportAssignment(sourceFile);
    const node2 = nodeOf_Identifier_defineWorkspace(node1);
    const node_workspaceArray = nodeOf_ArrayLiteralExpression(node2);

    if (node_workspaceArray === void 0) throw new Error(`Couldn't find a default-exported "${CORRECT_IDENTIFIERS.defineWorkspace}()"'s array in the source file.`);

    const versions = interpretAst_workspaceArray_versions(node_workspaceArray);

    const parsedVersions = versions.map(_ => _.textOfVersion);
    return parsedVersions;
}

await async function main() {
    const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => (rootNode) => {
        const node1 = nodeOf_ExportAssignment(rootNode, context);
        const node2 = nodeOf_Identifier_defineWorkspace(node1, context);
        const node_workspaceArray = nodeOf_ArrayLiteralExpression(node2, context);

        if (node_workspaceArray === void 0) throw new Error(`Couldn't find a default-exported "${CORRECT_IDENTIFIERS.defineWorkspace}()"'s array in the source file.`);

        return walkTransform(rootNode, context, (node, abort) => {
            if (node === node_workspaceArray) {
                const versions = interpretAst_workspaceArray_versions(node_workspaceArray);
                const transformed = transformWalkResultWithRecipe(versions, transformRecipe);
                const elements = transformed.map(_ => _.cloneNodeOfArrayElement);

                return ts.factory.updateArrayLiteralExpression(node_workspaceArray,
                    elements,
                );
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
    const source_decoded = decodeEmptyLines(source_new);

    const eslint = new ESLint({ fix: true, });
    const [{ output: linted, }] = await eslint.lintText(source_decoded);

    if (linted === void 0) throw new Error(`ESLint output missing, somehow`);
    // tsTool.host.writeFile(filePath, linted, false);
}();

/** Should be executed in the order of remove, add, update */
export type TransformRecipe_AliasedTsVersions = {
    add:    string[],
    remove: string[],
    update: { from: string, to: string, }[],
};

type WalkResult_VersionAndNode = {
    textOfVersion:           string,
    cloneNodeOfArrayElement: ts.CallExpression,
};

function transformWalkResultWithRecipe(
    walkResult: WalkResult_VersionAndNode[],
    transformRecipe: TransformRecipe_AliasedTsVersions,
): WalkResult_VersionAndNode[] {
    const _walkResult = [...walkResult];
    const { add: _r_add, remove: _r_remove, update: _r_update, } = transformRecipe;

    const findExistentVersionEntry = (version: string): { found: WalkResult_VersionAndNode, index: number, } | { found: undefined, } => {
        const index = _walkResult.findIndex(result => result.textOfVersion === version);
        const found = _walkResult[index] as (typeof _walkResult[number]) | undefined;
        if (found === void 0) return { found, };
        return { found, index, };
    };

    for (const version of _r_remove) {
        const checked = findExistentVersionEntry(version);
        if (!checked.found) {
            console.warn(`Skipped removing specified version "${version}": version does not exist in vitest.workspace.ts`);
            continue;
        }
        _walkResult.splice(checked.index, 1);
    }
    for (const version of _r_add) {
        const checked = findExistentVersionEntry(version);
        if (checked.found) {
            console.warn(`Skipped adding specified version "${version}": version already exists in vitest.workspace.ts`);
            continue;
        }
        const created = create_vitestConfigWithAliasedTs(version);
        _walkResult.push(created);
    }
    for (const { from: version, to: to_version, } of _r_update) {
        const checked = findExistentVersionEntry(version);
        if (!checked.found) {
            console.warn(`Skipped updating specified version "${version}": version does not exist in vitest.workspace.ts`);
            continue;
        }
        const created = create_vitestConfigWithAliasedTs(to_version, checked.found.cloneNodeOfArrayElement);
        _walkResult.splice(checked.index, 1, created);
    }

    const sorted = _walkResult.sort((a, b) => b.textOfVersion.toLocaleLowerCase().localeCompare(a.textOfVersion.toLocaleLowerCase()));

    return sorted;
}

function interpretAst_workspaceArray_versions(node_array: ts.ArrayLiteralExpression): WalkResult_VersionAndNode[] {
    const matchValidExpressionText = (expression: ts.Expression) => {
        switch (true) {
            case ts.isStringLiteral(expression): return expression.text;
            case ts.isNoSubstitutionTemplateLiteral(expression): return expression.text;
            case ts.isTemplateExpression(expression):
            default: return;
        }
    };
    const versions = node_array.elements.flatMap((element) => {
        if (ts.isCallExpression(element)) {
            if ((ts.isIdentifier(element.expression)) && (element.expression.escapedText === CORRECT_IDENTIFIERS.vitestConfigWithAliasedTs)) {
                const [arg_versionExpression, ...arg_rest] = element.arguments;
                const text = matchValidExpressionText(arg_versionExpression);
                if (text === void 0) throw new Error(
                    "Invalid string expression in place of version string, please only use string literals and no-substitution template literals " +
                    `for the parameter of "${CORRECT_IDENTIFIERS.vitestConfigWithAliasedTs}"`,
                );
                const cloneNodeOfArrayElement = ts.factory.updateCallExpression(element, element.expression, void 0, element.arguments);
                return [{ textOfVersion: text, cloneNodeOfArrayElement, }];
            }
        }
        return [];
    });
    return versions;
}

function create_vitestConfigWithAliasedTs(
    version: string,
    toUpdate?: WalkResult_VersionAndNode["cloneNodeOfArrayElement"],
): WalkResult_VersionAndNode {
    const { factory, } = ts;
    const cloneNodeOfArrayElement = (() => {
        if (toUpdate === void 0) {
            return factory.createCallExpression(
                factory.createIdentifier(CORRECT_IDENTIFIERS.vitestConfigWithAliasedTs),
                void 0,
                [
                    factory.createStringLiteral(version),
                ],
            );
        } else {
            const [version_old, ...rest_argumentsArray] = toUpdate.arguments;
            return factory.updateCallExpression(toUpdate,
                toUpdate.expression,
                toUpdate.typeArguments,
                [
                    factory.createStringLiteral(version),
                    ...rest_argumentsArray,
                ],
            );
        }
    })();
    return { textOfVersion: version, cloneNodeOfArrayElement, };
}
