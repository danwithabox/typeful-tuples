import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
    // "workspaces/source",
    // "workspaces/vitest-ts-5.4.5",
    {
        extends: `./vitest.config.ts`,
        test:    {
            name:      `source`,
            root:      `./workspaces/source`,
            typecheck: {
                enabled: true,
            },
        },
    },
    {
        extends: `./vitest.config.ts`,
        test:    {
            name:      `vitest-ts-5.4.5`,
            // root:      `./workspaces/vitest-ts-5.4.5`,
            root:      `./workspaces/source`,
            typecheck: {
                enabled: true,
            },
        },
    },
]);
