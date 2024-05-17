import type { Simplify } from "type-fest";
import { tuple, tupleUnique, tupleUniqueOf } from "../src/index.js";

/** https://github.com/sindresorhus/type-fest/issues/848 */
type Tuple = [1, 2, 3];
type Simple1 = Simplify<Tuple>;
type Simple2 = Simplify<NoInfer<Tuple>>;
type Simple3 = NoInfer<Simplify<Tuple>>;
type Simple4 = NoInfer<Tuple>;
type MappedTuple<T extends any[]> = {[K in keyof T]: 1; };
type Mapped = MappedTuple<Tuple>;
type Mapped1 = MappedTuple<Simple1>;
type Mapped2 = MappedTuple<Simple2>;
type Mapped3 = MappedTuple<Simple3>;
type Mapped4 = MappedTuple<Simple4>;

{
    const val1 = tuple(["1", "1"]);
    const val2 = tupleUnique(["1", "1"]);

    const _tuple_rec1 = {
        foo: tupleUnique(["1", ""]),
        baz: tuple(["1", ""]),
        qux: tupleUnique(["1", "2"]),
    } satisfies Record<keyof any, ("1" | "2" | "3")[]>;
}

{
    function inferenceSource(param: ("foo" | "bar")[]) {}
    inferenceSource(["foo", ""]);
    inferenceSource(tupleUnique(["foo", ""]));
    inferenceSource(tupleUniqueOf()(["foo", "bar"]));

}
