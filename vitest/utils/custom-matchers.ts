import { expect } from "vitest";
import { is_TsVfs_ToolingResult_getCompletionsAtPosition, is_TsVfs_ToolingResult_getSemanticDiagnostics, type TsVfs_ToolingResult_getSemanticDiagnostics_SemanticDiagnostic_UnwrappedDiagnosticMessageChain } from "./ts-vfs/ts-vfs";
import chalk from "chalk";
import { DiagnosticCategory } from "typescript";
import type { Merge, OverrideProperties } from "type-fest";

// TODO: rewrite to chai plugin to allow detecting chaining, don't handle `this.isNot` until then - https://www.chaijs.com/guide/plugins/
expect.extend({
    toHaveCompletions(received, expected) {
        const _expected = expected as TsVfs_toHaveCompletions_param;
        const { isNot, utils, } = this;

        if (!is_TsVfs_ToolingResult_getCompletionsAtPosition(received)) return {
            pass:    false,
            message: () => `${utils.stringify(received, void 0, { min: true, })} is${isNot ? "" : " not"} a result of "getCompletionsAtPosition()"\n`,
        };

        const result = ((): { pass: true, } | { pass: false, errorMessage: string, } => {
            try {
                expect(received.queryResult.entriesNames).to.have.deep.members(_expected);
                return { pass: true, };
            } catch (error) {
                if (error instanceof Error) return { pass: false, errorMessage: error.message, };
                return { pass: false, errorMessage: String(error), };
            }
        })();

        if (result.pass) return {
            pass:    result.pass,
            message: () => "",
        };
        // TODO: custom matchers seem to throw "Error", not "AssertionError"
        return {
            pass:    result.pass,
            message: () =>
                `${result.errorMessage}\n\n` +
                `${utils.diff(received.queryResult.entriesNames, _expected, { commonColor: (value) => chalk.gray(value), })}\n`
            ,
        };

    },
    toHaveSemanticDiagnostics(received, expected) {
        const _expected = expected as TsVfs_toIncludeSemanticDiagnostic_param;
        const _mapped_expected: TsVfs_ToolingResult_getSemanticDiagnostics_SemanticDiagnostic_WithLines[] = _expected.map(value => {
            return {
                ...value,
                category: DiagnosticCategory[value.category],
            };
        });
        const { isNot, utils, } = this;

        if (!is_TsVfs_ToolingResult_getSemanticDiagnostics(received)) return {
            pass:    false,
            message: () => `${utils.stringify(received, void 0, { min: true, })} is${isNot ? "" : " not"} a result of "getSemanticDiagnostics()"\n`,
        };

        // TODO: this is why (:rework-flatten-processed-diag) might be nicer, also, line numbers are not obvious where they belong, currently, and consider returning substrings too
        /**
         * TODO: so, overall, future considerations:
         *  - flatten everything into a 1 dimensional array for easier assertions
         *  - parameterized markers, where the parameter is shown in the given result message: this would help to identify unwrapped messages and lines without line numbers
         *      - or, maybe, line markers are useless? I don't seem to use them a lot
         *  - include line numbers too
         *  - include substrings of what is squiggled
         *  - allow partial matching somehow (expect.anything() didn't work )
         */
        const flattenedMessages = received.queryResult.diagnostics.flatMap(diag => {
            const { lines, } = diag;
            return diag.messages.map(message => {
                return { ...message, lines, };
            });
        });

        const result = ((): { pass: true, } | { pass: false, errorMessage: string, } => {
            try {
                expect(flattenedMessages).to.have.deep.members(_mapped_expected);
                return { pass: true, };
            } catch (error) {
                if (error instanceof Error) return { pass: false, errorMessage: error.message, };
                return { pass: false, errorMessage: String(error), };
            }
        })();

        if (result.pass) return {
            pass:    result.pass,
            message: () => "",
        };
        return {
            pass:    result.pass,
            message: () =>
                `${result.errorMessage}\n\n` +
                `${utils.diff(flattenedMessages, _mapped_expected, { commonColor: (value) => chalk.gray(value), })}\n`
            ,
        };
    },
});

type TsVfs_toHaveCompletions_param = string[];

type DiagnosticCategoryKey<T extends DiagnosticCategory = DiagnosticCategory> = {
    [E in DiagnosticCategory]: {
        [DiagnosticCategory.Warning]:    "Warning",
        [DiagnosticCategory.Error]:      "Error",
        [DiagnosticCategory.Suggestion]: "Suggestion",
        [DiagnosticCategory.Message]:    "Message",
    }[E]
}[T];
type TsVfs_ToolingResult_getSemanticDiagnostics_SemanticDiagnostic_WithLines = Merge<
    TsVfs_ToolingResult_getSemanticDiagnostics_SemanticDiagnostic_UnwrappedDiagnosticMessageChain,
    {
        lines: number[],
    }
>;
type TsVfs_toIncludeSemanticDiagnostic_param = Array<
    OverrideProperties<
        TsVfs_ToolingResult_getSemanticDiagnostics_SemanticDiagnostic_WithLines,
        {
            category: DiagnosticCategoryKey,
        }
    >
>;

interface CustomMatchers<R = unknown> {
    toHaveCompletions:         (completions: TsVfs_toHaveCompletions_param) => R,
    toHaveSemanticDiagnostics: (diagnosticMatcher: TsVfs_toIncludeSemanticDiagnostic_param) => R,
}

declare module "vitest" {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Assertion<T = any> extends CustomMatchers<T> {}
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface AsymmetricMatchersContaining extends CustomMatchers {}
}
