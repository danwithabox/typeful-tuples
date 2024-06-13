import { describe, expect, test } from "vitest";
import { tupleUnique } from "../src/index";
import { virtualTs } from "../vitest/utils/vitest-virtual-typescript";

describe(`tupleUnique()`, () => {
    const { tooling: { runQueryOnVirtualFile, }, } = virtualTs;

    test(`returns the input value unchanged`, () => {
        const input = [1, 2, 3];
        const output = tupleUnique(input);
        expect(output).toEqual(input);
    });

    describe(`developer experience, expected feedback in IDE`, () => {

        test(`diagnostics result, when provided tuple is \`["foo", ""]\`: there is no error`, () => {
            const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, $imports, }) => /* ts */`
                import { tupleUnique } from "${$imports["./src/index"]}";

                tupleUnique(["foo", ""]);
            `);

            expect(result).toHaveSemanticDiagnostics([]);
        });

        test(`diagnostics result, when provided tuple is \`["foo", "err"]\`: there is no error`, () => {
            const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, $imports, }) => /* ts */`
                import { tupleUnique } from "${$imports["./src/index"]}";

                tupleUnique(["foo", "err"]);
            `);

            expect(result).toHaveSemanticDiagnostics([]);
        });

        test(`diagnostics result, when provided variable is \`const input = ["foo", "err"] as const\`: there is no error`, () => {
            const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, $imports, }) => /* ts */`
                import { tupleUnique } from "${$imports["./src/index"]}";

                const input = ["foo", "err"] as const;
                tupleUnique(input);
            `);

            expect(result).toHaveSemanticDiagnostics([]);
        });

        test(`diagnostics result, when provided variable is \`const input = ["foo", "err"]\`: there is no error`, () => {
            const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, $imports, }) => /* ts */`
                import { tupleUnique } from "${$imports["./src/index"]}";

                const input = ["foo", "err"];
                tupleUnique(input);
            `);

            expect(result).toHaveSemanticDiagnostics([]);
        });

        test(`autocomplete result, when provided tuple is \`["foo", ""]\`: no suggestions`, () => {
            const result = runQueryOnVirtualFile.getCompletionsAtPosition("../index.ts", ({ $c, $imports, }) => /* ts */`
                import { tupleUnique } from "${$imports["./src/index"]}";

                tupleUnique(["foo", "${$c}"]);
            `);

            expect(result).toHaveCompletions([""]); // For some reason, empty autocomplete is actually presented as a single-element tuple of an empty string
        });

        describe(`uniqueness checks`, () => {

            test(`diagnostics result, when provided non-unique tuple is \`["foo", "foo"]\`: "Type 'string' is not assignable to type 'never'."`, () => {
                const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, $imports, }) => /* ts */`
                    import { tupleUnique } from "${$imports["./src/index"]}";

                    tupleUnique([
                        "foo",
                        "foo",
                    ]);
                `);
                expect(result).toHaveSemanticDiagnostics([
                    {
                        category:    "Error",
                        code:        2322,
                        messageText: "Type 'string' is not assignable to type 'never'.",
                        lines:       [5],
                    },
                ]);
            });

            test(`diagnostics result, when provided non-unique tuple is \`["foo", "foo", "foo", "foo"]\`: "Type 'string' is not assignable to type 'never'."`, () => {
                const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, $imports, }) => /* ts */`
                    import { tupleUnique } from "${$imports["./src/index"]}";

                    tupleUnique([
                        "foo",
                        "foo",
                        "foo",
                        "foo",
                    ]);
                `);
                expect(result).toHaveSemanticDiagnostics([
                    {
                        category:    "Error",
                        code:        2322,
                        messageText: "Type 'string' is not assignable to type 'never'.",
                        lines:       [5],
                    },
                    {
                        category:    "Error",
                        code:        2322,
                        messageText: "Type 'string' is not assignable to type 'never'.",
                        lines:       [6],
                    },
                    {
                        category:    "Error",
                        code:        2322,
                        messageText: "Type 'string' is not assignable to type 'never'.",
                        lines:       [7],
                    },
                ]);
            });

            test(`diagnostics result, when provided non-unique tuple is \`["foo", "foo", "bar", "bar"]\`: "Type 'string' is not assignable to type 'never'."`, () => {
                const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, $imports, }) => /* ts */`
                    import { tupleUnique } from "${$imports["./src/index"]}";

                    tupleUnique([
                        "foo",
                        "foo",
                        "bar",
                        "bar",
                    ]);
                `);
                expect(result).toHaveSemanticDiagnostics([
                    {
                        category:    "Error",
                        code:        2322,
                        messageText: "Type 'string' is not assignable to type 'never'.",
                        lines:       [5],
                    },
                    {
                        category:    "Error",
                        code:        2322,
                        messageText: "Type 'string' is not assignable to type 'never'.",
                        lines:       [7],
                    },
                ]);
            });

            test(`diagnostics result, when provided non-unique tuple is \`["foo", "bar", "foo", "bar"]\`: "Type 'string' is not assignable to type 'never'."`, () => {
                const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, $imports, }) => /* ts */`
                    import { tupleUnique } from "${$imports["./src/index"]}";

                    tupleUnique([
                        "foo",
                        "bar",
                        "foo",
                        "bar",
                    ]);
                `);
                expect(result).toHaveSemanticDiagnostics([
                    {
                        category:    "Error",
                        code:        2322,
                        messageText: "Type 'string' is not assignable to type 'never'.",
                        lines:       [6],
                    },
                    {
                        category:    "Error",
                        code:        2322,
                        messageText: "Type 'string' is not assignable to type 'never'.",
                        lines:       [7],
                    },
                ]);
            });

            test(`diagnostics result, when provided non-unique tuple is \`["foo", 1, "bar", "foo", 1]\`: "Type 'string' is not assignable to type 'never'.", "Type 'number' is not assignable to type 'never'."`, () => {
                const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, $imports, }) => /* ts */`
                    import { tupleUnique } from "${$imports["./src/index"]}";

                    tupleUnique([
                        "foo",
                        1,
                        "bar",
                        "foo",
                        1,
                    ]);
                `);
                expect(result).toHaveSemanticDiagnostics([
                    {
                        category:    "Error",
                        code:        2322,
                        messageText: "Type 'string' is not assignable to type 'never'.",
                        lines:       [7],
                    },
                    {
                        category:    "Error",
                        code:        2322,
                        messageText: "Type 'number' is not assignable to type 'never'.",
                        lines:       [8],
                    },
                ]);
            });

            test(`diagnostics result, when provided non-unique tuple is complex: various assignability errors, with correct example above it`, () => {
                const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, $imports, }) => /* ts */`
                    import { tupleUnique } from "${$imports["./src/index"]}";

                    const values_correct = tupleUnique([1, 2, ["a"], ["b"], { a: true, }, { b: true, }, { a: false, }]);
                    const values_invalid = tupleUnique([
                        1,
                        1,
                        ["a"],
                        ["a"],
                        { a: [true, false], },
                        { b: true, },
                        { a: [false, true], },
                        { a: [true, false], },
                    ]);
                `);
                expect(result).toHaveSemanticDiagnostics([
                    {
                        category:    "Error",
                        code:        2322,
                        lines:       [6],
                        messageText: "Type 'number' is not assignable to type 'never'.",
                    },
                    {
                        category:    "Error",
                        code:        2322,
                        lines:       [8],
                        messageText: "Type 'string[]' is not assignable to type 'never'.",
                    },
                    {
                        category:    "Error",
                        code:        2322,
                        lines:       [12],
                        messageText: "Type '{ a: boolean[]; }' is not assignable to type 'never'.",
                    },
                ]);
            });

        });

    });
});
