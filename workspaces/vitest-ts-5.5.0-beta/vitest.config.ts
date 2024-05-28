import { defineConfig, mergeConfig } from "vitest/config";
import { vitestConfigBase_forSpecificTsVersionWorkspace } from "../../vitest/utils/vitest-workspaces-shared.js";

export default mergeConfig(
    vitestConfigBase_forSpecificTsVersionWorkspace(`5.5.0-beta`),
    defineConfig({
        test: {
        },
    }),
);
