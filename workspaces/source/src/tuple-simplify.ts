// `TupleSimplify<T>` is necessary for some inference to work correctly, e.g. in `usability-record-d.ts`

/**
 * Taken from `type-fest`'s `Simplify<T>`
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type TupleSimplify<T> = {[K in keyof T]: T[K] } & {};
