export const ENV_TS_ALIASED_EXPECTED = `ENV_TS_ALIASED_EXPECTED` as const;

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeJS {
        interface ProcessEnv {
            [ENV_TS_ALIASED_EXPECTED]?: string,
        }
    }
}
