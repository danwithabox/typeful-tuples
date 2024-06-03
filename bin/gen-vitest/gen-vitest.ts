#!/usr/bin/env -S node --import=tsx/esm

import pkg from "../../package.json";
import { dirname, filename, join } from "desm";
import fs from "fs-extra";
import { globSync } from "glob";
import { program } from "@commander-js/extra-typings";
import { execa } from "execa";
import ora, { type Ora } from "ora";
import editorconfig from "editorconfig";
import type { Promisable } from "type-fest";
import * as inquirer from "@inquirer/prompts";
import { astOperation_parseVersions, type TransformRecipe_AliasedTsVersions } from "./vitest-alias-update";

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
 * - vitest.workspace.ts
 *      - AST check to find existing entries
 *      - AST transform to add new entry
 * - package.json
 *      - npm install typescript alias
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
        .description(`Generates a workspace to run Vitest with the given pinned version of typescript.`)
        .showHelpAfterError()
        .option(`-ts, --ts-version <value>`, `The pinned typescript version to use with the Vitest workspace.`)
        .option(`--keep-temp`, `Keep the "${PATH_DIR_TEMP}" folder (on error AND success). Default: false.`)
        .parse()
        .opts()
    ;

    const { tsVersion, keepTemp = false, } = params;

    const spinner = ora();
    const { asyncOperation, } = useAsyncOperation(spinner);

    const Inquirer_Selection_Operations_Choices = [`add`, `remove`, `update`] as const;
    type Inquirer_Selection_Operations_Choices = (typeof Inquirer_Selection_Operations_Choices)[number];

    const Inquirer_Selection_Menu_Choices = [`exit`, `run`] as const;
    type Inquirer_Selection_Menu_Choices = (typeof Inquirer_Selection_Menu_Choices)[number];

    const recipeCache: TransformRecipe_AliasedTsVersions = {
        remove: [],
        add:    [],
        update: [],
    };

    const message_listVersions = () => astOperation_parseVersions().map(_ => `- "${_}"`).join(`\n`);
    console.info("Parsed versions in vitest.workspace.ts:");
    console.info(message_listVersions());
    /**
     * TODO:
     *  - header data showing recipe
     *  - while loop for adding until run or exit
     *  - remove recipe options menu with checkbox
     *  - "run" option disabled when recipe is empty
     *  - implement all options
     */
    console.info();
    const inq_selection_main = await inquirer.select<Inquirer_Selection_Operations_Choices | Inquirer_Selection_Menu_Choices>({
        message: `Choose an action:`,
        choices: [
            { value: `add`, },
            { value: `remove`, },
            { value: `update`, },
            { value: `run`, disabled: true, },
            { value: `exit`, },
        ] as const,
        default: "exit",
    });

    const inq_input_version = await inquirer.input({
        message: "Specify a version to add:",
        async validate(tsVersion) {
            const tsVersion_isAvailableOnNpm = await execa(`npm view typescript@${tsVersion}`)
                .then(() => true as const)
                .catch(err => err instanceof Error ? err.message : String(err))
            ;

            return tsVersion_isAvailableOnNpm;
        },
    });

    try {
        await asyncOperation(`Checking if typescript@${tsVersion} is available`, async ({ succeed, fail, }) => {
            const tsVersion_isAvailableOnNpm = await execa(`npm view typescript@${tsVersion}`)
                .then(() => true)
                .catch(() => false)
            ;

            if (tsVersion_isAvailableOnNpm) {
                succeed();
            } else {
                fail((text) => `${text}: version is not available on npm!`);
            }
        });

        await asyncOperation(`Creating temp folder "${PATH_DIR_TEMP}" to aid transactional file changes`, async ({ succeed, fail, }) => {
            try {
                safeRmdir();
                await fs.mkdir(join(import.meta.url, PATH_DIR_TEMP));
                succeed();
            } catch (error) {
                const msg = error instanceof Error ? error.message : error;
                fail((text) => `${text}: couldn't create folder "${PATH_DIR_TEMP}": ${msg}`);
            }
        });

        const { indent_size, } = await editorconfig.parse(PATH_DIR_TEMP);

        return;

        // await asyncOperation(`Generating updated "package.json" with new workspace folder entry`, async ({ succeed, fail, }) => {
        //     const _workspace = `workspaces/vitest-ts-${tsVersion}` as const;
        //     const isWorkspaceAlreadyPresent = pkg.workspaces.includes(_workspace);
        //     if (isWorkspaceAlreadyPresent) fail((text) => `${text}: workspace already exists`);

        //     const workspaces = [_workspace, ...pkg.workspaces].sort();
        //     const _pkg = { ...pkg, workspaces, };

        //     try {
        //         const path_temp_package_json = __join(PATH_DIR_TEMP, PATH_FILE_PACKAGE_JSON);
        //         await fs.writeFile(path_temp_package_json, JSON.stringify(_pkg, null, indent_size));
        //     } catch (error) {
        //         const message = error instanceof Error ? error.message : error;
        //         fail((text) => `${text}: ${message}`);
        //     }

        //     succeed();
        // });

        // const NPM_WORKSPACE_NEW = `workspaces/vitest-ts-${tsVersion}` as const;
        // await asyncOperation(`Generating updated "typeful-tuples.code-workspace" with new "folders.path" entry`, async ({ succeed, fail, }) => {
        //     type File_CodeWorkspace = {
        //         "folders":  Array<{
        //             "path": string,
        //         }>,
        //         "settings": {
        //             "typescript.tsdk": string,
        //         },
        //     };

        //     const path_root_code_workspace = __join(PATH_DIR_ROOT, PATH_FILE_CODE_WORKSPACE);
        //     const file_code_workspace: File_CodeWorkspace = JSON.parse(await fs.readFile(path_root_code_workspace, "utf-8"));

        //     const isWorkspaceAlreadyPresent = file_code_workspace.folders.some(({ path, }) => path === NPM_WORKSPACE_NEW);
        //     if (isWorkspaceAlreadyPresent) fail((text) => `${text}: workspace already exists`);

        //     file_code_workspace.folders.push({ path: NPM_WORKSPACE_NEW, });
        //     file_code_workspace.folders.sort((a, b) => a.path < b.path ? -1 : 1);

        //     try {
        //         const path_temp_code_workspace = __join(PATH_DIR_TEMP, PATH_FILE_CODE_WORKSPACE);
        //         await fs.writeFile(path_temp_code_workspace, JSON.stringify(file_code_workspace, null, indent_size));
        //     } catch (error) {
        //         const message = error instanceof Error ? error.message : error;
        //         fail((text) => `${text}: ${message}`);
        //     }

        //     succeed();
        // });

        // const path_workspace_package_json = PATH_FILE_WORKSPACE_PACKAGE_JSON(tsVersion);
        // await asyncOperation(`Generating "${path_workspace_package_json}"`, async ({ succeed, fail, }) => {
        //     const template = TEMPLATES["workspace__package.json.hbs"];
        //     const rendered = template({
        //         json_name:                       `vitest-ts-${tsVersion}`,
        //         json_devDependencies_typescript: `${tsVersion}`,
        //         json_devDependencies_vitest:     `${vitestVersionFromWorkspaceLatest}`,
        //     });

        //     try {
        //         const path_temp_workspace_package_json = __join(PATH_DIR_TEMP, path_workspace_package_json);
        //         await fs.outputFile(path_temp_workspace_package_json, rendered);
        //     } catch (error) {
        //         const message = error instanceof Error ? error.message : error;
        //         fail((text) => `${text}: ${message}`);
        //     }

        //     succeed();
        // });

        // const path_workspace_vitest_config_ts = PATH_FILE_WORKSPACE_VITEST_CONFIG_TS(tsVersion);
        // await asyncOperation(`Generating "${path_workspace_vitest_config_ts}"`, async ({ succeed, fail, }) => {
        //     const template = TEMPLATES["workspace__vitest.config.ts.hbs"];
        //     const rendered = template({
        //         config_expectedTypescriptVersion: `${tsVersion}`,
        //     });

        //     try {
        //         const path_temp_workspace_vitest_config_ts = __join(PATH_DIR_TEMP, path_workspace_vitest_config_ts);
        //         await fs.outputFile(path_temp_workspace_vitest_config_ts, rendered);
        //     } catch (error) {
        //         const message = error instanceof Error ? error.message : error;
        //         fail((text) => `${text}: ${message}`);
        //     }

        //     succeed();
        // });

        await asyncOperation(`Copying generated files from "${PATH_DIR_TEMP}" to project`, async ({ succeed, fail, }) => {
            try {
                await fs.copy(__join(PATH_DIR_TEMP), __join(PATH_DIR_ROOT));
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
