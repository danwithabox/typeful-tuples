// @ts-check
import { /* defineFlatConfig,  */entreeRules/* , gitignore */ } from "@danwithabox/eslint-entree";
import { defineFlatConfig } from "eslint-define-config";
import gitignore from "eslint-config-flat-gitignore";
import { config_typescript } from "./eslint/my-config-typescript.js";

export default defineFlatConfig([
    gitignore(),
    config_typescript(entreeRules.typeScript()),
]);
