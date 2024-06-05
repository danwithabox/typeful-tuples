#!/usr/bin/env -S node --import=tsx/esm

import pkg from "../../package.json";
import { dirname, filename, join } from "desm";
import fs from "fs-extra";
import { globSync } from "glob";
import { program } from "@commander-js/extra-typings";
import { execa } from "execa";
import ora, { type Ora } from "ora";
import editorconfig from "editorconfig";
import type { Promisable, OverrideProperties } from "type-fest";
import * as inquirer from "@inquirer/prompts";
import { useVitestWorkspaceAliasHandler, type TransformRecipe_AliasedTsVersions } from "./vitest-alias-update";
import chalk from "chalk";

const __dirname = dirname(import.meta.url);
const __filename = filename(import.meta.url);
const __join = (...str: string[]) => join(import.meta.url, ...str);

const PATH_DIR_TEMP = `./gen-vitest-temp/` as const;
const PATH_DIR_ROOT = `../../` as const;
const PATH_FILE_PACKAGE_JSON = `package.json` as const;
const PATH_FILE_VITEST_WORKSPACE_TS = `vitest.workspace.ts` as const;

/**
 * TODO: rework generation
 * ! deferring bigger ideas until experience with github actions, for now only allow easy scaffolding and removal
 *
 *  npm
 *      tags
 *          latest
 *          beta
 *          next
 */

