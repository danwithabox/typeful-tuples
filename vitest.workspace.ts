import { defineWorkspace } from "vitest/config";
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
