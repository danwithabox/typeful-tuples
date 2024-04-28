import type packagejson from "../package.json";

/**
 * - SCAFFOLDING:
 *  - edit code workspace file
 *  - generate workspace files, from templates where needed
 *      - package.json
 *          - typescript version
 *      - vites.config.ts
 *          - assert version
 */

function updateFiles() {
    function root_file__package_json() {
        type PackageJson = typeof packagejson;
    }
    function root_file__code_workspace() {
        const filePath = `unique-tuple-ts.code-workspace`;
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
