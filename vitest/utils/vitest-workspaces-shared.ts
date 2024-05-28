import { mergeConfig, type Plugin, type UserConfig } from "vite";
import chalk from "chalk";
import type { LiteralUnion } from "type-fest";
import { ENV_TS_ALIASED_EXPECTED } from "../vitest";

type ts = typeof import("typescript");

/**
 * TODO: rework generation
 * - specific typescript versions not needed in workspaces
 * - generate typescript version aliases in root workspace
 */

export type ExpectedTsVersionString = LiteralUnion<`ignore_version`, string>;
export function vitestConfigBase_forSpecificTsVersionWorkspace(
    expectedVersion: ExpectedTsVersionString,
): UserConfig {
    // const workspaceModulePath_typescript = path.join(process.cwd(), `/node_modules/typescript`);
    // const getWorkspaceLocalTypescript = async () => {
    //     const ts: ts = (await import(url.pathToFileURL(workspaceModulePath_typescript).toString())).default;
    //     return ts;
    // };
    const npmAlias_typescript = `typescript-${expectedVersion}` as const;
    const getWorkspaceLocalTypescript = async () => {
        const ts: ts = (await import(npmAlias_typescript)).default;
        return ts;
    };

    //npm install typescript-5.5.0-beta@npm:typescript@5.5.0-beta --save-dev --save-exact

    return {
        plugins: [plugin_typescriptVersionAssert(expectedVersion, getWorkspaceLocalTypescript)],
        test:    {
            root:     `../source`, // This is relative to the specific `vitest.config.ts` file this is used in
            sequence: {
                hooks: "list",
            },
        },
        resolve: {
            alias: {
                // "typescript": workspaceModulePath_typescript,
                "typescript": npmAlias_typescript,
            },
        },
    };
}
export function vitestConfigWithAliasedTs(
    expectedVersion: string,
    configToMerge?: UserConfig,
): UserConfig {
    const npmAlias_typescript = `typescript-${expectedVersion}` as const;

    const config_toMerge = configToMerge ?? {};
    const config_premade: UserConfig = {
        test: {
            name:        `Vitest Workspace for typescript@${expectedVersion}`,
            root:        `./workspaces/source`, // This is relative to the specific `vitest.config.ts` file this is used in
            globalSetup: [
                `../../vitest/global-setup/gs-typescript-assert.ts`,
            ],
            setupFiles: [
                `../../vitest/setup-files/sf-typescript-assert.ts`,
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

function plugin_typescriptVersionAssert(expectedVersion: ExpectedTsVersionString, getWorkspaceLocalTypescript: () => Promise<ts>): Plugin {
    const name = "TypeScript Version Assert";
    return {
        name,
        async buildStart(options) {
            await assertTypescriptVersion(expectedVersion, getWorkspaceLocalTypescript);
        },
    };
}

export async function assertTypescriptVersion(
    expectedVersion: ExpectedTsVersionString,
    getWorkspaceLocalTypescript: () => Promise<ts>,
) {
    const name = "TypeScript Version Assert";

    const msg_typescript = chalk.blueBright(`typescript`);

    console.info();
    console.info(chalk.bold.gray(`Plugin: ${name}`));
    console.info(chalk.gray     (`        Checks for correctly pinned ${msg_typescript} version.`));
    console.info();

    const ts = await getWorkspaceLocalTypescript();

    if (expectedVersion === `ignore_version`) {
        console.info(`${chalk.cyanBright(`Actual version is `)}${ts.version}${chalk.cyanBright(`, with no expected ${msg_typescript} version, skipping check ⏩`)}`);
        return;
    }

    const isAcceptedVersion: boolean = expectedVersion === ts.version;
    const chalkActual = isAcceptedVersion ? chalk.greenBright : chalk.redBright;

    const _msg_expected = `${chalk.gray(`Expected `)}${msg_typescript}${chalk.gray(` version: `)}`;
    const _msg_actual =  `${chalkActual(`  Actual `)}${msg_typescript}${chalkActual(` version: `)}`;

    const msg_expected = `${_msg_expected}${expectedVersion}`;
    const msg_actual = `${_msg_actual}${ts.version}`;

    console.info(msg_expected);
    console.info(msg_actual);
    console.info();
    console.info(chalkActual(isAcceptedVersion ? `Versions match ✅ ` : `Version mismatch ❌ `));

    if (!isAcceptedVersion) throw new Error("Test is not using the expected typescript version!");
}
