// @ts-check
import { defineFlatConfig, rules_config_typescript, flatConfigFilterRules, flatConfigDefineRules, entreeConfigTypeScript } from "@danwithabox/eslint-entree";

const typescript = flatConfigFilterRules(
    flatConfigDefineRules({
        ...rules_config_typescript(),
    }),
    {
        exclude: [],
    },
);

export default defineFlatConfig([
    ...entreeConfigTypeScript({ typescript, }),
]);
