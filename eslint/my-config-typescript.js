//@ts-check
/// <reference types="@stylistic/eslint-plugin/define-config-support" />
import { defineFlatConfig } from "eslint-define-config";
import plugin_stylistic from "@stylistic/eslint-plugin";
import typescript_eslint from "typescript-eslint";

/**
 * Provides the needed plugin and parser config.
 * 
 * @template { Partial<import("eslint-define-config").Rules> } T
 * @param { T } rules
 */
function config_typescript(rules) {
    const GLOB_SRC = "**/*.?([cm])[jt]s";
    const flatConfig_typescript = defineFlatConfig({
        files:   [GLOB_SRC],
        plugins: {
            /** @type { import("@stylistic/eslint-plugin/define-config-support") } */
            "@stylistic":         plugin_stylistic,
            /** @type { any } */
            "@typescript-eslint": typescript_eslint.plugin,
        },
        languageOptions: {
            parser:        typescript_eslint.parser,
            parserOptions: {
                sourceType: "module",
            },
        },
        rules,
    });
    return flatConfig_typescript;
}

export {
    config_typescript,
};
