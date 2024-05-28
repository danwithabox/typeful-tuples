import { mergeConfig, type UserConfig } from "vite";
import chalk from "chalk";
import { ENV_TS_ALIASED_EXPECTED } from "../vitest";

type ts = typeof import("typescript");

/**
 * TODO: rework generation
 * - generate typescript version aliases in root workspace
 */

export function vitestConfigWithAliasedTs(
    expectedVersion: string,
    configToMerge?: UserConfig,
): UserConfig {
    const npmAlias_typescript = `typescript-${expectedVersion}` as const;

    const config_toMerge = configToMerge ?? {};
    const config_premade: UserConfig = {
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
                // enabled: true,
                // only:    false,
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

export async function assertTypescriptVersion(
    expectedVersion: string,
    aliasedTypescript: ts,
) {
    const ts_expectedVersion = expectedVersion;
    const ts = aliasedTypescript;

    const name = "TypeScript Version Assert";

    const msg_typescript = chalk.blueBright(`typescript`);

    console.info(chalk.bold.gray(`${name}`));
    console.info(chalk.gray     (`Checks whether the Vite-aliased ${msg_typescript} version used by the tests is the expected and correctly pinned version.`));
    console.info();

    const isAcceptedVersion: boolean = ts_expectedVersion === ts.version;
    const chalkActual = isAcceptedVersion ? chalk.greenBright : chalk.redBright;

    const _msg_expected = `${chalk.gray(`Expected `)}${msg_typescript}${chalk.gray (` version: `)}`;
    const _msg_actual =  `${chalkActual(`  Actual `)}${msg_typescript}${chalkActual(` version: `)}`;

    const msg_expected = `${_msg_expected}${ts_expectedVersion}`;
    const msg_actual = `${_msg_actual}${ts.version}`;

    console.info(msg_expected);
    console.info(msg_actual);
    console.info();
    console.info(chalkActual(isAcceptedVersion ? `Versions match ✅ ` : `Version mismatch ❌ `));
    console.info();

    if (!isAcceptedVersion) throw new Error("Test is not using the expected typescript version!");
}
