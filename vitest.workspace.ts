import { defineWorkspace } from "vitest/config";
import { vitestConfigWithAliasedTs } from "./vitest/utils/vitest-workspaces-shared";

/**
 * IMPORTANT: THIS FILE HAS DELIBERATE FORMATTING TO AID PROGRAMMATIC CHANGES VIA THE BUNDLED SCRIPT IN "./bin":
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
    vitestConfigWithAliasedTs(`5.5.0-beta`, {
        test: {},
    }),
    vitestConfigWithAliasedTs("5.4.5", {
        test: {},
    }),
]);
