import { expect } from "vitest";
import { is_TsVfs_ToolingResult_getCompletionsAtPosition, is_TsVfs_ToolingResult_getSemanticDiagnostics, type TsVfs_ToolingResult_getSemanticDiagnostics_SemanticDiagnostic_UnwrappedDiagnosticMessageChain } from "./ts-vfs/ts-vfs";
import chalk from "chalk";
import { DiagnosticCategory } from "typescript";
import type { OverrideProperties } from "type-fest";

// TODO: rewrite to chai plugin to allow detecting chaining, don't handle `this.isNot` until then - https://www.chaijs.com/guide/plugins/
expect.extend({
    toHaveCompletions(received, expected) {
        const _expected = expected as TsVfs_toHaveCompletions_param;
        const { isNot, utils, } = this;

        if (!is_TsVfs_ToolingResult_getCompletionsAtPosition(received)) return {
            pass:    false,
            message: () => `${utils.stringify(received, void 0, { min: true, theme: {  }, })} is${isNot ? "" : " not"} a result of "getCompletionsAtPosition()"\n`,
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
        const _mapped_expected: Partial<TsVfs_ToolingResult_getSemanticDiagnostics_SemanticDiagnostic_UnwrappedDiagnosticMessageChain>[] = _expected.map(value => {
            return {
                code:        (value.code === void 0) ? void 0 : value.code,
                messageText: (value.messageText === void 0) ? void 0 : value.messageText,
                category:    (value.category === void 0) ? void 0 : DiagnosticCategory[value.category],
            };
        });
        const { isNot, utils, } = this;

        if (!is_TsVfs_ToolingResult_getSemanticDiagnostics(received)) return {
            pass:    false,
            message: () => `${utils.stringify(received, void 0, { min: true, theme: {  }, })} is${isNot ? "" : " not"} a result of "getSemanticDiagnostics()"\n`,
        };

        // TODO: this is why (:rework-flatten-processed-diag) might be nicer
        const flattenedMessages = received.queryResult.diagnostics.flatMap(diag => diag.messages);

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
type TsVfs_toIncludeSemanticDiagnostic_param = Array<Partial<OverrideProperties<
    TsVfs_ToolingResult_getSemanticDiagnostics_SemanticDiagnostic_UnwrappedDiagnosticMessageChain,
    {
        category: DiagnosticCategoryKey,
    }
>>>;

interface CustomMatchers<R = unknown> {
    toHaveCompletions:         (completions: TsVfs_toHaveCompletions_param) => R,
    toHaveSemanticDiagnostics: (diagnosticMatcher: TsVfs_toIncludeSemanticDiagnostic_param) => R,
}

declare module "vitest" {
    interface Assertion<T = any> extends CustomMatchers<T> {}
    interface AsymmetricMatchersContaining extends CustomMatchers {}
}
