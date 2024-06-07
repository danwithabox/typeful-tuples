import { describe, expect, test } from "vitest";
import { tupleOf } from "../src/index";

describe(`tupleOf()`, () => {
    test(`returns the input value unchanged`, () => {
        const input = [1, 2, 3];
        const output = tupleOf<(typeof input)[number]>()(input);

        expect(output).toEqual(input);
    });
    describe(`developer experience`, () => {
        describe(`expected feedback in IDE`, () => {
            test(`diagnostics result, when tuple element 0 is empty string: Type '""' is not assignable to type 'Allowed'.`, () => {
                // TODO: I don't like this, can't use it outside in a describe block or anywhere that's not inside a test, for that matter, too many repeats
                const { sourceFiles: sf, virtualTs, } = globalThis;
                const { tooling: { runQueryOnVirtualFile, }, } = virtualTs;

                const result = runQueryOnVirtualFile.getSemanticDiagnostics(sf["../index.ts"], ({ $l, $imports, }) => /* ts */`
                    import { tupleOf } from "${$imports["./src/index"]}";
                    type Allowed = "1" | "2" | "3";
                    tupleOf<Allowed>()(["1", ""]);${$l}
                `);

                const diagnostic = result.queryResult.diagnostics.at(0);
                if (diagnostic === void 0) throw new Error("Expected a diagnostic error, but got none");

                // function messageMatcher() {}
                const message = diagnostic.messages.at(0);
                if (message === void 0) throw new Error("Expected a diagnostic message, but got none");
                expect(message.code).toBe(2322);
                expect(message.messageText).toBe(`Type '""' is not assignable to type 'Allowed'.`);
            });
            test(`autocomplete result, when tuple element 0 is empty string: ["1", "2", "3"]`, () => {
                // TODO: I don't like this, can't use it outside in a describe block or anywhere that's not inside a test, for that matter, too many repeats
                const { sourceFiles: sf, virtualTs, } = globalThis;
                const { tooling: { runQueryOnVirtualFile, }, } = virtualTs;

                const result = runQueryOnVirtualFile.getCompletionsAtPosition(sf["../index.ts"], ({ $c, $imports, }) => /* ts */`
                    import { tupleOf } from "${$imports["./src/index"]}";
                    type Allowed = "1" | "2" | "3";
                    tupleOf<Allowed>()(["1", "${$c}"]);
                `);

                expect(result.queryResult.entriesNames).to.include.members(["1", "2", "3"]);
            });
            type Allowed = "1" | "2" | "3";
            // tupleOf<Allowed>()(["1"]);
            // tupleOf<Allowed>()(["1", ""]);
            // tupleOf<Allowed>()(["1", "1", ""]);
            // tupleOf<Allowed>()(["1", "2", ""]);
        });
    });
});

// test(`tupleOf() returns the input type unchanged, as const`, () => {});
// test(`tupleOf() doesn't have uniqueness check, unlike tupleUnique() and tupleUniqueOf()`, () => {});
// test(`tupleOf() checks for not allowed elements`, () => {});
