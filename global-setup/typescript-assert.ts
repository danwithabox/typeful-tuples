import type { GlobalSetupContext } from "vitest/node";

export default async function setup({ config, provide, }: GlobalSetupContext) {
    console.log("global setup");
    throw new Error("sample error");

    return async () => {};
}
