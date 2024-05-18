import { createDefaultMapFromNodeModules, createFSBackedSystem, createSystem, createVirtualTypeScriptEnvironment } from "@typescript/vfs";
import ts from "typescript";
import { join } from "desm";

const relativeRoot = `../../`;
console.log("root", join(import.meta.url, relativeRoot));
const configFileName = ts.findConfigFile(
    relativeRoot,
    ts.sys.fileExists,
    "tsconfig.json",
);
if (configFileName === void 0) throw new Error("tsconfig.json not found");
const configFile = ts.readConfigFile(configFileName, ts.sys.readFile);
const compilerOptions = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    relativeRoot,
).options;
console.log("compilerOptions", compilerOptions);

const fsMap = new Map<string, string>();

const file = `index.ts`;
// const tupleOf = <V>() => (v: V[]) => v;
// tupleOf<"foo" | "bar">()([""]);
const content = `
import { tupleUniqueOf } from "../src/index.js";
tupleUniqueOf<"foo" | "bar">()(["foo", ""]);
`;
fsMap.set(file, content);

// By providing a project root, then the system knows how to resolve node_modules correctly
const projectRoot = join(import.meta.url, relativeRoot);
const system = createFSBackedSystem(fsMap, projectRoot, ts);
const env = createVirtualTypeScriptEnvironment(system, [file], ts, compilerOptions);
console.log(env.sys.resolvePath("./"));
console.log("getCurrentDirectory", env.sys.getCurrentDirectory());
console.log("getDirectories", env.sys.getDirectories("."));

// Requests auto-completions at `path.|`
const completions = env.languageService.getCompletionsAtPosition(
    file,
    content.length - 5,
    {},
);
// env.getSourceFile("index.ts")?.getPositionOfLineAndCharacter
const source = env.getSourceFile("index.ts")?.fileName;
const source2 = env.getSourceFile("../src/index.ts")?.fileName;
console.log("source", source);
console.log("source2", source2);
console.log("completions", completions);
