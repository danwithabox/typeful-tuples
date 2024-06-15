import { describe, expect, test } from "vitest";
import { tupleExhaustiveOf } from "../src/index";
import { virtualTs } from "../vitest/utils/vitest-virtual-typescript";

describe(`tupleExhaustiveOf()`, () => {
    const { tooling: { runQueryOnVirtualFile, }, } = virtualTs;

    test(`returns the input value unchanged`, () => {
        const input = [1, 2, 3];
        const output = tupleExhaustiveOf<(typeof input)[number]>()(input);
        expect(output).toEqual(input);
    });

    describe(`developer experience, expected feedback in IDE`, () => {

        test(`diagnostics result, when provided tuple is \`["foo", ""]\`: Type '""' is not assignable to type 'Allowed'.`, () => {
            const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, $imports, }) => /* ts */`
                import { tupleExhaustiveOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                tupleExhaustiveOf<Allowed>()(["foo", ""]);
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
                import { tupleExhaustiveOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                tupleExhaustiveOf<Allowed>()(["foo", "err"]);
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
                import { tupleExhaustiveOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                tupleExhaustiveOf<Allowed>()(["err", "foo"]);
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
                import { tupleExhaustiveOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                tupleExhaustiveOf<Allowed>()([
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
                import { tupleExhaustiveOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                const input = ["foo", "err"] as const;
                tupleExhaustiveOf<Allowed>()(input);
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
                import { tupleExhaustiveOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                const input = ["foo", "err"];
                tupleExhaustiveOf<Allowed>()(input);
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
                import { tupleExhaustiveOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                tupleExhaustiveOf<Allowed>()(["foo", "${$c}"]);
            `);

            expect(result).toHaveCompletions(["bar", "baz"]);
        });

        test(`autocomplete result, when provided tuple is \`["", "bar"]\`: ["foo", "baz"]`, () => {
            const result = runQueryOnVirtualFile.getCompletionsAtPosition("../index.ts", ({ $c, $imports, }) => /* ts */`
                import { tupleExhaustiveOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                tupleExhaustiveOf<Allowed>()(["${$c}", "bar"]);
            `);

            expect(result).toHaveCompletions(["foo", "baz"]);
        });

        test(`autocomplete result, when provided tuple is \`["foo", "bar", ""]\`: ["baz"]`, () => {
            const result = runQueryOnVirtualFile.getCompletionsAtPosition("../index.ts", ({ $c, $imports, }) => /* ts */`
                import { tupleExhaustiveOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                tupleExhaustiveOf<Allowed>()(["foo", "bar", "${$c}"]);
            `);

            expect(result).toHaveCompletions(["baz"]);
        });

        test(`autocomplete result, when provided tuple is \`["foo", "", "baz"]\`: ["bar"]`, () => {
            const result = runQueryOnVirtualFile.getCompletionsAtPosition("../index.ts", ({ $c, $imports, }) => /* ts */`
                import { tupleExhaustiveOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                tupleExhaustiveOf<Allowed>()(["foo", "${$c}", "baz"]);
            `);

            expect(result).toHaveCompletions(["bar"]);
        });

        test(`autocomplete result, when provided tuple is \`["", "bar", "baz"]\`: ["foo"]`, () => {
            const result = runQueryOnVirtualFile.getCompletionsAtPosition("../index.ts", ({ $c, $imports, }) => /* ts */`
                import { tupleExhaustiveOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                tupleExhaustiveOf<Allowed>()(["${$c}", "bar", "baz"]);
            `);

            expect(result).toHaveCompletions(["foo"]);
        });

        test(`autocomplete result, when provided tuple is \`["foo", "bar", "baz", ""]\`: []`, () => {
            const result = runQueryOnVirtualFile.getCompletionsAtPosition("../index.ts", ({ $c, $imports, }) => /* ts */`
                import { tupleExhaustiveOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                tupleExhaustiveOf<Allowed>()(["foo", "bar", "baz", "${$c}"]);
            `);

            expect(result).toHaveCompletions([]);
        });

        test(`autocomplete result, when provided tuple is \`["", "foo", "bar", "baz"]\`: []`, () => {
            const result = runQueryOnVirtualFile.getCompletionsAtPosition("../index.ts", ({ $c, $imports, }) => /* ts */`
                import { tupleExhaustiveOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                tupleExhaustiveOf<Allowed>()(["${$c}", "foo", "bar", "baz"]);
            `);

            expect(result).toHaveCompletions([]);
        });

        test(`autocomplete result, when provided tuple is \`["foo", "bar", "baz"]\`, and checking first param: ["foo"]`, () => {
            const result = runQueryOnVirtualFile.getCompletionsAtPosition("../index.ts", ({ $c, $imports, }) => /* ts */`
                import { tupleExhaustiveOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                tupleExhaustiveOf<Allowed>()(["foo${$c}", "bar", "baz"]);
            `);

            expect(result).toHaveCompletions(["foo"]);
        });

        test(`autocomplete result, when provided tuple is \`["foo", "bar", "baz"]\`, and checking second param: ["bar"]`, () => {
            const result = runQueryOnVirtualFile.getCompletionsAtPosition("../index.ts", ({ $c, $imports, }) => /* ts */`
                import { tupleExhaustiveOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                tupleExhaustiveOf<Allowed>()(["foo", "bar${$c}", "baz"]);
            `);

            expect(result).toHaveCompletions(["bar"]);
        });

        test(`autocomplete result, when provided tuple is \`["foo", "bar", "baz"]\`, and checking third param: ["baz"]`, () => {
            const result = runQueryOnVirtualFile.getCompletionsAtPosition("../index.ts", ({ $c, $imports, }) => /* ts */`
                import { tupleExhaustiveOf } from "${$imports["./src/index"]}";

                type Allowed = "foo" | "bar" | "baz";
                tupleExhaustiveOf<Allowed>()(["foo", "bar", "baz${$c}"]);
            `);

            expect(result).toHaveCompletions(["baz"]);
        });

        describe(`uniqueness checks`, () => {

            test(`diagnostics result, when provided non-unique tuple is \`["foo", "foo"]\`: there is no error, due to deliberately not having a uniqueness check`, () => {
                const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, $imports, }) => /* ts */`
                    import { tupleExhaustiveOf } from "${$imports["./src/index"]}";

                    type Allowed = "foo" | "bar" | "baz";
                    tupleExhaustiveOf<Allowed>()([
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
                    import { tupleExhaustiveOf } from "${$imports["./src/index"]}";

                    type Allowed = "foo" | "bar" | "baz";
                    tupleExhaustiveOf<Allowed>()(["foo", "foo", "err"]);
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
                    import { tupleExhaustiveOf } from "${$imports["./src/index"]}";

                    type Allowed = "foo" | "bar" | "baz";
                    tupleExhaustiveOf<Allowed>()(["err", "foo", "foo"]);
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
                    import { tupleExhaustiveOf } from "${$imports["./src/index"]}";

                    type Allowed = "foo" | "bar" | "baz";
                    tupleExhaustiveOf<Allowed>()(["foo", "foo", "${$c}"]);
                `);

                expect(result).toHaveCompletions(["bar", "baz"]);
            });

        });

        describe(`exhaustiveness checks`, () => {

            test(`diagnostics result, when provided tuple is \`["foo"]\`: Source has 1 element(s) but target requires 2.`, () => {
                const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, $imports, }) => /* ts */`
                    import { tupleExhaustiveOf } from "${$imports["./src/index"]}";

                    type Allowed = "foo" | "bar" | "baz";
                    tupleExhaustiveOf<Allowed>()(["foo"]);
                `);

                expect(result).toHaveSemanticDiagnostics([
                    {
                        category:    "Error",
                        code:        2345,
                        lines:       [4],
                        messageText: `Argument of type '["foo"]' is not assignable to parameter of type 'readonly ["foo", "bar" | "baz"]'.`,
                    },
                    {
                        category:    "Error",
                        code:        2618,
                        lines:       [4],
                        messageText: `Source has 1 element(s) but target requires 2.`,
                    },
                ]);
            });

            test(`diagnostics result, when provided tuple is \`["foo", "baz"]\`: Source has 2 element(s) but target requires 3.`, () => {
                const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, $imports, }) => /* ts */`
                    import { tupleExhaustiveOf } from "${$imports["./src/index"]}";

                    type Allowed = "foo" | "bar" | "baz";
                    tupleExhaustiveOf<Allowed>()(["foo", "baz"]);
                `);

                expect(result).toHaveSemanticDiagnostics([
                    {
                        category:    "Error",
                        code:        2345,
                        lines:       [4],
                        messageText: `Argument of type '["foo", "baz"]' is not assignable to parameter of type 'readonly ["foo", "baz", "bar"]'.`,
                    },
                    {
                        category:    "Error",
                        code:        2618,
                        lines:       [4],
                        messageText: `Source has 2 element(s) but target requires 3.`,
                    },
                ]);
            });

            test(`diagnostics result, when provided tuple is \`[]\`: Source has 0 element(s) but target requires 1.`, () => {
                const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, $imports, }) => /* ts */`
                    import { tupleExhaustiveOf } from "${$imports["./src/index"]}";

                    type Allowed = "foo" | "bar" | "baz";
                    tupleExhaustiveOf<Allowed>()([]);
                `);

                expect(result).toHaveSemanticDiagnostics([
                    {
                        category:    "Error",
                        code:        2345,
                        lines:       [4],
                        messageText: `Argument of type '[]' is not assignable to parameter of type 'readonly [Allowed]'.`,
                    },
                    {
                        category:    "Error",
                        code:        2618,
                        lines:       [4],
                        messageText: `Source has 0 element(s) but target requires 1.`,
                    },
                ]);
            });

        });

    });
});
