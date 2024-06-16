import { describe, expectTypeOf, test } from "vitest";
import { tupleOf, tupleUniqueOf, tupleExhaustiveOf, tupleUnique, tuple } from "../src/index";

type Keys = "foo" | "bar" | "baz";
type Allowed = "1" | "2" | "3";

function inferenceSourceFn/*                  */(/*                        */param: Allowed[])    { return param; }
function inferenceSourceFn_T/*                */<T extends Allowed>(/*     */param: T[])          { return param; }
function inferenceSourceFn_TArr/*             */<TArr extends Allowed[]>(/**/param: TArr)         { return param; }
function inferenceSourceFn_const_T/*          */<const T extends Allowed>(/*     */param: T[])          { return param; }
function inferenceSourceFn_const_TArr/*       */<const TArr extends Allowed[]>(/**/param: TArr)         { return param; }

describe(`not losing inference in function parameter location`, () => {
    test(`when using tuple()`, () => {
        {
            const output = inferenceSourceFn(tuple(["1", "2", "3"]));
            expectTypeOf(output).toEqualTypeOf<Allowed[]>();

            const output_fail_empty = inferenceSourceFn(
                //@ts-expect-error Argument of type '("" | "1" | "2")[]' is not assignable to parameter of type 'Allowed[]'.ts(2345)
                tuple(["1", "2", ""]),
            );
            const output_fail_invalid = inferenceSourceFn(
                // Expected issue: this doesn't show an error
                tuple(["1", "2", "2"]),
            );
            const output_fail_disallowed = inferenceSourceFn(
                //@ts-expect-error Argument of type '("1" | "2" | "4")[]' is not assignable to parameter of type 'Allowed[]'.ts(2345)
                tuple(["1", "2", "4"]),
            );
        }
        {
            const output = inferenceSourceFn_T(tuple(["1", "2", "3"]));
            expectTypeOf(output).toEqualTypeOf<("1" | "2" | "3")[]>();

            const output_fail_empty = inferenceSourceFn_T(
                //@ts-expect-error Type '""' is not assignable to type 'Allowed'.ts(2345)
                tuple(["1", "2", ""]),
            );
            const output_fail_invalid = inferenceSourceFn_T(
                // Expected issue: this doesn't show an error
                tuple(["1", "2", "2"]),
            );
            const output_fail_disallowed = inferenceSourceFn_T(
                //@ts-expect-error Type '"4"' is not assignable to type 'Allowed'.ts(2345)
                tuple(["1", "2", "4"]),
            );
        }
        {
            const output = inferenceSourceFn_TArr(tuple(["1", "2", "3"]));
            expectTypeOf(output).toEqualTypeOf<["1", "2", "3"]>();

            const output_fail_empty = inferenceSourceFn_TArr(
                //@ts-expect-error Argument of type '("" | "1" | "2")[]' is not assignable to parameter of type 'Allowed[]'.ts(2345)
                tuple(["1", "2", ""]),
            );
            const output_fail_invalid = inferenceSourceFn_TArr(
                // Expected issue: this doesn't show an error
                tuple(["1", "2", "2"]),
            );
            const output_fail_disallowed = inferenceSourceFn_TArr(
                //@ts-expect-error Argument of type '("1" | "2" | "4")[]' is not assignable to parameter of type 'Allowed[]'.ts(2345)
                tuple(["1", "2", "4"]),
            );
        }
        {
            const output = inferenceSourceFn_const_T(tuple(["1", "2", "3"]));
            expectTypeOf(output).toEqualTypeOf<("1" | "2" | "3")[]>();

            const output_fail_empty = inferenceSourceFn_const_T(
                //@ts-expect-error Argument of type '("" | "1" | "2")[]' is not assignable to parameter of type 'Allowed[]'.ts(2345)
                tuple(["1", "2", ""]),
            );
            const output_fail_invalid = inferenceSourceFn_const_T(
                // Expected issue: this doesn't show an error
                tuple(["1", "2", "2"]),
            );
            const output_fail_disallowed = inferenceSourceFn_const_T(
                //@ts-expect-error Argument of type '("1" | "2" | "4")[]' is not assignable to parameter of type 'Allowed[]'.ts(2345)
                tuple(["1", "2", "4"]),
            );
        }
        {
            const output = inferenceSourceFn_const_TArr(tuple(["1", "2", "3"]));
            expectTypeOf(output).toEqualTypeOf<["1", "2", "3"]>();

            const output_fail_empty = inferenceSourceFn_const_TArr(
                //@ts-expect-error Argument of type '("" | "1" | "2")[]' is not assignable to parameter of type 'Allowed[]'.ts(2345)
                tuple(["1", "2", ""]),
            );
            const output_fail_invalid = inferenceSourceFn_const_TArr(
                // Expected issue: this doesn't show an error
                tuple(["1", "2", "2"]),
            );
            const output_fail_disallowed = inferenceSourceFn_const_TArr(
                //@ts-expect-error Argument of type '("1" | "2" | "4")[]' is not assignable to parameter of type 'Allowed[]'.ts(2345)
                tuple(["1", "2", "4"]),
            );
        }
    });
    test(`when using tupleUnique()`, () => {
        {
            const output = inferenceSourceFn(tupleUnique(["1", "2", "3"]));
            expectTypeOf(output).toEqualTypeOf<Allowed[]>();

            const output_fail_empty = inferenceSourceFn(
                //@ts-expect-error Type '""' is not assignable to type 'Allowed'.ts(2345)
                tupleUnique(["1", "2", ""]),
            );
            const output_fail_invalid = inferenceSourceFn(
                //@ts-expect-error Type 'string' is not assignable to type 'never'.ts(2322)
                tupleUnique(["1", "2", "2"]),
            );
            const output_fail_disallowed = inferenceSourceFn(
                //@ts-expect-error Type '"4"' is not assignable to type 'Allowed'.ts(2345)
                tupleUnique(["1", "2", "4"]),
            );
        }
        {
            const output = inferenceSourceFn_T(tupleUnique(["1", "2", "3"]));
            expectTypeOf(output).toEqualTypeOf<("1" | "2" | "3")[]>();

            const output_fail_empty = inferenceSourceFn_T(
                //@ts-expect-error Type '""' is not assignable to type 'Allowed'.ts(2345)
                tupleUnique(["1", "2", ""]),
            );
            const output_fail_invalid = inferenceSourceFn_T(
                //@ts-expect-error Type 'string' is not assignable to type 'never'.ts(2322)
                tupleUnique(["1", "2", "2"]),
            );
            const output_fail_disallowed = inferenceSourceFn_T(
                //@ts-expect-error Argument of type '("1" | "2" | "4")[]' is not assignable to parameter of type 'Allowed[]'.ts(2345)
                tupleUnique(["1", "2", "4"]),
            );
        }
        {
            const output = inferenceSourceFn_TArr(tupleUnique(["1", "2", "3"]));
            expectTypeOf(output).toEqualTypeOf<["1", "2", "3"]>();

            const output_fail_empty = inferenceSourceFn_TArr(
                //@ts-expect-error Argument of type '("" | "1" | "2")[]' is not assignable to parameter of type 'Allowed[]'.ts(2345)
                tupleUnique(["1", "2", ""]),
            );
            const output_fail_invalid = inferenceSourceFn_TArr(
                //@ts-expect-error Type 'string' is not assignable to type 'never'.ts(2322)
                tupleUnique(["1", "2", "2"]),
            );
            const output_fail_disallowed = inferenceSourceFn_TArr(
                //@ts-expect-error Argument of type '("1" | "2" | "4")[]' is not assignable to parameter of type 'Allowed[]'.ts(2345)
                tupleUnique(["1", "2", "4"]),
            );
        }
        {
            const output = inferenceSourceFn_const_T(tupleUnique(["1", "2", "3"]));
            expectTypeOf(output).toEqualTypeOf<("1" | "2" | "3")[]>();

            const output_fail_empty = inferenceSourceFn_const_T(
                //@ts-expect-error Argument of type '("" | "1" | "2")[]' is not assignable to parameter of type 'Allowed[]'.ts(2345)
                tupleUnique(["1", "2", ""]),
            );
            const output_fail_invalid = inferenceSourceFn_const_T(
                //@ts-expect-error Type 'string' is not assignable to type 'never'.ts(2322)
                tupleUnique(["1", "2", "2"]),
            );
            const output_fail_disallowed = inferenceSourceFn_const_T(
                //@ts-expect-error Argument of type '("1" | "2" | "4")[]' is not assignable to parameter of type 'Allowed[]'.ts(2345)
                tupleUnique(["1", "2", "4"]),
            );
        }
        {
            const output = inferenceSourceFn_const_TArr(tupleUnique(["1", "2", "3"]));
            expectTypeOf(output).toEqualTypeOf<["1", "2", "3"]>();

            const output_fail_empty = inferenceSourceFn_const_TArr(
                //@ts-expect-error Argument of type '("" | "1" | "2")[]' is not assignable to parameter of type 'Allowed[]'.ts(2345)
                tupleUnique(["1", "2", ""]),
            );
            const output_fail_invalid = inferenceSourceFn_const_TArr(
                //@ts-expect-error Type 'string' is not assignable to type 'never'.ts(2322)
                tupleUnique(["1", "2", "2"]),
            );
            const output_fail_disallowed = inferenceSourceFn_const_TArr(
                //@ts-expect-error Argument of type '("1" | "2" | "4")[]' is not assignable to parameter of type 'Allowed[]'.ts(2345)
                tupleUnique(["1", "2", "4"]),
            );
        }
    });
    test(`when using tupleOf()`, () => {
        {
            const output = inferenceSourceFn(tupleOf<Allowed>()(["1", "2", "3"]));
            expectTypeOf(output).toEqualTypeOf<Allowed[]>();

            const output_fail_empty = inferenceSourceFn(
                //@ts-expect-error Type '""' is not assignable to type 'Allowed'.ts(2345)
                tupleOf<Allowed>()(["1", "2", ""]),
            );
            const output_fail_disallowed = inferenceSourceFn(
                //@ts-expect-error Type '"4"' is not assignable to type 'Allowed'.ts(2345)
                tupleOf<Allowed>()(["1", "2", "4"]),
            );
        }
        {
            const output = inferenceSourceFn_T(tupleOf<Allowed>()(["1", "2", "3"]));
            expectTypeOf(output).toEqualTypeOf<("1" | "2" | "3")[]>();

            const output_fail_empty = inferenceSourceFn_T(
                //@ts-expect-error Type '""' is not assignable to type 'Allowed'.ts(2345)
                tupleOf<Allowed>()(["1", "2", ""]),
            );
            const output_fail_disallowed = inferenceSourceFn_T(
                //@ts-expect-error Type '"4"' is not assignable to type 'Allowed'.ts(2322)
                tupleOf<Allowed>()(["1", "2", "4"]),
            );
        }
        {
            const output = inferenceSourceFn_TArr(tupleOf<Allowed>()(["1", "2", "3"]));
            expectTypeOf(output).toEqualTypeOf<["1", "2", "3"]>();

            const output_fail_empty = inferenceSourceFn_TArr(
                //@ts-expect-error Type '""' is not assignable to type 'Allowed'.ts(2322)
                tupleOf<Allowed>()(["1", "2", ""]),
            );
            const output_fail_disallowed = inferenceSourceFn_TArr(
                //@ts-expect-error Type '"4"' is not assignable to type 'Allowed'.ts(2322)
                tupleOf<Allowed>()(["1", "2", "4"]),
            );
        }
        {
            const output = inferenceSourceFn_const_T(tupleOf<Allowed>()(["1", "2", "3"]));
            expectTypeOf(output).toEqualTypeOf<("1" | "2" | "3")[]>();

            const output_fail_empty = inferenceSourceFn_const_T(
                //@ts-expect-error Type '""' is not assignable to type 'Allowed'.ts(2322)
                tupleOf<Allowed>()(["1", "2", ""]),
            );
            const output_fail_disallowed = inferenceSourceFn_const_T(
                //@ts-expect-error Type '"4"' is not assignable to type 'Allowed'.ts(2322)
                tupleOf<Allowed>()(["1", "2", "4"]),
            );
        }
        {
            const output = inferenceSourceFn_const_TArr(tupleOf<Allowed>()(["1", "2", "3"]));
            expectTypeOf(output).toEqualTypeOf<["1", "2", "3"]>();

            const output_fail_empty = inferenceSourceFn_const_TArr(
                //@ts-expect-error Type '""' is not assignable to type 'Allowed'.ts(2322)
                tupleOf<Allowed>()(["1", "2", ""]),
            );
            const output_fail_disallowed = inferenceSourceFn_const_TArr(
                //@ts-expect-error Type '"4"' is not assignable to type 'Allowed'.ts(2322)
                tupleOf<Allowed>()(["1", "2", "4"]),
            );
        }
    });
    test(`when using tupleUniqueOf()`, () => {
        {
            const output = inferenceSourceFn(tupleUniqueOf<Allowed>()(["1", "2", "3"]));
            expectTypeOf(output).toEqualTypeOf<Allowed[]>();

            const output_fail_empty = inferenceSourceFn(
                //@ts-expect-error Type '""' is not assignable to type 'Allowed'.ts(2345)
                tupleUniqueOf<Allowed>()(["1", "2", ""]),
            );
            const output_fail_invalid = inferenceSourceFn(
                //@ts-expect-error Type 'string' is not assignable to type 'never'.ts(2322)
                tupleUniqueOf<Allowed>()(["1", "2", "2"]),
            );
            const output_fail_disallowed = inferenceSourceFn(
                //@ts-expect-error Type '"4"' is not assignable to type 'Allowed'.ts(2345)
                tupleUniqueOf<Allowed>()(["1", "2", "4"]),
            );
        }
        {
            const output = inferenceSourceFn_T(tupleUniqueOf<Allowed>()(["1", "2", "3"]));
            expectTypeOf(output).toEqualTypeOf<("1" | "2" | "3")[]>();

            const output_fail_empty = inferenceSourceFn_T(
                //@ts-expect-error Type '""' is not assignable to type 'Allowed'.ts(2345)
                tupleUniqueOf<Allowed>()(["1", "2", ""]),
            );
            const output_fail_invalid = inferenceSourceFn(
                //@ts-expect-error Type 'string' is not assignable to type 'never'.ts(2322)
                tupleUniqueOf<Allowed>()(["1", "2", "2"]),
            );
            const output_fail_disallowed = inferenceSourceFn_T(
                //@ts-expect-error Type '"4"' is not assignable to type 'Allowed'.ts(2322)
                tupleUniqueOf<Allowed>()(["1", "2", "4"]),
            );
        }
        {
            const output = inferenceSourceFn_TArr(tupleUniqueOf<Allowed>()(["1", "2", "3"]));
            expectTypeOf(output).toEqualTypeOf<["1", "2", "3"]>();

            const output_fail_empty = inferenceSourceFn_TArr(
                //@ts-expect-error Type '""' is not assignable to type 'Allowed'.ts(2322)
                tupleUniqueOf<Allowed>()(["1", "2", ""]),
            );
            const output_fail_invalid = inferenceSourceFn(
                //@ts-expect-error Type 'string' is not assignable to type 'never'.ts(2322)
                tupleUniqueOf<Allowed>()(["1", "2", "2"]),
            );
            const output_fail_disallowed = inferenceSourceFn_TArr(
                //@ts-expect-error Type '"4"' is not assignable to type 'Allowed'.ts(2322)
                tupleUniqueOf<Allowed>()(["1", "2", "4"]),
            );
        }
        {
            const output = inferenceSourceFn_const_T(tupleUniqueOf<Allowed>()(["1", "2", "3"]));
            expectTypeOf(output).toEqualTypeOf<("1" | "2" | "3")[]>();

            const output_fail_empty = inferenceSourceFn_const_T(
                //@ts-expect-error Type '""' is not assignable to type 'Allowed'.ts(2322)
                tupleUniqueOf<Allowed>()(["1", "2", ""]),
            );
            const output_fail_invalid = inferenceSourceFn(
                //@ts-expect-error Type 'string' is not assignable to type 'never'.ts(2322)
                tupleUniqueOf<Allowed>()(["1", "2", "2"]),
            );
            const output_fail_disallowed = inferenceSourceFn_const_T(
                //@ts-expect-error Type '"4"' is not assignable to type 'Allowed'.ts(2322)
                tupleUniqueOf<Allowed>()(["1", "2", "4"]),
            );
        }
        {
            const output = inferenceSourceFn_const_TArr(tupleUniqueOf<Allowed>()(["1", "2", "3"]));
            expectTypeOf(output).toEqualTypeOf<["1", "2", "3"]>();

            const output_fail_empty = inferenceSourceFn_const_TArr(
                //@ts-expect-error Type '""' is not assignable to type 'Allowed'.ts(2322)
                tupleUniqueOf<Allowed>()(["1", "2", ""]),
            );
            const output_fail_invalid = inferenceSourceFn(
                //@ts-expect-error Type 'string' is not assignable to type 'never'.ts(2322)
                tupleUniqueOf<Allowed>()(["1", "2", "2"]),
            );
            const output_fail_disallowed = inferenceSourceFn_const_TArr(
                //@ts-expect-error Type '"4"' is not assignable to type 'Allowed'.ts(2322)
                tupleUniqueOf<Allowed>()(["1", "2", "4"]),
            );
        }
    });
    test(`when using tupleExhaustiveOf()`, () => {
        {
            const output = inferenceSourceFn(tupleExhaustiveOf<Allowed>()(["1", "2", "3"]));
            expectTypeOf(output).toEqualTypeOf<Allowed[]>();

            const output_fail_empty = inferenceSourceFn(
                //@ts-expect-error Argument of type '("" | "1" | "2")[]' is not assignable to parameter of type 'Allowed[]'.ts(2345)
                tupleExhaustiveOf<Allowed>()(["1", "2", ""]),
            );
            const output_fail_invalid = inferenceSourceFn(
                //@ts-expect-error Type 'string' is not assignable to type 'never'.ts(2322)
                tupleExhaustiveOf<Allowed>()(["1", "2", "2"]),
            );
            const output_fail_disallowed = inferenceSourceFn(
                //@ts-expect-error Type '"4"' is not assignable to type '"" | Allowed'.ts(2322)
                tupleExhaustiveOf<Allowed>()(["1", "2", "4"]),
            );
        }
        {
            const output = inferenceSourceFn_T(tupleExhaustiveOf<Allowed>()(["1", "2", "3"]));
            expectTypeOf(output).toEqualTypeOf<("1" | "2" | "3")[]>();

            const output_fail_empty = inferenceSourceFn_T(
                //@ts-expect-error Type '""' is not assignable to type 'Allowed'.ts(2345)
                tupleExhaustiveOf<Allowed>()(["1", "2", ""]),
            );
            const output_fail_invalid = inferenceSourceFn(
                //@ts-expect-error Type 'string' is not assignable to type 'never'.ts(2322)
                tupleExhaustiveOf<Allowed>()(["1", "2", "2"]),
            );
            const output_fail_disallowed = inferenceSourceFn_T(
                //@ts-expect-error Type '"4"' is not assignable to type '"" | Allowed'.ts(2322)
                tupleExhaustiveOf<Allowed>()(["1", "2", "4"]),
            );
        }
        {
            const output = inferenceSourceFn_TArr(tupleExhaustiveOf<Allowed>()(["1", "2", "3"]));
            expectTypeOf(output).toEqualTypeOf<["1", "2", "3"]>();

            const output_fail_empty = inferenceSourceFn_TArr(
                //@ts-expect-error Argument of type '("" | "1" | "2")[]' is not assignable to parameter of type 'Allowed[]'.ts(2345)
                tupleExhaustiveOf<Allowed>()(["1", "2", ""]),
            );
            const output_fail_invalid = inferenceSourceFn(
                //@ts-expect-error Type 'string' is not assignable to type 'never'.ts(2322)
                tupleExhaustiveOf<Allowed>()(["1", "2", "2"]),
            );
            const output_fail_disallowed = inferenceSourceFn_TArr(
                //@ts-expect-error Type '"4"' is not assignable to type '"" | Allowed'.ts(2322)
                tupleExhaustiveOf<Allowed>()(["1", "2", "4"]),
            );
        }
        {
            const output = inferenceSourceFn_const_T(tupleExhaustiveOf<Allowed>()(["1", "2", "3"]));
            expectTypeOf(output).toEqualTypeOf<("1" | "2" | "3")[]>();

            const output_fail_empty = inferenceSourceFn_const_T(
                //@ts-expect-error Argument of type '("" | "1" | "2")[]' is not assignable to parameter of type 'Allowed[]'.ts(2345)
                tupleExhaustiveOf<Allowed>()(["1", "2", ""]),
            );
            const output_fail_invalid = inferenceSourceFn(
                //@ts-expect-error Type 'string' is not assignable to type 'never'.ts(2322)
                tupleExhaustiveOf<Allowed>()(["1", "2", "2"]),
            );
            const output_fail_disallowed = inferenceSourceFn_const_T(
                //@ts-expect-error Type '"4"' is not assignable to type '"" | Allowed'.ts(2322)
                tupleExhaustiveOf<Allowed>()(["1", "2", "4"]),
            );
        }
        {
            const output = inferenceSourceFn_const_TArr(tupleExhaustiveOf<Allowed>()(["1", "2", "3"]));
            expectTypeOf(output).toEqualTypeOf<["1", "2", "3"]>();

            const output_fail_empty = inferenceSourceFn_const_TArr(
                //@ts-expect-error Argument of type '("" | "1" | "2")[]' is not assignable to parameter of type 'Allowed[]'.ts(2345)
                tupleExhaustiveOf<Allowed>()(["1", "2", ""]),
            );
            const output_fail_invalid = inferenceSourceFn(
                //@ts-expect-error Type 'string' is not assignable to type 'never'.ts(2322)
                tupleExhaustiveOf<Allowed>()(["1", "2", "2"]),
            );
            const output_fail_disallowed = inferenceSourceFn_const_TArr(
                //@ts-expect-error Type '"4"' is not assignable to type '"" | Allowed'.ts(2322)
                tupleExhaustiveOf<Allowed>()(["1", "2", "4"]),
            );
        }
    });
});
