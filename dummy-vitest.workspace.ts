import { defineWorkspace } from "vitest/config";
import { vitestConfigWithAliasedTs } from "./vitest/utils/vitest-workspaces-shared";

/**
 * IMPORTANT: THIS FILE HAS DELIBERATE FORMATTING TO AID PROGRAMMATIC CHANGES VIA THE BUNDLED SCRIPT IN ./bin:
 *  - default export has to be `defineWorkspace`
 *      - identifier has to be "defineWorkspace", no rename is allowed
 *      - saving result of `defineWorkspace` to a variable, and default exporting that, is not allowed
 *  - versions are only picked up inside `defineWorkspace`'s array if they are inside `vitestConfigWithAliasedTs`
 *      - identifier has to be "vitestConfigWithAliasedTs", no rename is allowed
 *  - first parameter of "vitestConfigWithAliasedTs" has to be a raw string literal
 *      - not computed
 *      - no non-raw template strings are allowed
 */




export default defineWorkspace([
    vitestConfigWithAliasedTs(`5.4.5`, {
        test: {
        },
    }),
    vitestConfigWithAliasedTs(`5.5.0-beta`, {
        test: {
        },
    }),
]);


/**
 * TODO:
 *  - preserve empty lines https://stackoverflow.com/questions/51353988/typescript-ast-transformation-removes-all-blank-lines
 *
 * PREREQUISITE:
 *  - ts-fs with similar interface as ts-vfs
 *
 * INTERPRETATION:
 *
 * - identify default export
 * - verify default export is alias of defineWorkspace
 * - verify first param as array
 * - for each array element
 *      - identify first and second param
 *      - collect first param as expected version
 * - if no expected version found yet, append to array another node
 */
