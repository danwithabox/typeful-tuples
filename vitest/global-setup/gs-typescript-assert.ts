import type { GlobalSetupContext } from "vitest/node";
import ts from "typescript";
import { ENV_TS_ALIASED_EXPECTED } from "../vitest";
import { assertTypescriptVersion } from "../utils/vitest-workspaces-shared";

export default async function ({ config, provide, }: GlobalSetupContext) {
    const typescriptAliasExpectedVersion = config.env[ENV_TS_ALIASED_EXPECTED];

    if (!typescriptAliasExpectedVersion) throw new Error(`Env var missing: ${ENV_TS_ALIASED_EXPECTED}`);

    assertTypescriptVersion({
        vitestProjectName: config.name,
        expectedVersion:   typescriptAliasExpectedVersion,
        aliasedTypescript: ts,
    });

    provide("vitestProjectName", config.name);
    provide("typescriptAliasExpectedVersion", typescriptAliasExpectedVersion);

    return async () => {};
}

declare module "vitest" {
    export interface ProvidedContext {
        vitestProjectName:              string,
        typescriptAliasExpectedVersion: string,
    }
}
