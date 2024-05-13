import { expectTypeOf, test } from "vitest";
import { tupleOf, tupleUniqueOf, tupleExhaustiveOf, tupleUnique, tuple } from "../src/index.js";

type Keys = "foo" | "bar" | "baz";
type Allowed = "1" | "2" | "3";

function sink(parameter: Allowed[]) {}
function sinkT<T extends Allowed>(parameter: T[]) {}
function sinkSpread(...parameter: Allowed[]) {}
function sinkSpreadT<T extends Allowed>(...parameter: T[]) {}
function tupleRaw<const V, T extends readonly V[]>(tuple: T): { value: T, } {
    return Object.assign(tuple, { value: tuple, });
}

test(`inference protection when using as a function parameter`, () => {
    tupleUniqueOf<Allowed>()(["1", "2"]);

    const a0 = tupleUnique(["1", "2"]);
    const a1 = [...tupleUnique(["1", "2"])];
    const a2 = tupleRaw(tupleUnique(["1", "2"])).value;

    sink(tupleRaw(tupleUnique(["1", "1"])).value);
    sink([...tupleUnique(["1", "1"])]);
    sinkT([...tupleUnique(["1", "1"])]);
    sink({ _: tupleUnique(["1", "1"]), }._);
    sinkT({ _: tupleUnique(["1", "1"]), }._);
    sinkT(tupleUnique.wrapped(["1", "1"]).tuple);
    sinkT(tupleUnique.wrap(["1", "1"]).tuple);
    sinkSpread(...tupleUnique(["1", "1"]));
    sinkSpreadT(...tupleUnique(["1", "1"]));
    sink(tupleUnique(["1", "1"]));
    sink(tupleUniqueOf<Allowed>()([]));

    // Maybe provide a .wrapped function? use as tupleUnique.wrapped([1, 2, 3]).tuple to provide a reliable exit hatch from inference
});
