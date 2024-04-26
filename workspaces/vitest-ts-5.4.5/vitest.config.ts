import { defineConfig, mergeConfig } from "vitest/config";
import { vitestConfigBase_forSpecificTsVersionWorkspace } from "../../vitest-shared.js";

export default mergeConfig(
    vitestConfigBase_forSpecificTsVersionWorkspace(`5.4.5`),
    defineConfig({
        test: {
        },
    }),
);


