// `_TupleSimplify<T>` is necessary for some inference to work correctly, e.g. in `usability-record-d.ts`

/**
 * Taken from `type-fest`'s `Simplify<T>`
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type _TupleSimplify<T> = {[K in keyof T]: T[K] } & {};

/**
 * To prevent functions being affected by inference through their generic return type, e.g. when used as the property of a `Record<>`,
 * inferred values can be placed or "boxed" in an object, which "locks-in" the inferred value.
 */
export type _InferenceBoxedTuple<T> = { unbox: _TupleSimplify<T>, };
