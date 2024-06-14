import { describe, expect, test } from "vitest";
import { tupleUniqueOf } from "../src/index";
import { virtualTs } from "../vitest/utils/vitest-virtual-typescript";

describe(`tupleUniqueOf()`, () => {
    const { tooling: { runQueryOnVirtualFile, }, } = virtualTs;

    test(`returns the input value unchanged`, () => {
        const input = [1, 2, 3];
        const output = tupleUniqueOf<(typeof input)[number]>()(input);
        expect(output).toEqual(input);
    });

    describe(`developer experience, expected feedback in IDE`, () => {

        test(`diagnostics result, when provided tuple is \`["foo", ""]\`: Type '""' is not assignable to type 'Allowed'.`, () => {
            const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, $imports, }) => /* ts */`
                import { tupleUniqueOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                tupleUniqueOf<Allowed>()(["foo", ""]);
            `);

            expect(result).toHaveSemanticDiagnostics([{
                category:    "Error",
                code:        2322,
                messageText: `Type '""' is not assignable to type '"bar" | "baz"'.`,
                lines:       [4],
            }]);
        });

        test(`diagnostics result, when provided tuple is \`["foo", "err"]\`: Type '"err"' is not assignable to type 'Allowed'.`, () => {
            const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, $imports, }) => /* ts */`
                import { tupleUniqueOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                tupleUniqueOf<Allowed>()(["foo", "err"]);
            `);

            expect(result).toHaveSemanticDiagnostics([{
                category:    "Error",
                code:        2322,
                messageText: `Type '"err"' is not assignable to type '"" | Allowed'.`,
                lines:       [4],
            }]);
        });

        test(`diagnostics result, when provided tuple is \`["err", "foo"]\`: Type '"err"' is not assignable to type 'Allowed'.`, () => {
            const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, $imports, }) => /* ts */`
                import { tupleUniqueOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                tupleUniqueOf<Allowed>()(["err", "foo"]);
            `);

            expect(result).toHaveSemanticDiagnostics([{
                category:    "Error",
                code:        2322,
                messageText: `Type '"err"' is not assignable to type '"" | Allowed'.`,
                lines:       [4],
            }]);
        });

        test(`diagnostics result, when provided variable is \`["foo", "err", "baz"]\`: Type '"err"' is not assignable to type 'Allowed'.`, () => {
            const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, $imports, }) => /* ts */`
                import { tupleUniqueOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                tupleUniqueOf<Allowed>()([
                    "foo",
                    "err",
                    "baz",
                ]);
            `);

            expect(result).toHaveSemanticDiagnostics([
                {
                    category:    "Error",
                    code:        2322,
                    messageText: `Type '"err"' is not assignable to type '"" | Allowed'.`,
                    lines:       [6],
                },
            ]);
        });

        test(`diagnostics result, when provided variable is \`const input = ["foo", "err"] as const\`: Type '"err"' is not assignable to type 'Allowed'.`, () => {
            const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, $imports, }) => /* ts */`
                import { tupleUniqueOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                const input = ["foo", "err"] as const;
                tupleUniqueOf<Allowed>()(input);
            `);

            expect(result).toHaveSemanticDiagnostics([
                {
                    category:    "Error",
                    code:        2345,
                    messageText: `Argument of type 'readonly ["foo", "err"]' is not assignable to parameter of type 'readonly ("" | Allowed)[]'.`,
                    lines:       [5],
                },
                {
                    category:    "Error",
                    code:        2322,
                    messageText: `Type '"foo" | "err"' is not assignable to type '"" | Allowed'.`,
                    lines:       [5],
                },
                {
                    category:    "Error",
                    code:        2322,
                    messageText: `Type '"err"' is not assignable to type '"" | Allowed'.`,
                    lines:       [5],
                },
            ]);
        });

        test(`diagnostics result, when provided variable is \`const input = ["foo", "err"]\`: Type 'string' is not assignable to type 'Allowed'.`, () => {
            const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, $imports, }) => /* ts */`
                import { tupleUniqueOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                const input = ["foo", "err"];
                tupleUniqueOf<Allowed>()(input);
            `);

            expect(result).toHaveSemanticDiagnostics([
                {
                    category:    "Error",
                    code:        2345,
                    messageText: `Argument of type 'string[]' is not assignable to parameter of type 'readonly ("" | Allowed)[]'.`,
                    lines:       [5],
                },
                {
                    category:    "Error",
                    code:        2322,
                    messageText: `Type 'string' is not assignable to type '"" | Allowed'.`,
                    lines:       [5],
                },
            ]);
        });

        test(`autocomplete result, when provided tuple is \`["foo", ""]\`: ["bar", "baz"]`, () => {
            const result = runQueryOnVirtualFile.getCompletionsAtPosition("../index.ts", ({ $c, $imports, }) => /* ts */`
                import { tupleUniqueOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                tupleUniqueOf<Allowed>()(["foo", "${$c}"]);
            `);

            expect(result).toHaveCompletions(["bar", "baz"]);
        });

        test(`autocomplete result, when provided tuple is \`["", "bar"]\`: ["foo", "baz"]`, () => {
            const result = runQueryOnVirtualFile.getCompletionsAtPosition("../index.ts", ({ $c, $imports, }) => /* ts */`
                import { tupleUniqueOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                tupleUniqueOf<Allowed>()(["${$c}", "bar"]);
            `);

            expect(result).toHaveCompletions(["foo", "baz"]);
        });

        test(`autocomplete result, when provided tuple is \`["foo", "bar", ""]\`: ["baz"]`, () => {
            const result = runQueryOnVirtualFile.getCompletionsAtPosition("../index.ts", ({ $c, $imports, }) => /* ts */`
                import { tupleUniqueOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                tupleUniqueOf<Allowed>()(["foo", "bar", "${$c}"]);
            `);

            expect(result).toHaveCompletions(["baz"]);
        });

        test(`autocomplete result, when provided tuple is \`["foo", "", "baz"]\`: ["bar"]`, () => {
            const result = runQueryOnVirtualFile.getCompletionsAtPosition("../index.ts", ({ $c, $imports, }) => /* ts */`
                import { tupleUniqueOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                tupleUniqueOf<Allowed>()(["foo", "${$c}", "baz"]);
            `);

            expect(result).toHaveCompletions(["bar"]);
        });

        test(`autocomplete result, when provided tuple is \`["", "bar", "baz"]\`: ["foo"]`, () => {
            const result = runQueryOnVirtualFile.getCompletionsAtPosition("../index.ts", ({ $c, $imports, }) => /* ts */`
                import { tupleUniqueOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                tupleUniqueOf<Allowed>()(["${$c}", "bar", "baz"]);
            `);

            expect(result).toHaveCompletions(["foo"]);
        });

        test(`autocomplete result, when provided tuple is \`["foo", "bar", "baz", ""]\`: []`, () => {
            const result = runQueryOnVirtualFile.getCompletionsAtPosition("../index.ts", ({ $c, $imports, }) => /* ts */`
                import { tupleUniqueOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                tupleUniqueOf<Allowed>()(["foo", "bar", "baz", "${$c}"]);
            `);

            expect(result).toHaveCompletions([]);
        });

        test(`autocomplete result, when provided tuple is \`["", "foo", "bar", "baz"]\`: []`, () => {
            const result = runQueryOnVirtualFile.getCompletionsAtPosition("../index.ts", ({ $c, $imports, }) => /* ts */`
                import { tupleUniqueOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                tupleUniqueOf<Allowed>()(["${$c}", "foo", "bar", "baz"]);
            `);

            expect(result).toHaveCompletions([]);
        });

        test(`autocomplete result, when provided tuple is \`["foo", "bar", "baz"]\`, and checking first param: ["foo"]`, () => {
            const result = runQueryOnVirtualFile.getCompletionsAtPosition("../index.ts", ({ $c, $imports, }) => /* ts */`
                import { tupleUniqueOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                tupleUniqueOf<Allowed>()(["foo${$c}", "bar", "baz"]);
            `);

            expect(result).toHaveCompletions(["foo"]);
        });

        test(`autocomplete result, when provided tuple is \`["foo", "bar", "baz"]\`, and checking second param: ["bar"]`, () => {
            const result = runQueryOnVirtualFile.getCompletionsAtPosition("../index.ts", ({ $c, $imports, }) => /* ts */`
                import { tupleUniqueOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                tupleUniqueOf<Allowed>()(["foo", "bar${$c}", "baz"]);
            `);

            expect(result).toHaveCompletions(["bar"]);
        });

        test(`autocomplete result, when provided tuple is \`["foo", "bar", "baz"]\`, and checking third param: ["baz"]`, () => {
            const result = runQueryOnVirtualFile.getCompletionsAtPosition("../index.ts", ({ $c, $imports, }) => /* ts */`
                import { tupleUniqueOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                tupleUniqueOf<Allowed>()(["foo", "bar", "baz${$c}"]);
            `);

            expect(result).toHaveCompletions(["baz"]);
        });

        describe(`uniqueness checks`, () => {

            test(`diagnostics result, when provided non-unique tuple is \`["foo", "foo"]\`: there is no error, due to deliberately not having a uniqueness check`, () => {
                const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, $imports, }) => /* ts */`
                    import { tupleUniqueOf } from "${$imports["./src/index"]}";

                    type Allowed = "foo" | "bar" | "baz";
                    tupleUniqueOf<Allowed>()([
                        "foo",
                        "foo",
                    ]);
                `);

                expect(result).toHaveSemanticDiagnostics([
                    {
                        category:    "Error",
                        code:        2322,
                        lines:       [6],
                        messageText: "Type 'string' is not assignable to type 'never'.",
                    },
                ]);
            });

            test(`diagnostics result, when provided tuple is \`["foo", "foo", "err"]\`: Type '"err"' is not assignable to type 'Allowed'.`, () => {
                const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, $imports, }) => /* ts */`
                    import { tupleUniqueOf } from "${$imports["./src/index"]}";

                    type Allowed = "foo" | "bar" | "baz";
                    tupleUniqueOf<Allowed>()(["foo", "foo", "err"]);
                `);

                expect(result).toHaveSemanticDiagnostics([{
                    category:    "Error",
                    code:        2322,
                    messageText: `Type '"err"' is not assignable to type '"" | Allowed'.`,
                    lines:       [4],
                }]);
            });

            test(`diagnostics result, when provided tuple is \`["err", "foo", "foo"]\`: Type '"err"' is not assignable to type 'Allowed'.`, () => {
                const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, $imports, }) => /* ts */`
                    import { tupleUniqueOf } from "${$imports["./src/index"]}";

                    type Allowed = "foo" | "bar" | "baz";
                    tupleUniqueOf<Allowed>()(["err", "foo", "foo"]);
                `);

                expect(result).toHaveSemanticDiagnostics([{
                    category:    "Error",
                    code:        2322,
                    messageText: `Type '"err"' is not assignable to type '"" | Allowed'.`,
                    lines:       [4],
                }]);
            });

            test(`autocomplete result, when provided non-unique tuple is \`["foo", "foo", ""]\`: ["bar", "baz"]`, () => {
                const result = runQueryOnVirtualFile.getCompletionsAtPosition("../index.ts", ({ $c, $imports, }) => /* ts */`
                    import { tupleUniqueOf } from "${$imports["./src/index"]}";

                    type Allowed = "foo" | "bar" | "baz";
                    tupleUniqueOf<Allowed>()(["foo", "foo", "${$c}"]);
                `);

                expect(result).toHaveCompletions(["bar", "baz"]);
            });

        });

    });
});
