import { join } from "desm";
import { createVirtualTs } from "./ts-vfs/ts-vfs";
import { defineVirtualSourceFiles } from "./ts-vfs/virtualized-files";

const sourceFiles = defineVirtualSourceFiles([
    { path: `../index.ts`, imports: [`./src/index`], },
]);
export const virtualTs = createVirtualTs({ projectRootPath: join(import.meta.url, `../../`), sourceFiles, });
