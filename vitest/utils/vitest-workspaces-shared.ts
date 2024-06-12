import { mergeConfig, type UserWorkspaceConfig } from "vitest/config";
import chalk from "chalk";
import { ENV_TS_ALIASED_EXPECTED } from "../vitest";

type ts = typeof import("typescript");
export const PREFIX_TS_ALIAS = `typescript-`;

export function vitestWorkspaceConfigWithAliasedTs(
    expectedVersion: string,
    configToMerge?: UserWorkspaceConfig,
): UserWorkspaceConfig {
    const npmAlias_typescript = `${PREFIX_TS_ALIAS}${expectedVersion}` as const;

    const config_toMerge = configToMerge ?? {};
    const config_premade: UserWorkspaceConfig = {
        test: {
            name:        `typescript@${expectedVersion}`,
            root:        `./test`, // This is relative to the specific `vitest.config.ts` file this is used in
            globalSetup: [ // Paths are relative to process.cwd(), which should be the project root
                `./vitest/global-setup/gs-typescript-assert.ts`,
            ],
            setupFiles: [ // Paths are relative to process.cwd(), which should be the project root
                `./vitest/setup-files/sf-virtual-typescript.ts`,
            ],
            sequence: {
                hooks:      "list",
                setupFiles: "list",
            },
            typecheck: {
                enabled: true,
                only:    false,
            },
            env: {
                [ENV_TS_ALIASED_EXPECTED]: expectedVersion,
            },
        },
        resolve: {
            alias: {
                "typescript": npmAlias_typescript,
            },
        },
    };

    return mergeConfig(config_premade, config_toMerge);
}

export async function assertTypescriptVersion(params: {
    vitestProjectName: string,
    expectedVersion:   string,
    aliasedTypescript: ts,
}) {
    const { vitestProjectName, expectedVersion: ts_expectedVersion, aliasedTypescript: ts, } = params;
    const ts_actualVersion = ts.version;

    const msg_typescript = chalk.blueBright(`typescript`);
    const isAcceptedVersion: boolean = ts_expectedVersion === ts_actualVersion;
    const chalkActual = isAcceptedVersion ? chalk.greenBright : chalk.redBright;
    const resultIcon = isAcceptedVersion ? `✓` : `✗`;

    console.info(`|${vitestProjectName}| ${chalk.gray(`asserting [expected, actual] Vite-aliased ${msg_typescript} version:`)} [${ts_expectedVersion}, ${chalkActual(`${ts_actualVersion}`)}] ${chalkActual(resultIcon)}`);
    console.info();

    if (!isAcceptedVersion) throw new Error("Test is not using the expected typescript version!");
}
