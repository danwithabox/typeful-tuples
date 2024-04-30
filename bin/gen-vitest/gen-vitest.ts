#!/usr/bin/env -S node --import=tsx/esm

import pkg from "../../package.json";
import { dirname, filename, join } from "desm";
import fs from "fs-extra";
import { program } from "@commander-js/extra-typings";
import { execa } from "execa";
import ora from "ora";
import editorconfig from "editorconfig";
import type { Promisable } from "type-fest";

const __dirname = dirname(import.meta.url);
const __filename = filename(import.meta.url);
const __join = (...str: string[]) => join(import.meta.url, ...str);

const PATH_TEMP = `./gen-vitest-tmp`;
const PATH_PACKAGE_JSON = `./package.json`;
function safeRmdir() {
    try {
        fs.rmSync(__join(PATH_TEMP, PATH_PACKAGE_JSON));
        fs.rmdirSync(__join(PATH_TEMP));
    } catch (error) {
        console.error(error);
    }
}

await async function main() {
    const params = program
        .name("npx gen-vitest")
        .description(`Generates a workspace to run Vitest with the given pinned version of typescript.`)
        .showHelpAfterError()
        .requiredOption(`-ts, --ts-version <value>`, `The pinned typescript version to use with the Vitest workspace.`)
        .option(`--keep-temp`, `Keep the "${PATH_TEMP}" folder (on error AND success). Default: false.`)
        .parse()
        .opts()
    ;

    const { tsVersion, keepTemp = false, } = params;

    const spinner = ora(`Creating files`);

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
                await fs.mkdir(join(import.meta.url, PATH_TEMP));
                succeed(`Temp folder "${PATH_TEMP}" created`);
            } catch (error) {
                const msg = error instanceof Error ? error.message : error;
                fail(`Creating temp folder to aid transactional file changes: couldn't create folder "${PATH_TEMP}": ${msg}`);
            }
        });

        await asyncOperation(`Updating "package.json" with new workspace folder entry`, async ({ succeed, fail, }) => {
            type pkg = typeof pkg;

            const _workspace = `workspaces/vitest-ts-${tsVersion}`;
            const isWorkspaceAlreadyPresent = pkg.workspaces.includes(_workspace);
            if (isWorkspaceAlreadyPresent) fail(`Updating "package.json" with new workspace folder entry: workspace already exists`);

            const workspaces = [_workspace, ...pkg.workspaces];
            const _pkg = { ...pkg, workspaces, };
            spinner.info(JSON.stringify(_pkg, null, 4));
            return _pkg;
        });
    } catch (error) {
        console.info();
        spinner.warn(`Generating failed`);
    } finally {
        if (keepTemp) spinner.info(`Option "--keep-temp": temp folder "${PATH_TEMP}" will be kept.`);
        else {
            spinner.info(`Removing temp folder "${PATH_TEMP}". Pass "--keep-temp" to keep it.`);
            safeRmdir();
        }
        process.exit(1);
    }


}();

async function waitFor(ms?: number) { return new Promise<void>((resolve) => { setTimeout(() => resolve(), ms); }); }

function updateFiles() {
    function root_file__package_json() {
        type PackageJson = typeof pkg;
    }
    function root_file__code_workspace() {
        const filePath = `typeful-tuples.code-workspace`;
        type CodeWorkspace = {
            "folders":  Array<{ "path": string, }>,
            "settings": {
                "typescript.tsdk": string,
            },
        };
    }
}
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
