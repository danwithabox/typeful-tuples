import type { GlobalSetupContext } from "vitest/node";
import ts from "typescript";
import { ENV_TS_ALIASED_EXPECTED } from "../vitest";
import { assertTypescriptVersion } from "../utils/vitest-workspaces-shared";

export default async function ({ config, provide, }: GlobalSetupContext) {
    const typescriptAliasExpectedVersion = config.env[ENV_TS_ALIASED_EXPECTED];

    assertTypescriptVersion(typescriptAliasExpectedVersion, ts);

    provide("typescriptAliasExpectedVersion", typescriptAliasExpectedVersion);

    return async () => {};
}

declare module "vitest" {
    export interface ProvidedContext {
        typescriptAliasExpectedVersion: string,
    }
}