await async function main() {
    const params = program
        .name("npx gen-vitest")
        .description(`Manages vitest.workspace.ts to run Vitest with multiple specified pinned versions of typescript.`)
        .showHelpAfterError()
        .option(`--keep-temp`, `Keeps the "${PATH_DIR_TEMP}" folder (on error AND success). Default: false.`)
        .option(`--no-internet`, `Disables dependence on access to npm servers. Note that this also makes adding versions unsafe. Default: false.`)
        .parse()
        .opts()
    ;
    program.outputHelp();
    console.info();
    const { keepTemp = false, internet, } = params;

    const { fetchAvailableTsVersions, isTsVersionAvailableOnNpm, } = useNpmViewedTsVersions({ noInternet: !internet, });

    const _print_vitestWorkspaceTsLink = `"${chalk.white.underline(PATH_FILE_VITEST_WORKSPACE_TS)}"`;

    const spinner = ora();
    const { asyncOperation, } = useAsyncOperation(spinner);

    const projectRootPath = join(import.meta.url, PATH_DIR_ROOT);

    const Inquirer_Selection_Operations_Choices = [`add`, `remove`, `update`] as const;
    type Inquirer_Selection_Operations_Choices = (typeof Inquirer_Selection_Operations_Choices)[number];

    const Inquirer_Selection_Menu_Choices = [`edit changes`, `exit`, `run`] as const;
    type Inquirer_Selection_Menu_Choices = (typeof Inquirer_Selection_Menu_Choices)[number];

    const recipeCache: TransformRecipe_AliasedTsVersions = {
        remove: [],
        add:    [],
        update: [],
    };
    function isVersionMaybeIncludedInRecipeCache(tsVersion: string): "add" | "remove" | "update" | undefined {
        const maybeIncludedInQueuedChanges = ([
            [recipeCache.add, "add"],
            [recipeCache.remove, "remove"],
            [recipeCache.update.map(_ => _.to), "update"],
        ] as const).flatMap(([arr, queueType]) => arr.includes(tsVersion) ? [queueType] : []).at(0);
        return maybeIncludedInQueuedChanges;
    }
    type RecipeListFormatElement = |(
        | { type: "add",    text: string, value: TransformRecipe_AliasedTsVersions["add"][number], originalIndex: number, arrayRef: TransformRecipe_AliasedTsVersions["add"], }
        | { type: "remove", text: string, value: TransformRecipe_AliasedTsVersions["remove"][number], originalIndex: number, arrayRef: TransformRecipe_AliasedTsVersions["remove"], }
        | { type: "update", text: string, value: TransformRecipe_AliasedTsVersions["update"][number], originalIndex: number, arrayRef: TransformRecipe_AliasedTsVersions["update"], }
    );
    function recipeListFormat(): RecipeListFormatElement[] {
        const lines: RecipeListFormatElement[] = [];
        const { add, remove, update, } = recipeCache;
        if (!add.length && !remove.length && !update.length) return [];

        for (const [originalIndex, _r_add] of recipeCache.add.entries()) {
            const text = `${chalk.green.bold(` + `)}${chalk.greenBright(_r_add)}`;
            lines.push({ type: "add", text, value: _r_add, originalIndex, arrayRef: recipeCache.add, });
        }
        for (const [originalIndex, _r_remove] of recipeCache.remove.entries()) {
            const text = `${chalk.red.bold(` - `)}${chalk.redBright(_r_remove)}`;
            lines.push({ type: "remove", text, value: _r_remove, originalIndex, arrayRef: recipeCache.remove, });
        }
        for (const [originalIndex, { from, to, }] of recipeCache.update.entries()) {
            const text = `${chalk.blue(` ↷ `)}${chalk.blueBright(`${from} → ${to}`)}`;
            lines.push({ type: "update", text, value: { from, to, }, originalIndex, arrayRef: recipeCache.update, });
        }
        return lines;
    }

    try {
        await asyncOperation(`Creating temp folder "${PATH_DIR_TEMP}" to aid transactional file changes`, async ({ succeed, fail, }) => {
            try {
                safeRmdir();
                await fs.mkdir(join(import.meta.url, PATH_DIR_TEMP));
                await fs.copy(
                    join(import.meta.url, PATH_DIR_ROOT, `./${PATH_FILE_VITEST_WORKSPACE_TS}`),
                    join(import.meta.url, PATH_DIR_TEMP, `./${PATH_FILE_VITEST_WORKSPACE_TS}`),
                );
                await fs.copy(
                    join(import.meta.url, PATH_DIR_ROOT, `./${PATH_FILE_PACKAGE_JSON}`),
                    join(import.meta.url, PATH_DIR_TEMP, `./${PATH_FILE_PACKAGE_JSON}`),
                );
                succeed();
            } catch (error) {
                const msg = error instanceof Error ? error.message : error;
                fail((text) => `${text}: couldn't create folder "${PATH_DIR_TEMP}": ${msg}`);
            }
        });
        if (internet) await asyncOperation(`Fetching available typescript versions from npm`, async ({ succeed, fail, }) => {
            try {
                await fetchAvailableTsVersions();
                succeed();
            } catch (error) {
                const msg = error instanceof Error ? error.message : error;
                const baseMsg = `Failed to fetch typescript versions from npm.\nIf this is a network issue, passing "--no-internet" could be used as a workaround, but this will disable version verification and make operations unsafe.`;
                fail((text) => `${text}: ${baseMsg}\n\n${msg}`);
            }
        });

        const vitestWorkspacefilePath = join(import.meta.url, PATH_DIR_TEMP, `./${PATH_FILE_VITEST_WORKSPACE_TS}`);
        const {
            astOperation_parseVersions,
            transformVitestWorkspaceWithRecipe,
        } = useVitestWorkspaceAliasHandler({ projectRootPath, vitestWorkspacefilePath, });

        const _listVersions = astOperation_parseVersions();
        function versionsPrint() {
            console.info(chalk.gray(`Versions found in ${_print_vitestWorkspaceTsLink}`));
            for (const version of _listVersions) {
                console.info(`${chalk.gray(` · `)}${version}`);
            }
            console.info();
        }

        console.info();

        type Inquirer_Menu_Choices = Inquirer_Selection_Operations_Choices | Inquirer_Selection_Menu_Choices;
        const menuState = {
            inq_selection_main: void 0 as Inquirer_Menu_Choices | undefined,
        };

        while (!(
            (menuState.inq_selection_main === "run") ||
            (menuState.inq_selection_main === "exit")
        )) {
            const isRecipeEmpty: boolean = [
                recipeCache.add,
                recipeCache.remove,
                recipeCache.update,
            ].every(({ length, }) => length === 0);

            console.info(chalk.gray(`MENU`));
            console.info(new inquirer.Separator().separator);

            versionsPrint();
            if (!isRecipeEmpty) console.info(chalk.gray("Chosen changes queued to run:"));
            for (const line of recipeListFormat()) {
                console.info(line.text);
            }
            if (!isRecipeEmpty) console.info();
            /**
             * TODO:
             *  - preview and run
             *      - load package.json from temp folder
             *      - commit to temp file, offer preview, also show versions, which can be used to update npm too
             */
            menuState.inq_selection_main = await inquirer.select<Inquirer_Selection_Operations_Choices | Inquirer_Selection_Menu_Choices>({
                message: `Choose an action:`,
                choices: [
                    { value: `add`, },
                    { value: `remove`, },
                    { value: `update`, },
                    ...(isRecipeEmpty ? [] : [
                        new inquirer.Separator,
                        { value: `edit changes`, },
                    ] as const),
                    new inquirer.Separator,
                    { value: `run`, disabled: isRecipeEmpty, },
                    { value: `exit`, },
                ] as const,
                loop:     false,
                pageSize: 10,
            }, { clearPromptOnDone: false, });

            function validateAdd(tsVersion: string) {
                if (tsVersion === "") return true;
                if (_listVersions.includes(tsVersion)) {
                    return `typescript@${tsVersion} is already in ${_print_vitestWorkspaceTsLink}`;
                }
                const maybeIncludedInQueuedChanges = isVersionMaybeIncludedInRecipeCache(tsVersion);
                if (maybeIncludedInQueuedChanges) {
                    return `typescript@${tsVersion} is already in queued changes (${maybeIncludedInQueuedChanges})`;
                }

                return isTsVersionAvailableOnNpm(tsVersion);
            }

            switch (menuState.inq_selection_main) {
                case "remove": {
                    const inquirer_checkbox = inquirer.checkbox<string>;
                    type _Choices = Parameters<(typeof inquirer_checkbox)>[0]["choices"][number];

                    const selection = await inquirer_checkbox({
                        message: `Select which version(s) to remove from ${PATH_FILE_VITEST_WORKSPACE_TS}`,
                        choices: _listVersions.map((version): _Choices => {
                            const disabled: boolean = recipeCache.remove.includes(version);
                            return {
                                name:  disabled ? `${version} (already in queued changes)` : version,
                                value: version,
                                disabled,
                            };
                        }),
                    });

                    for (const version of selection) {
                        recipeCache.remove.push(version);
                    }
                    console.info();
                    break;
                }
                case "add": {
                    const inq_input_version = await inquirer.input({
                        message: "Specify a version to add, or submit blank to go back:",
                        validate(tsVersion) {
                            return validateAdd(tsVersion);
                        },
                    });
                    if (inq_input_version !== "") {
                        recipeCache.add.push(inq_input_version);
                    }
                    console.info();
                    break;
                }
                case "update": {
                    const inquirer_select = inquirer.select<string>;
                    type _Choices = Parameters<(typeof inquirer_select)>[0]["choices"][number];

                    const selection = await inquirer_select({
                        message: `Select which version to change in ${PATH_FILE_VITEST_WORKSPACE_TS}, keeping related config object intact`,
                        choices: [
                            ..._listVersions.map((versionToUpdate): _Choices => {
                                const disabled: boolean = recipeCache.update.some(({ from, }) => from === versionToUpdate);
                                return {
                                    name:  disabled ? `${versionToUpdate} (already in queued changes)` : versionToUpdate,
                                    value: versionToUpdate,
                                    disabled,
                                };
                            }),
                            new inquirer.Separator,
                            {
                                name:  "Back",
                                value: "",
                            },
                        ],
                    });

                    if (selection !== "") {
                        const inq_input_version = await inquirer.input({
                            message: `Specify a version to add, or submit blank to go back:`,
                            validate(tsVersion) {
                                return validateAdd(tsVersion);
                            },
                        });
                        if (inq_input_version !== "") {
                            recipeCache.update.push({ from: selection, to: inq_input_version, });
                        }
                    }

                    console.info();
                    break;
                }
                case "edit changes": {
                    const inquirer_checkbox = inquirer.checkbox<RecipeListFormatElement>;
                    type _Choices = Parameters<(typeof inquirer_checkbox)>[0]["choices"][number];

                    const selection = await inquirer_checkbox({
                        message: "Select which changes to remove from the queue:",
                        choices: recipeListFormat().map((line): _Choices => ({
                            name:  line.text,
                            value: line,
                        })),
                    });

                    for (const element of selection) {
                        const { originalIndex, arrayRef, } = element; // TODO: this doesn't work when removing a few at once
                        arrayRef.splice(originalIndex, 1);
                    }
                    console.info();
                    break;
                }
                default: break;
            }
        }

        if (menuState.inq_selection_main === "exit") return;

        await transformVitestWorkspaceWithRecipe(recipeCache);

        const { indent_size, } = await editorconfig.parse(PATH_DIR_TEMP);

        await asyncOperation(`Updating temp "package.json" with aliased typescript packages`, async ({ succeed, fail, }) => {
            const path_temp_package_json = __join(PATH_DIR_TEMP, PATH_FILE_PACKAGE_JSON);

            const packageJson = (() => {
                const raw = fs.readFileSync(path_temp_package_json, "utf-8");
                const packageJson = JSON.parse(raw) as OverrideProperties<typeof pkg, { devDependencies: Record<string, string>, }>;
                return packageJson;
            })();

            packageJson.devDependencies;

            const isWorkspaceAlreadyPresent = pkg.workspaces.includes(_workspace);
            if (isWorkspaceAlreadyPresent) fail((text) => `${text}: workspace already exists`);

            const workspaces = [_workspace, ...pkg.workspaces].sort();
            const _pkg = { ...pkg, workspaces, };

            try {
                await fs.writeFile(path_temp_package_json, JSON.stringify(_pkg, null, indent_size));
            } catch (error) {
                const message = error instanceof Error ? error.message : error;
                fail((text) => `${text}: ${message}`);
            }

            succeed();
        });

        await asyncOperation(`Copying generated files from "${PATH_DIR_TEMP}" to project`, async ({ succeed, fail, }) => {
            try {
                // await fs.copy(__join(PATH_DIR_TEMP), __join(PATH_DIR_ROOT));
            } catch (error) {
                const message = error instanceof Error ? error.message : error;
                fail((text) => `${text}: ${message}`);
            }

            succeed();
        });

        // await asyncOperation(`Running npm install to integrate new workspace "${NPM_WORKSPACE_NEW}"`, async ({ succeed, fail, pause, resume, }) => {
        //     try {
        //         pause();
        //         const proc = execa(`npm install`);
        //         proc.pipeStdout?.(process.stdout);
        //         proc.pipeStderr?.(process.stderr);
        //         await proc;
        //         resume();
        //     } catch (error) {
        //         const message = error instanceof Error ? error.message : error;
        //         fail((text) => `${text}: ${message}`);
        //     }

        //     succeed();
        // });

        console.info();
        spinner.succeed(`Generation done!`);
        spinner.info(`Run "npm run test" from the project root to test against every aliased TS version, including the newly generated one!`);
    } catch (error) {
        console.info();
        spinner.warn(`Generating failed`);
        console.error(error);
    } finally {
        console.info();
        if (keepTemp) spinner.info(`Option "--keep-temp": temp folder "${PATH_DIR_TEMP}" will be kept.`);
        else {
            spinner.info(`Removing temp folder "${PATH_DIR_TEMP}". Pass "--keep-temp" to keep it.`);
            try {
                safeRmdir();
            } catch (error) {
                console.error(error);
            }
        }
        process.exit(1);
    }

}();

