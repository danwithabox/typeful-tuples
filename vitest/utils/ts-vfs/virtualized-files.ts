import type { Simplify, UnionToIntersection } from "type-fest";

export type VirtualFile_Define = { path: string, imports: string[], };
export type VirtualFile<T extends VirtualFile_Define = VirtualFile_Define> = Simplify<{
    path:    T["path"],
    imports: {[K in T["imports"][number]]: K; },
}>;
export type VirtualFile_Entry<T extends VirtualFile_Define = VirtualFile_Define> = {
    [K_P in T["path"]]: VirtualFile<T>
};
export type VirtualFiles_Transform<T extends VirtualFile_Define[]> = Simplify<UnionToIntersection<{
    [K in keyof T]: VirtualFile_Entry<T[K]>;
}[number]>>;

/**
 * NOTE: the base path for virtual files is `./vfs`. Therefore, if you want to correctly set up files, it's recommended to do this:
 *
 * ```ts
 * const sf = defineVirtualSourceFiles([
 *     { path: `../index.ts`, imports: [`./src/index.js`], },
 * ]);
 * ```
 */
export function defineVirtualSourceFiles<const T extends VirtualFile_Define[]>(virtualFiles: T): VirtualFiles_Transform<T> {
    const mapped = virtualFiles.reduce((acc, curr) => {
        const { path, imports: _imports, } = curr;
        const imports = _imports.reduce((acc, curr) => ({ ...acc, [curr]: curr, }), {} as VirtualFile["imports"]);
        const entry: VirtualFile = { path, imports, };
        return { ...acc, [entry.path]: entry, };
    }, {} as VirtualFile_Entry);
    return mapped as VirtualFiles_Transform<T>;
}
