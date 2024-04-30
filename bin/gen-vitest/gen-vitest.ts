#!/usr/bin/env -S node --import=tsx/esm

import pkg from "../../package.json";
import { dirname, filename, join } from "desm";
import fs from "fs-extra";
import Handlebars from "handlebars";
import { globSync } from "glob";
import { program } from "@commander-js/extra-typings";
import { execa } from "execa";
import ora from "ora";
import editorconfig from "editorconfig";
import type { Promisable } from "type-fest";

const __dirname = dirname(import.meta.url);
const __filename = filename(import.meta.url);
const __join = (...str: string[]) => join(import.meta.url, ...str);

const PATH_DIR_TEMP = `./gen-vitest-temp/` as const;
const PATH_DIR_ROOT = `../../` as const;
const PATH_FILE_PACKAGE_JSON = `package.json` as const;
const PATH_FILE_CODE_WORKSPACE = `typeful-tuples.code-workspace` as const;
const PATH_DIR_WORKSPACE = `workspaces/` as const;
const PATH_DIR_WORKSPACE_VITEST_TS_VERSION = (version: string) => `${PATH_DIR_WORKSPACE}vitest-ts-${version}/` as const;
const PATH_FILE_WORKSPACE_PACKAGE_JSON = (version: string) => `${PATH_DIR_WORKSPACE_VITEST_TS_VERSION(version)}package.json` as const;
const PATH_FILE_WORKSPACE_VITEST_CONFIG_TS = (version: string) => `${PATH_DIR_WORKSPACE_VITEST_TS_VERSION(version)}vitest.config.ts` as const;

/** Safe deletions without using the equivalent of `rm -rf`. Will error due to non-empty directory, if an unknown file is present in the temp dir. */
function safeRmdir() {
    /** Glob relative to `__dirname` (`"/bin/gen-vitest/gen-vitest-temp"`) */
    const globAtTempDirToAbsolute = (pattern: string | string[]) => globSync(pattern, { cwd: __join(PATH_DIR_TEMP), })
        .map((globPath) => __join(PATH_DIR_TEMP, globPath))
    ;
    try {
        const globs = [
            PATH_FILE_PACKAGE_JSON,
            PATH_FILE_CODE_WORKSPACE,
            PATH_DIR_WORKSPACE,
            PATH_DIR_WORKSPACE_VITEST_TS_VERSION("*"),
            PATH_FILE_WORKSPACE_PACKAGE_JSON("*"),
            PATH_FILE_WORKSPACE_VITEST_CONFIG_TS("*"),
        ];
        const pathsToRemove = globAtTempDirToAbsolute(globs).sort((a, b) => b.length - a.length);

        for (const path of pathsToRemove) fs.statSync(path).isDirectory() ? fs.rmdirSync(path) : fs.rmSync(path);

        fs.rmdirSync(__join(PATH_DIR_TEMP));
    } catch (error) {
        throw error;
    }
}

