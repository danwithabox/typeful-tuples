import { describe, expect, test } from "vitest";
import { tupleOf } from "../src/index";
import { virtualTs } from "../vitest/utils/vitest-virtual-typescript";

describe(`tupleOf()`, () => {
    const { tooling: { runQueryOnVirtualFile, }, } = virtualTs;

    test(`returns the input value unchanged`, () => {
        const input = [1, 2, 3];
        const output = tupleOf<(typeof input)[number]>()(input);

        expect(output).toEqual(input);
    });

    describe(`developer experience`, () => {
        describe(`expected feedback in IDE`, () => {

            test(`diagnostics result, when provided tuple is ["foo", ""]: Type '""' is not assignable to type 'Allowed'.`, () => {
                const result = runQueryOnVirtualFile.getSemanticDiagnostics("../index.ts", ({ $l, $imports, }) => /* ts */`
                    import { tupleOf } from "${$imports["./src/index"]}";

                    type Allowed = "foo" | "bar" | "baz";
                    tupleOf<Allowed>()(["foo", ""]);${$l}
                `);

                expect(result).toHaveSemanticDiagnostics([{
                    category:    "Error",
                    code:        2322,
                    messageText: `Type '""' is not assignable to type 'Allowed'.`,
                }]);
            });

            test(`autocomplete result, when provided tuple is ["foo", ""]: ["foo", "bar", "baz"]`, () => {
                const result = runQueryOnVirtualFile.getCompletionsAtPosition("../index.ts", ({ $c, $imports, }) => /* ts */`
                    import { tupleOf } from "${$imports["./src/index"]}";

                    type Allowed = "foo" | "bar" | "baz";
                    tupleOf<Allowed>()(["foo", "${$c}"]);
                `);

                expect(result).toHaveCompletions(["foo", "bar", "baz"]);
            });

            test(`autocomplete result, when provided tuple is ["foo", "foo", ""]: ["foo", "bar", "baz"]`, () => {
                const result = runQueryOnVirtualFile.getCompletionsAtPosition("../index.ts", ({ $c, $imports, }) => /* ts */`
                    import { tupleOf } from "${$imports["./src/index"]}";

                    type Allowed = "foo" | "bar" | "baz";
                    tupleOf<Allowed>()(["foo", "foo", "${$c}"]);
                `);

                expect(result).toHaveCompletions(["foo", "bar", "baz"]);
            });

            test(`autocomplete result, when provided tuple is ["foo", "bar", ""]: ["foo", "bar", "baz"]`, () => {
                const result = runQueryOnVirtualFile.getCompletionsAtPosition("../index.ts", ({ $c, $imports, }) => /* ts */`
                    import { tupleOf } from "${$imports["./src/index"]}";

                    type Allowed = "foo" | "bar" | "baz";
                    tupleOf<Allowed>()(["foo", "bar", "${$c}"]);
                `);

                expect(result).toHaveCompletions(["foo", "bar", "baz"]);
            });

            test(`autocomplete result, when provided tuple is ["foo", "bar", "baz", ""]: ["foo", "bar", "baz"]`, () => {
                const result = runQueryOnVirtualFile.getCompletionsAtPosition("../index.ts", ({ $c, $imports, }) => /* ts */`
                    import { tupleOf } from "${$imports["./src/index"]}";

                    type Allowed = "foo" | "bar" | "baz";
                    tupleOf<Allowed>()(["foo", "bar", "baz", "${$c}"]);
                `);

                expect(result).toHaveCompletions(["foo", "bar", "baz"]);
            });
        });
    });
});

// test(`tupleOf() returns the input type unchanged, as const`, () => {});
// test(`tupleOf() doesn't have uniqueness check, unlike tupleUnique() and tupleUniqueOf()`, () => {});
// test(`tupleOf() checks for not allowed elements`, () => {});
