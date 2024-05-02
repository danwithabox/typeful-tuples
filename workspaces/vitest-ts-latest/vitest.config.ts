import { defineConfig, mergeConfig } from "vitest/config";
import { vitestConfigBase_forSpecificTsVersionWorkspace } from "../vitest-workspaces-shared.js";

export default mergeConfig(
    vitestConfigBase_forSpecificTsVersionWorkspace(`ignore_version`, async () => (await import("typescript")).default.version),
    defineConfig({
        test: {
        },
    }),
);