await async function main() {
    const params = program
        .name("npx gen-vitest")
        .description(`Generates a workspace to run Vitest with the given pinned version of typescript.`)
        .showHelpAfterError()
        .requiredOption(`-ts, --ts-version <value>`, `The pinned typescript version to use with the Vitest workspace.`)
        .option(`--keep-temp`, `Keep the "${PATH_DIR_TEMP}" folder (on error AND success). Default: false.`)
        .parse()
        .opts()
    ;

    const { tsVersion, keepTemp = false, } = params;

    const spinner = ora();

    async function asyncOperation<R>(
        text: string,
        operationFn: (messageFns: {
            succeed: (message: string) => void,
            fail:    (message: string) => void,
        }) => Promisable<R>,
    ) {
        spinner.start(text);
        const result = await operationFn({
            succeed(message) {
                spinner.succeed(message);
            },
            fail(message) {
                spinner.fail(message);
                throw new Error(message);
            },
        });
        spinner.stop();
        return result;
    }

    try {
        await asyncOperation(`Checking if typescript@${tsVersion} is available`, async ({ succeed, fail, }) => {
            const tsVersion_isAvailableOnNpm = await execa(`npm view typescript@${tsVersion}`)
                .then(() => true)
                .catch(() => false)
            ;

            if (tsVersion_isAvailableOnNpm) {
                succeed(`typescript@${tsVersion} is available`);
            } else {
                fail(`typescript@${tsVersion} is not available!`);
            }
        });

        await asyncOperation(`Creating temp folder to aid transactional file changes`, async ({ succeed, fail, }) => {
            try {
                safeRmdir();
                await fs.mkdir(join(import.meta.url, PATH_DIR_TEMP));
                succeed(`Temp folder "${PATH_DIR_TEMP}" created`);
            } catch (error) {
                const msg = error instanceof Error ? error.message : error;
                fail(`Creating temp folder to aid transactional file changes: couldn't create folder "${PATH_DIR_TEMP}": ${msg}`);
            }
        });

        const { indent_size, } = await editorconfig.parse(PATH_DIR_TEMP);

        await asyncOperation(`Updating "package.json" with new workspace folder entry`, async ({ succeed, fail, }) => {
            const _workspace = `workspaces/vitest-ts-${tsVersion}` as const;
            const isWorkspaceAlreadyPresent = pkg.workspaces.includes(_workspace);
            if (isWorkspaceAlreadyPresent) fail(`Updating "package.json" with new workspace folder entry: workspace already exists`);

            const workspaces = [_workspace, ...pkg.workspaces].sort();
            const _pkg = { ...pkg, workspaces, };

            try {
                const path_temp_package_json = __join(PATH_DIR_TEMP, PATH_FILE_PACKAGE_JSON);
                await fs.writeFile(path_temp_package_json, JSON.stringify(_pkg, null, indent_size));
            } catch (error) {
                const message = error instanceof Error ? error.message : error;
                fail(`Updating "package.json" with new workspace folder entry: ${message}`);
            }

            succeed(`Updating "package.json" with new workspace folder entry`);
        });

        await asyncOperation(`Updating "typeful-tuples.code-workspace" with new "folders.path" entry`, async ({ succeed, fail, }) => {
            type File_CodeWorkspace = {
                "folders":  Array<{
                    "path": string,
                }>,
                "settings": {
                    "typescript.tsdk": string,
                },
            };

            const path_root_code_workspace = __join(PATH_DIR_ROOT, PATH_FILE_CODE_WORKSPACE);
            const file_code_workspace: File_CodeWorkspace = JSON.parse(await fs.readFile(path_root_code_workspace, "utf-8"));

            const _workspace = `workspaces/vitest-ts-${tsVersion}` as const;
            const isWorkspaceAlreadyPresent = file_code_workspace.folders.some(({ path, }) => path === _workspace);
            if (isWorkspaceAlreadyPresent) fail(`Updating "typeful-tuples.code-workspace" with new "folders.path" entry: workspace already exists`);

            file_code_workspace.folders.push({ path: _workspace, });
            file_code_workspace.folders.sort((a, b) => a.path < b.path ? -1 : 1);

            try {
                const path_temp_code_workspace = __join(PATH_DIR_TEMP, PATH_FILE_CODE_WORKSPACE);
                await fs.writeFile(path_temp_code_workspace, JSON.stringify(file_code_workspace, null, indent_size));
            } catch (error) {
                const message = error instanceof Error ? error.message : error;
                fail(`Updating "typeful-tuples.code-workspace" with new "folders.path" entry: ${message}`);
            }

            succeed(`Updating "typeful-tuples.code-workspace" with new "folders.path" entry`);
        });

        const path_workspace_package_json = PATH_FILE_WORKSPACE_PACKAGE_JSON(tsVersion);
        await asyncOperation(`Generating "${path_workspace_package_json}"`, async ({ succeed, fail, }) => {
            const template = Handlebars.compile(fs.readFileSync(__join("./workspace__package_json.hbs"), "utf-8"));
            const rendered = template({
                json_name:                       "TODO",
                json_devDependencies_typescript: "TODO 2",
                json_devDependencies_vitest:     "TODO 3",
            });

            try {
                const path_temp_workspace_package_json = __join(PATH_DIR_TEMP, path_workspace_package_json);
                await fs.outputFile(path_temp_workspace_package_json, rendered);
            } catch (error) {
                const message = error instanceof Error ? error.message : error;
                fail(`Generating "${path_workspace_package_json}": ${message}`);
            }

            succeed(`Generating "${path_workspace_package_json}"`);
        });

        const path_workspace_vitest_config_ts = PATH_FILE_WORKSPACE_VITEST_CONFIG_TS(tsVersion);
        await asyncOperation(`Generating "${path_workspace_vitest_config_ts}"`, async ({ succeed, fail, }) => {
            const rendered = `TODO`;

            try {
                const path_temp_workspace_vitest_config_ts = __join(PATH_DIR_TEMP, path_workspace_vitest_config_ts);
                await fs.outputFile(path_temp_workspace_vitest_config_ts, rendered);
            } catch (error) {
                const message = error instanceof Error ? error.message : error;
                fail(`Generating "${path_workspace_vitest_config_ts}": ${message}`);
            }

            succeed(`Generating "${path_workspace_vitest_config_ts}"`);
        });

        console.info();
        spinner.succeed(`Generation done!`);
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

async function waitFor(ms?: number) { return new Promise<void>((resolve) => { setTimeout(() => resolve(), ms); }); }


function generateFiles() {
    const context_typescriptVersion = `5.4.5`;

    function workspace_file__package_json() {
        const context_name = `vitest-ts-${context_typescriptVersion}`;
        const context_devDependencies_typescriptVersion = `${context_typescriptVersion}`;
        const context_vitestPinnedVersion = `1.5.2`;
    }
    function workspace_file__vitest_config_ts() {
        const context_expectedTypescriptVersion = `${context_typescriptVersion}`;
    }
}
