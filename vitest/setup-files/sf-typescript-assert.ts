import { beforeAll, inject } from "vitest";
import ts from "typescript";

beforeAll(() => {
    console.log("TODO: here's where we should assert ts-vfs ability to import the library, and maybe add it to global");
    const typescriptAliasExpectedVersion = inject("typescriptAliasExpectedVersion");
    console.log("SF setup file", ts.version, `expected`, typescriptAliasExpectedVersion);
});
