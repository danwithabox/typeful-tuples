import { defineWorkspace } from "vitest/config";
import { defineWorkspace as defWspace } from "vitest/config";
import { vitestConfigWithAliasedTs } from "./vitest/utils/vitest-workspaces-shared";





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
