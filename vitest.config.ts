import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        reporters: [
            // TODO: remove when this issue is fixed https://github.com/vitest-dev/vitest/issues/7292
            ["default", { summary: false, }],
        ],
        coverage: {
            enabled:  true,
            provider: "v8",
            include:  [`src/**/*`],
        },
    },
});
