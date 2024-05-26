/*
 * Deliberately not the intrinsic NoInfer<T> type, see reasons below.
 *
 * From:
 * - https://stackoverflow.com/questions/75909231/how-can-this-advanced-function-type-be-achieved/75909852#75909852
 * - https://stackoverflow.com/questions/56687668/a-way-to-disable-type-argument-inference-in-generics
 * - https://stackoverflow.com/questions/67108349/is-there-a-way-to-hint-ts-which-occurrence-of-generic-parameter-to-use-for-gener/67110530#67110530
 * - https://github.com/microsoft/TypeScript/issues/14829#issuecomment-322267089
 * - https://github.com/Microsoft/TypeScript/issues/14829#issuecomment-504042546
 * - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-4.html#the-noinfer-utility-type
 * - https://github.com/microsoft/TypeScript/pull/56794
 *
 * Dev note: if this ever breaks, use one of the following:
 * - `type TupleNoInfer<T> = {[K in keyof NoInfer<T>]: NoInfer<T>[K] };`
 *      - uses the more stable, intrinsic `NoInfer<T>` type, but return type becomes `TupleNoInfer<T>`
 *      - gets inferred value candidates from return type position, but doesn't overshadow own type
 * - `type TupleNoInfer<T> = Simplify<NoInfer<T>>;`
 *      - also uses intrinsic `NoInfer<T>`, but resulting type is ugly, shows as an object with tuple props, instead of a proper tuple
 *      - however, if that hover issue is fixed, this could be nice
 *      - gets inferred value candidates from return type position, but doesn't overshadow own type
 * If all hell breaks loose, simply use:
 * - `type TupleNoInfer<T> = NoInfer<T>;`
 *      - most stable
 *      - but the advanced inference feature of getting values recommended for autocomplete through return type position is lost
 */
export type TupleNoInfer<T>
    = [T][T extends unknown ? 0 : never]
    // = {[K in keyof NoInfer<T>]: NoInfer<T>[K] }
    // = Simplify<NoInfer<T>>

    // = NoInfer<T>
;
