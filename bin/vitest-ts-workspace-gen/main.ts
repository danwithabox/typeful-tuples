#!/usr/bin/env -S node --import=tsx/esm

import type pkg from "../../package.json";
import { join } from "desm";
import fs from "fs-extra";
import { glob } from "glob";
import { program } from "@commander-js/extra-typings";
import { execa } from "execa";
import ora from "ora";
import editorconfig from "editorconfig";
import type { OverrideProperties } from "type-fest";
import * as inquirer from "@inquirer/prompts";
import { useVitestWorkspaceAliasHandler, type TransformRecipe_AliasedTsVersions } from "./vitest-alias-update";
import chalk from "chalk";
import { PREFIX_TS_ALIAS } from "../../vitest/utils/vitest-workspaces-shared";
import { useAsyncOperation } from "./utils/use-async-operation";

const __join = (...str: string[]) => join(import.meta.url, ...str);

const PATH_DIR_TEMP = `./vitest-ts-workspace-gen-temp/` as const;
const PATH_DIR_ROOT = `../../` as const;
const PATH_FILE_PACKAGE_JSON = `package.json` as const;
const PATH_FILE_VITEST_WORKSPACE_TS = `vitest.workspace.ts` as const;

await async function main() {
    const params = program
        .name("npx vitest-ts-workspace-gen")
        .description(`Manages vitest.workspace.ts to run Vitest with multiple specified pinned versions of TypeScript.`)
        .showHelpAfterError()
        .option(`--keep-temp`, `Keeps the "${PATH_DIR_TEMP}" folder (on error AND success). Default: false.`)
        .option(`--no-internet`, `Disables dependence on access to npm servers. Note that this also makes adding versions unsafe. Default: false.`)
        .parse()
        .opts()
    ;
    program.outputHelp();
    console.info();
    const { keepTemp = false, internet, } = params;

    const _printFileLink_vitestWorkspaceTs = `"${chalk.white.underline(PATH_FILE_VITEST_WORKSPACE_TS)}"`;
    const _printFileLink_packageJson = `"${chalk.white.underline(PATH_FILE_PACKAGE_JSON)}"`;

    const spinner = ora();
    const { asyncOperation, } = useAsyncOperation(spinner);

    const Inquirer_Selection_Operations_Choices = [`add`, `remove`, `update`] as const;
    type Inquirer_Selection_Operations_Choices = (typeof Inquirer_Selection_Operations_Choices)[number];

    const Inquirer_Selection_Menu_Choices = [`preview`, `edit changes`, `exit`] as const;
    type Inquirer_Selection_Menu_Choices = (typeof Inquirer_Selection_Menu_Choices)[number];

    try {
        await asyncOperation(`Creating temp folder "${PATH_DIR_TEMP}" to aid transactional file changes`, async ({ succeed, fail, }) => {
            try {
                await safeRmdir();
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

        const projectRootPath = join(import.meta.url, PATH_DIR_ROOT);

        const usingNpmViewTypescriptVersions = useNpmViewTypescriptVersions({ noInternet: !internet, });
        const usingVitestWorkspaceAliasHandler = useVitestWorkspaceAliasHandler({
            projectRootPath,
            vitestWorkspaceFilePath: join(import.meta.url, PATH_DIR_TEMP, `./${PATH_FILE_VITEST_WORKSPACE_TS}`),
        });
        const usingRecipeCache = useRecipeCache();
        const usingParsedVersions = useParsedVersions(usingVitestWorkspaceAliasHandler.astOperation_parseVersions());

        function disableReasonMessage(message: string) { return `(disabled - ${message})`; }

        if (internet) await asyncOperation(`Fetching available typescript versions from npm`, async ({ succeed, fail, }) => {
            try {
                await usingNpmViewTypescriptVersions.fetchAvailableTsVersions();
                succeed();
            } catch (error) {
                const msg = error instanceof Error ? error.message : error;
                const baseMsg = `Failed to fetch typescript versions from npm.\nIf this is a network issue, passing "--no-internet" could be used as a workaround, but this will disable version verification and make operations unsafe.`;
                fail((text) => `${text}: ${baseMsg}\n\n${msg}`);
            }
        });

        type Inquirer_Menu_Choices = Inquirer_Selection_Operations_Choices | Inquirer_Selection_Menu_Choices;
        const menuState = {
            inq_selection_main: void 0 as Inquirer_Menu_Choices | undefined,
            previewAccepted:    false,
        };

        while (!(
            (menuState.inq_selection_main === "exit") ||
            (menuState.previewAccepted)
        )) {
            //#region Menu header
            console.info(new inquirer.Separator().separator);
            console.info(chalk.gray(`MENU`));
            console.info(new inquirer.Separator().separator);
            console.info(chalk.gray(`Versions found in ${_printFileLink_vitestWorkspaceTs}`));
            for (const line of usingParsedVersions.getVersionsAsLines(usingParsedVersions.getVersions())) {
                console.info(line);
            }
            console.info();
            //#endregion

            const _isRecipeCacheEmpty = usingRecipeCache.isRecipeCacheEmpty();
            const _versionsAfterApply = usingRecipeCache.applyRecipeCacheToVersions(usingParsedVersions.getVersions());
            const _isResultEmpty = _versionsAfterApply.length === 0;

            if (!_isRecipeCacheEmpty) {
                console.info(chalk.gray("Chosen changes queued:"));
                for (const line of usingRecipeCache.recipeCacheAsLines()) {
                    console.info(line.text);
                }
                console.info();
            }

            /** Returns undefined when `choice` is actually a separator */
            function isChoiceDisabled(choice: inquirer.Separator | { type?: undefined, disabled?: string | boolean | undefined, }): boolean | undefined {
                if (choice.type === "separator") return void 0;
                else {
                    const _disabled = choice.disabled ?? false;
                    const disabled = (typeof _disabled === "string") ? true : _disabled;
                    return disabled;
                }
            }
            function makeMenuOption_add() {
                async function inquiry(
                    message: string,
                    messages: {
                        onVersionIsInParsedVersions:     string,
                        onVersionIsInRecipeCache_add:    string,
                        onVersionIsInRecipeCache_update: string,
                    },
                ): Promise<string | undefined> {
                    const input = await inquirer.input({
                        message,
                        validate(tsVersion) {
                            const { included: isVersionInParsedVersions, } = usingParsedVersions.isVersionInParsedVersions(tsVersion);
                            if (isVersionInParsedVersions) return messages.onVersionIsInParsedVersions;
                            const { included: isVersionInRecipeCache_add, } = usingRecipeCache.isVersionInRecipeCache("add", tsVersion);
                            if (isVersionInRecipeCache_add) return messages.onVersionIsInRecipeCache_add;
                            const { included: isVersionInRecipeCache_update, } = usingRecipeCache.isVersionInRecipeCache("update_to", tsVersion);
                            if (isVersionInRecipeCache_update) return messages.onVersionIsInRecipeCache_update;
                            const validate_isTsVersionAvailableOnNpm = usingNpmViewTypescriptVersions.isTsVersionAvailableOnNpm(tsVersion);
                            return validate_isTsVersionAvailableOnNpm;
                        },
                    });
                    return input === "" ? void 0 : input;
                }
                return {
                    inquiry,
                };
            }
            function makeMenuOption_remove() {
                type _Choices = OverrideProperties<
                    Exclude<Parameters<(typeof inquirer.checkbox<string>)>[0]["choices"][number], inquirer.Separator | string>,
                    { disabled: { isVersionInRecipeCache_remove: boolean, isVersionInRecipeCache_update: boolean, }, }
                >;
                const choices: _Choices[] = usingParsedVersions.getVersions().map(tsVersion => {
                    const { included: isVersionInRecipeCache_remove, } = usingRecipeCache.isVersionInRecipeCache("remove", tsVersion);
                    const { included: isVersionInRecipeCache_update, } = usingRecipeCache.isVersionInRecipeCache("update_from", tsVersion);
                    return {
                        value:    tsVersion,
                        disabled: {
                            isVersionInRecipeCache_update,
                            isVersionInRecipeCache_remove,
                        },
                    };
                });
                const shouldBeDisabled: boolean = choices.every(choice => isChoiceDisabled({
                    ...choice,
                    disabled: choice.disabled.isVersionInRecipeCache_update || choice.disabled.isVersionInRecipeCache_remove,
                }) ?? true);

                async function inquiry(
                    message: string,
                    messages: {
                        onChoiceDisabled_alreadyInRemove: string,
                        onChoiceDisabled_alreadyInUpdate: string,
                    },
                ): Promise<string[]> {
                    const selection = await inquirer.checkbox<string>({
                        message,
                        choices: [
                            ...choices.map(choice => ({
                                ...choice,
                                disabled: choice.disabled.isVersionInRecipeCache_remove
                                    ? messages.onChoiceDisabled_alreadyInRemove
                                    : choice.disabled.isVersionInRecipeCache_update
                                        ? messages.onChoiceDisabled_alreadyInUpdate
                                        : false,
                            })),
                        ],
                    });

                    return selection;
                }
                return {
                    shouldBeDisabled,
                    inquiry,
                };
            }
            function makeMenuOption_update() {
                type _Choices = OverrideProperties<
                    Exclude<Parameters<(typeof inquirer.select<string>)>[0]["choices"][number], inquirer.Separator | string>,
                    { disabled: { isVersionInRecipeCache_update: boolean, isVersionInRecipeCache_remove: boolean, }, }
                >;
                const choices: _Choices[] = usingParsedVersions.getVersions().map(tsVersion => {
                    const { included: isVersionInRecipeCache_update, } = usingRecipeCache.isVersionInRecipeCache("update_from", tsVersion);
                    const { included: isVersionInRecipeCache_remove, } = usingRecipeCache.isVersionInRecipeCache("remove", tsVersion);
                    return {
                        value:    tsVersion,
                        disabled: {
                            isVersionInRecipeCache_update,
                            isVersionInRecipeCache_remove,
                        },
                    };
                });
                const shouldBeDisabled: boolean = choices.every(choice => isChoiceDisabled({
                    ...choice,
                    disabled: choice.disabled.isVersionInRecipeCache_update || choice.disabled.isVersionInRecipeCache_remove,
                }) ?? true);

                async function inquiry(
                    message: string,
                    messages: {
                        onChoiceDisabled_alreadyInUpdate: string,
                        onChoiceDisabled_alreadyInRemove: string,
                    },
                ): Promise<string | undefined> {
                    const selection = await inquirer.select<string>({
                        message,
                        choices: [
                            ...choices.map(choice => ({
                                ...choice,
                                disabled: choice.disabled.isVersionInRecipeCache_update
                                    ? messages.onChoiceDisabled_alreadyInUpdate
                                    : choice.disabled.isVersionInRecipeCache_remove
                                        ? messages.onChoiceDisabled_alreadyInRemove
                                        : false,
                            })),
                            new inquirer.Separator,
                            {
                                name:  "Back",
                                value: "",
                            },
                        ],
                    });

                    return selection === "" ? void 0 : selection;
                }
                return {
                    shouldBeDisabled,
                    inquiry,
                };
            }

            const menuOption_remove = makeMenuOption_remove();
            const menuOption_add = makeMenuOption_add();
            const menuOption_update = makeMenuOption_update();

            menuState.inq_selection_main = await inquirer.select<Inquirer_Selection_Operations_Choices | Inquirer_Selection_Menu_Choices>({
                message: `Choose an action:`,
                choices: [
                    { value: `add`, },
                    { value: `remove`, disabled: menuOption_remove.shouldBeDisabled ? disableReasonMessage("every found version is awaiting changes") : false, },
                    { value: `update`, disabled: menuOption_update.shouldBeDisabled ? disableReasonMessage("every found version is awaiting changes") : false, },
                    new inquirer.Separator,
                    { value: `edit changes`, disabled: _isRecipeCacheEmpty ? disableReasonMessage(`no queued changes`) : false, },
                    new inquirer.Separator,
                    { value: `preview`, name: `preview before run`, disabled: _isRecipeCacheEmpty ? disableReasonMessage(`no queued changes`) : _isResultEmpty ? disableReasonMessage(`result would be empty`) : false, },
                    { value: `exit`, },
                ] as const,
                loop:     true,
                pageSize: 10,
            });

            switch (menuState.inq_selection_main) {
                case "add": {
                    const result = await menuOption_add.inquiry(
                        `Specify a version to add, or submit blank to go back:`,
                        {
                            onVersionIsInParsedVersions:     `Version is already present in ${_printFileLink_vitestWorkspaceTs}`,
                            onVersionIsInRecipeCache_update: `Version is already used in a queued version update, adding it would result in a duplicate workspace entry`,
                            onVersionIsInRecipeCache_add:    `Version is already queued to be added`,
                        },
                    );
                    if (result !== void 0) {
                        usingRecipeCache.recipeCache.add.push(result);
                    }
                    console.info();
                    break;
                }
                case "remove": {
                    const result = await menuOption_remove.inquiry(
                        `Select which version(s) to remove from ${PATH_FILE_VITEST_WORKSPACE_TS}`,
                        {
                            onChoiceDisabled_alreadyInUpdate: disableReasonMessage(`already queued to be updated`),
                            onChoiceDisabled_alreadyInRemove: disableReasonMessage(`already queued to be removed`),
                        },
                    );
                    for (const version of result) {
                        usingRecipeCache.recipeCache.remove.push(version);
                    }
                    console.info();
                    break;
                }
                case "update": {
                    const result_select = await menuOption_update.inquiry(
                        `Select which version to change in ${PATH_FILE_VITEST_WORKSPACE_TS}, keeping related config object intact`,
                        {
                            onChoiceDisabled_alreadyInRemove: disableReasonMessage(`already queued to be removed`),
                            onChoiceDisabled_alreadyInUpdate: disableReasonMessage(`already queued to be updated`),
                        },
                    );
                    if (result_select !== void 0) {
                        const result_input = await menuOption_add.inquiry(
                            `Specify a version to add, or submit blank to go back:`,
                            {
                                onVersionIsInParsedVersions:     `Version is already present in ${_printFileLink_vitestWorkspaceTs}`,
                                onVersionIsInRecipeCache_update: `Version is already used in a queued version update, adding it would result in a duplicate workspace entry`,
                                onVersionIsInRecipeCache_add:    `Version is already queued to be added`,
                            },
                        );
                        if (result_input !== void 0) {
                            usingRecipeCache.recipeCache.update.push({ from: result_select, to: result_input, });
                        }
                    }
                    console.info();
                    break;
                }
                case "edit changes": {
                    const inquirer_checkbox = inquirer.checkbox<RecipeListFormatElement>;
                    type _Choices = Exclude<Parameters<(typeof inquirer_checkbox)>[0]["choices"][number], inquirer.Separator | string>;

                    const selection = await inquirer_checkbox({
                        message: "Select which changes to remove from the queue:",
                        choices: usingRecipeCache.recipeCacheAsLines().map((line): _Choices => ({
                            name:  line.text,
                            value: line,
                        })),
                    });

                    /** Sort by position in array in reverse, so that splice doesn't change the remaining indices as the loop runs */
                    const selectionSortedForRemoval = selection.sort((a, b) => b.originalIndex - a.originalIndex);
                    for (const element of selectionSortedForRemoval) {
                        const { originalIndex, arrayRef, } = element;
                        arrayRef.splice(originalIndex, 1);
                    }
                    console.info();
                    break;
                }
                case "preview": {
                    console.info(chalk.gray("Versions after applying queued changes:"));
                    for (const line of usingParsedVersions.getVersionsAsLines(_versionsAfterApply)) {
                        console.info(line);
                    }
                    console.info();
                    const isApplyRequested = await inquirer.confirm({
                        message: `Apply queued changes to temporary files in "${PATH_DIR_TEMP}" ?`,
                        default: false,
                    });
                    if (isApplyRequested) menuState.previewAccepted = true;
                    break;
                }
                default: break;
            }
        }

        if (menuState.inq_selection_main === "exit") return;

        await asyncOperation(`Updating temporary ${_printFileLink_vitestWorkspaceTs} with aliased typescript packages`, async ({ succeed, fail, }) => {
            try {
                await usingVitestWorkspaceAliasHandler.transformVitestWorkspaceWithRecipe(usingRecipeCache.recipeCache);
                succeed();
            } catch (error) {
                const message = error instanceof Error ? error.message : error;
                fail((text) => `${text}: ${message}`);
            }
        });

        const { indent_size, } = await editorconfig.parse(PATH_DIR_TEMP);

        await asyncOperation(`Updating temporary ${_printFileLink_packageJson} with aliased typescript packages`, async ({ succeed, fail, }) => {
            const path_temp_package_json = __join(PATH_DIR_TEMP, PATH_FILE_PACKAGE_JSON);

            const _packageJson = (() => {
                const raw = fs.readFileSync(path_temp_package_json, "utf-8");
                const packageJson = JSON.parse(raw) as OverrideProperties<typeof pkg, { devDependencies: Record<string, string>, }>;
                return packageJson;
            })();

            const _versionEntriesAfterApply = usingRecipeCache.applyRecipeCacheToVersions(usingParsedVersions.getVersions()).map((version): [string, string] => {
                const key = `${PREFIX_TS_ALIAS}${version}`;
                const prop = `npm:typescript@${version}`;
                return [key, prop];
            });

            const devDependencies = Object.fromEntries(
                [
                    ...Object.entries(_packageJson.devDependencies).flatMap(([key, prop]) => key.startsWith(PREFIX_TS_ALIAS) ? [] : [[key, prop]]),
                    ..._versionEntriesAfterApply,
                ],
            );
            const packageJson: typeof _packageJson = {
                ..._packageJson,
                devDependencies,
            };

            try {
                await fs.writeFile(path_temp_package_json, JSON.stringify(packageJson, null, indent_size));
            } catch (error) {
                const message = error instanceof Error ? error.message : error;
                fail((text) => `${text}: ${message}`);
            }

            succeed();
        });

        console.info();
        const isApplyTempConfirmed = await inquirer.confirm({
            message: "Apply temporary files to project?",
            default: false,
        });
        console.info();
        if (isApplyTempConfirmed) {
            await asyncOperation(`Copying generated files from "${PATH_DIR_TEMP}" to project`, async ({ succeed, fail, }) => {
                try {
                    await fs.copy(__join(PATH_DIR_TEMP), __join(PATH_DIR_ROOT));
                } catch (error) {
                    const message = error instanceof Error ? error.message : error;
                    fail((text) => `${text}: ${message}`);
                }

                succeed();
            });

            console.info();
            const isInstallConfirmed = await inquirer.confirm({
                message: "Install with npm?",
                default: false,
            });
            console.info();
            if (isInstallConfirmed) {
                await asyncOperation(`Running npm install to install files`, async ({ succeed, fail, pause, resume, }) => {
                    try {
                        pause();
                        const proc = execa(`npm install`, { stdout: ["pipe", process.stdout], stderr: ["pipe", process.stderr], });
                        await proc;
                        resume();
                    } catch (error) {
                        const message = error instanceof Error ? error.message : error;
                        fail((text) => `${text}: ${message}`);
                    }

                    succeed();
                });

                console.info();
            }
        }

        spinner.succeed(`Done!`);
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
                await safeRmdir();
            } catch (error) {
                console.error(error);
            }
        }
        process.exit(1);
    }

}();

function useParsedVersions(versions: string[]) {
    function getVersionsAsLines(versions: readonly string[]) {
        return versions.map(version => `${chalk.gray(` · `)}${version}`);
    }
    function isVersionInParsedVersions(tsVersion: string): IsIncludedResult {
        const indexOf = versions.indexOf(tsVersion);
        const included = indexOf !== -1;
        return { included, indexOf, };
    }

    return {
        getVersions() { return Object.freeze([...versions]); },
        getVersionsAsLines,
        isVersionInParsedVersions,
    };
}
function useNpmViewTypescriptVersions(opts?: { noInternet?: boolean, }) {
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

type IsIncludedResult = { included: true, indexOf: number, } | { included: false, };
type RecipeListFormatElement = |(
    | { type: "add",    text: string, value: TransformRecipe_AliasedTsVersions["add"][number], originalIndex: number, arrayRef: TransformRecipe_AliasedTsVersions["add"], }
    | { type: "remove", text: string, value: TransformRecipe_AliasedTsVersions["remove"][number], originalIndex: number, arrayRef: TransformRecipe_AliasedTsVersions["remove"], }
    | { type: "update", text: string, value: TransformRecipe_AliasedTsVersions["update"][number], originalIndex: number, arrayRef: TransformRecipe_AliasedTsVersions["update"], }
);
function useRecipeCache() {
    const recipeCache: TransformRecipe_AliasedTsVersions = {
        remove: [],
        add:    [],
        update: [],
    };
    function recipeCacheAsLines(): RecipeListFormatElement[] {
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
    const isRecipeCacheEmpty = (): boolean => [
        recipeCache.add,
        recipeCache.remove,
        recipeCache.update,
    ].every(({ length, }) => length === 0);

    function isVersionInRecipeCache(where: "add" | "remove" | "update_from" | "update_to", tsVersion: string): IsIncludedResult {
        switch (where) {
            case "add": {
                const indexOf = recipeCache.add.indexOf(tsVersion);
                const included = indexOf !== -1;
                return { included, indexOf, };
            }
            case "remove": {
                const indexOf = recipeCache.remove.indexOf(tsVersion);
                const included = indexOf !== -1;
                return { included, indexOf, };
            }
            case "update_from": {
                const indexOf = recipeCache.update.findIndex(({ from, }) => from === tsVersion);
                const included = indexOf !== -1;
                return { included, indexOf, };
            }
            case "update_to": {
                const indexOf = recipeCache.update.findIndex(({ to, }) => to === tsVersion);
                const included = indexOf !== -1;
                return { included, indexOf, };
            }
            default: { const _never: never = where; return _never; }
        }
    }

    function applyRecipeCacheToVersions(originalVersions: readonly string[]): string[] {
        const resultVersions = [...originalVersions];
        for (const version of recipeCache.remove) {
            const index = resultVersions.indexOf(version);
            if (index !== -1) resultVersions.splice(index, 1);
        }
        for (const version of recipeCache.add) {
            resultVersions.push(version);
        }
        for (const { from: version_from, to: version_to, } of recipeCache.update) {
            const index = resultVersions.indexOf(version_from);
            if (index !== -1) resultVersions.splice(index, 1, version_to);
        }
        const sorted = resultVersions.sort((a, b) => b.toLocaleLowerCase().localeCompare(a.toLocaleLowerCase()));
        return sorted;
    }

    return {
        recipeCache,
        recipeCacheAsLines,
        isRecipeCacheEmpty,
        isVersionInRecipeCache,
        applyRecipeCacheToVersions,
    } as const;
}

/** Safe deletions without using the equivalent of `rm -rf`. Will error due to non-empty directory, if an unknown file is present in the temp dir. */
async function safeRmdir() {
    /** Glob relative to `__dirname` (`"/bin/vitest-ts-workspace-gen/vitest-ts-workspace-gen-temp"`) */
    const globAtTempDirToAbsolute = async (pattern: string | string[]) => (await glob(pattern, { cwd: __join(PATH_DIR_TEMP), }))
        .map((globPath) => __join(PATH_DIR_TEMP, globPath))
    ;
    try {
        const globs = [
            PATH_FILE_PACKAGE_JSON,
            PATH_FILE_VITEST_WORKSPACE_TS,
        ];
        const pathsToRemove = (await globAtTempDirToAbsolute(globs)).sort((a, b) => b.length - a.length);

        for (const path of pathsToRemove) (await fs.stat(path)).isDirectory() ? await fs.rmdir(path) : await fs.rm(path);

        if (await fs.exists(__join(PATH_DIR_TEMP))) await fs.rmdir(__join(PATH_DIR_TEMP));
    } catch (error) {
        throw error;
    }
}
