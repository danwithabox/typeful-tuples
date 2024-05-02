import type { Plugin, UserConfig } from "vite";
import chalk from "chalk";

export type SemverString = `${number}.${number}.${number}`;
export type ExpectedTsVersionString = SemverString | `ignore_version`;
/** Use with `mergeConfig`, otherwise test.excludes*/
export function vitestConfigBase_forSpecificTsVersionWorkspace(
    expectedVersion: ExpectedTsVersionString,
    /**
     * What you probably need to put here:
     * ```ts
     * async () => (await import("typescript")).default.version
     * ```
     *
     * This is necessary, because ESM (dynamic) imports are evaluated relative to the calling module,
     * so the calling `vitest.config.ts` has to import `typescript`.
     *
     * It cannot be delegated to the internals of this function, because this file is placed in the project root,
     * and would resolve to the root `typescript` package, not the workspace's.
     */
    getTsVersion: () => Promise<string>,
): UserConfig {
    return {
        plugins: [plugin_typescriptVersionAssert(expectedVersion, getTsVersion)],
        test:    {
            root: `../source`, // This is relative to the specific `vitest.config.ts` file this is used in
        },
    };
}

function plugin_typescriptVersionAssert(expectedVersion: ExpectedTsVersionString, getTsVersion: () => Promise<string>): Plugin {
    const name = "TypeScript Version Assert";
    return {
        name,
        async buildStart(options) {
            const msg_typescript = chalk.blueBright(`typescript`);

            console.info();
            console.info(chalk.bold.gray(`Plugin: ${name}`));
            console.info(chalk.gray     (`        Checks for correctly pinned ${msg_typescript} version.`));
            console.info();

            const version = await getTsVersion();

            if (expectedVersion === `ignore_version`) {
                console.info(`${chalk.cyanBright(`Actual version is `)}${version}${chalk.cyanBright(`, with no expected ${msg_typescript} version, skipping check ⏩`)}`);
                return;
            }

            const isAcceptedVersion: boolean = expectedVersion === version;
            const chalkActual = isAcceptedVersion ? chalk.greenBright : chalk.redBright;

            const _msg_expected = `${chalk.gray(`Expected `)}${msg_typescript}${chalk.gray(` version: `)}`;
            const _msg_actual =  `${chalkActual(`  Actual `)}${msg_typescript}${chalkActual(` version: `)}`;

            const msg_expected = `${_msg_expected}${expectedVersion}`;
            const msg_actual = `${_msg_actual}${version}`;

            console.info(msg_expected);
            console.info(msg_actual);
            console.info();
            console.info(chalkActual(isAcceptedVersion ? `Versions match ✅ ` : `Version mismatch ❌ `));

            if (!isAcceptedVersion) throw new Error("Test is not using the expected typescript version!");
        },
    };
}
