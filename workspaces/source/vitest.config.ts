import { defineConfig, mergeConfig } from "vitest/config";
import { vitestConfigBase_forSpecificTsVersionWorkspace } from "../../vitest-shared.js";

export default mergeConfig(
    vitestConfigBase_forSpecificTsVersionWorkspace(`ignore_version`),
    defineConfig({
        test: {
        },
    }),
);


