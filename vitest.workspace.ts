import { defineWorkspace, defineConfig, mergeConfig } from "vitest/config";
import { NEXT_vitestConfigBase_forSpecificTsVersionWorkspace } from "./workspaces/vitest-workspaces-shared";

export default defineWorkspace([
    mergeConfig(NEXT_vitestConfigBase_forSpecificTsVersionWorkspace(`5.4.5`), defineConfig({
        test: {
        },
    })),
    mergeConfig(NEXT_vitestConfigBase_forSpecificTsVersionWorkspace(`5.5.0-beta`), defineConfig({
        test: {
        },
    })),
]);
