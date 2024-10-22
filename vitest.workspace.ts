import { defineWorkspace } from "vitest/config";
import { vitestWorkspaceConfigWithAliasedTs } from "./vitest/utils/vitest-workspaces-shared";

/**
 * IMPORTANT: THIS FILE HAS DELIBERATE FORMATTING TO AID PROGRAMMATIC CHANGES VIA THE BUNDLED SCRIPT IN "./bin":
 *  - default export has to be `defineWorkspace`
 *      - identifier has to be "defineWorkspace", no rename is allowed
 *      - saving result of `defineWorkspace` to a variable, and default exporting that, is not allowed
 *  - versions are only picked up inside `defineWorkspace`'s array if they are inside `vitestWorkspaceConfigWithAliasedTs`
 *      - identifier has to be "vitestWorkspaceConfigWithAliasedTs", no rename is allowed
 *  - first parameter of "vitestWorkspaceConfigWithAliasedTs" has to be a raw string literal
 *      - not computed
 *      - no non-raw template strings are allowed, raw template strings (e.g. simply swapping quotes (' or ") to backticks (`) is fine)
 */

export default defineWorkspace([
    vitestWorkspaceConfigWithAliasedTs("5.6.2"),
    vitestWorkspaceConfigWithAliasedTs("5.5.2"),
    vitestWorkspaceConfigWithAliasedTs("5.4.2"),
]);