function useNpmViewedTsVersions(opts?: { noInternet?: boolean, }) {
    const { noInternet = false, } = opts ?? {};

    const versions = [] as string[];
    async function fetchAvailableTsVersions() {
        try {
            const { stdout: res, } = await execa(`npm view typescript versions --json`);
            const parsed = JSON.parse(res);
            if (Array.isArray(parsed)) {
                if (parsed.every((element): element is string => typeof element === "string")) {
                    versions.push(...parsed);
                } else {
                    throw new Error(`[useNpmViewedTsVersions] "npm view" response was an array, but not an array of strings`);
                }
            } else {
                throw new Error(`[useNpmViewedTsVersions] "npm view" response was not an array`);
            }
        } catch (error) {
            throw error;
        }
    }

    function isTsVersionAvailableOnNpm(tsVersion: string): true | string {
        if (noInternet) return true;

        if (versions.includes(tsVersion)) return true;
        else return `typescript@${tsVersion} is not a specific version that is available on npm!`;
    }

    return {
        fetchAvailableTsVersions,
        isTsVersionAvailableOnNpm,
        getVersions() { return Object.freeze([...versions]); },
    };
}

/** Safe deletions without using the equivalent of `rm -rf`. Will error due to non-empty directory, if an unknown file is present in the temp dir. */
function safeRmdir() {
    /** Glob relative to `__dirname` (`"/bin/gen-vitest/gen-vitest-temp"`) */
    const globAtTempDirToAbsolute = (pattern: string | string[]) => globSync(pattern, { cwd: __join(PATH_DIR_TEMP), })
        .map((globPath) => __join(PATH_DIR_TEMP, globPath))
    ;
    try {
        const globs = [
            PATH_FILE_PACKAGE_JSON,
            PATH_FILE_VITEST_WORKSPACE_TS,
        ];
        const pathsToRemove = globAtTempDirToAbsolute(globs).sort((a, b) => b.length - a.length);

        for (const path of pathsToRemove) fs.statSync(path).isDirectory() ? fs.rmdirSync(path) : fs.rmSync(path);

        if (fs.existsSync(__join(PATH_DIR_TEMP))) fs.rmdirSync(__join(PATH_DIR_TEMP));
    } catch (error) {
        throw error;
    }
}

function useAsyncOperation(ora: Ora) {
    async function asyncOperation<R>(
        text: string,
        operationFn: (messageFns: {
            succeed: (message?: string) => void,
            fail:    (message: string | ((text: string) => string)) => void,
            pause:   () => void,
            resume:  () => void,
        }) => Promisable<R>,
    ) {
        ora.start(text);
        const result = await operationFn({
            succeed(message) {
                const _message: string = message ?? text;
                ora.succeed(_message);
            },
            fail(message) {
                const _message: string = typeof message === "function" ? message(text) : message;
                ora.fail(_message);
                throw new Error(_message);
            },
            pause() {
                ora.stopAndPersist();
            },
            resume() {
                ora.start(text);
            },
        });
        ora.stop();
        return result;
    }

    return {
        asyncOperation,
    };
}
