import { join } from "desm";
import { createVirtualTs } from "../../vitest/utils/ts-vfs/ts-vfs";

await async function main() {
    const virtualTs = createVirtualTs({
        projectRootPath: join(import.meta.url, `../../`),
    });

    const cwd = virtualTs.vfs.env.sys.getCurrentDirectory();
    // const f1 = `../src/index.ts`;
    const f1 = `../../../src/index.ts`;
    // const f1 = `../src/index.ts`;
    // const f1 = `../src/index.ts`;
    const file = virtualTs.vfs.env.getSourceFile(f1);
    const file1 = virtualTs.vfs.env.sys.readFile(f1);
    // const file2 = virtualTs.vfs.env.createFile(`../src/index2.ts`, file1)
    console.log("cwd", cwd);
    console.log("file", file);
    console.log("file1", file1);
}();
