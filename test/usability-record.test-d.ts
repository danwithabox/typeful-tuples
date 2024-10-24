import { expectTypeOf, test } from "vitest";
import { tupleOf, tupleUniqueOf, tupleExhaustiveOf, tupleUnique, tuple } from "../src/index";

type Keys = "foo" | "bar" | "baz";
type Allowed = "1" | "2" | "3";

test(`inference doesn't break when using "tuple()" as props in "Record<Keys, any>", "Record<Keys, unknown>", but breaks with "Record<Keys, unknown[]>"`, () => {
    const record_0_any = {
        foo: tuple(["1"]),
        bar: tuple(["1", "2", "2"]),
        baz: tuple(["1", "2", "3"]),
    } satisfies Record<Keys, any>;
    type Correct = {
        foo: ["1"],
        bar: ["1", "2", "2"],
        baz: ["1", "2", "3"],
    };
    expectTypeOf(record_0_any).toEqualTypeOf<Correct>();

    const record_0_unknown = {
        foo: tuple(["1"]),
        bar: tuple(["1", "2", "2"]),
        baz: tuple(["1", "2", "3"]),
    } satisfies Record<Keys, unknown>;
    expectTypeOf(record_0_unknown).toEqualTypeOf<Correct>();

    const record_1 = {
        foo: tuple(["1"]),
        bar: tuple(["1", "2", "2"]),
        baz: tuple(["1", "2", "3"]),
    } satisfies Record<Keys, unknown[]>;
    expectTypeOf(record_1).toEqualTypeOf<Correct>();
});

test(`inference doesn't break when using "tupleUnique()" as props in "Record<Keys, any>", "Record<Keys, unknown>", but breaks with "Record<Keys, unknown[]>"`, () => {
    const record_0_any = {
        foo: tupleUnique(["1"]),
        // @ts-expect-error correctly invalid tuple
        bar: tupleUnique(["1", "2", "2"]),
        baz: tupleUnique(["1", "2", "3"]),
    } satisfies Record<Keys, any>;
    type Correct = {
        foo: ["1"],
        bar: ["1", "2", "2"],
        baz: ["1", "2", "3"],
    };
    expectTypeOf(record_0_any).toEqualTypeOf<Correct>();

    const record_0_unknown = {
        foo: tupleUnique(["1"]),
        // @ts-expect-error correctly invalid tuple
        bar: tupleUnique(["1", "2", "2"]),
        baz: tupleUnique(["1", "2", "3"]),
    } satisfies Record<Keys, unknown>;
    expectTypeOf(record_0_unknown).toEqualTypeOf<Correct>();

    const record_1 = {
        foo: tupleUnique(["1"]),
        // @ts-expect-error correctly invalid tuple
        bar: tupleUnique(["1", "2", "2"]),
        baz: tupleUnique(["1", "2", "3"]),
    } satisfies Record<Keys, unknown[]>;
    expectTypeOf(record_1).toEqualTypeOf<Correct>();
});

test(`inference doesn't break when using "tupleOf()" as props in "Record<Keys, any>", "Record<Keys, unknown>", but breaks with "Record<Keys, unknown[]>"`, () => {
    const values = tupleOf<Allowed>();

    const record_0_any = {
        foo: values(["1"]),
        bar: values(["1", "2"]),
        baz: values(["1", "2", "3"]),
    } satisfies Record<Keys, any>;
    type Correct = {
        foo: ["1"],
        bar: ["1", "2"],
        baz: ["1", "2", "3"],
    };
    expectTypeOf(record_0_any).toEqualTypeOf<Correct>();

    const record_0_unknown = {
        foo: values(["1"]),
        bar: values(["1", "2"]),
        baz: values(["1", "2", "3"]),
    } satisfies Record<Keys, unknown>;
    expectTypeOf(record_0_unknown).toEqualTypeOf<Correct>();

    const record_1 = {
        foo: values(["1"]),
        bar: values(["1", "2", "2"]),
        // @ts-expect-error correctly invalid tuple
        baz: values(["1", "2", ""]),
    } satisfies Record<Keys, any>;
    expectTypeOf(record_1).not.toEqualTypeOf<Correct>();
    const record_2 = {
        foo: values(["1"]),
        bar: values(["1", "2", "2"]),
        // @ts-expect-error correctly invalid tuple
        baz: values(["1", "2", ""]),
    } satisfies Record<Keys, unknown>;
    expectTypeOf(record_2).not.toEqualTypeOf<Correct>();
    const record_3 = {
        foo: values(["1"]),
        bar: values(["1", "2", "2"]),
        baz: values(["1", "2", "3"]),
    } satisfies Record<Keys, unknown[]>;
    expectTypeOf(record_3).not.toEqualTypeOf<Correct>();
});

test(`inference doesn't break when using "tupleUniqueOf()" as props in "Record<Keys, any>", "Record<Keys, unknown>", but breaks with "Record<Keys, unknown[]>"`, () => {
    const values = tupleUniqueOf<Allowed>();

    const record_0_any = {
        foo: values(["1"]),
        bar: values(["1", "2"]),
        baz: values(["1", "2", "3"]),
    } satisfies Record<Keys, any>;
    type Correct = {
        foo: ["1"],
        bar: ["1", "2"],
        baz: ["1", "2", "3"],
    };
    expectTypeOf(record_0_any).toEqualTypeOf<Correct>();

    const record_0_unknown = {
        foo: values(["1"]),
        bar: values(["1", "2"]),
        baz: values(["1", "2", "3"]),
    } satisfies Record<Keys, unknown>;
    expectTypeOf(record_0_unknown).toEqualTypeOf<Correct>();

    const record_1 = {
        foo: values(["1"]),
        // @ts-expect-error correctly invalid tuple
        bar: values(["1", "2", "2"]),
        // @ts-expect-error correctly invalid tuple
        baz: values(["1", "2", ""]),
    } satisfies Record<Keys, any>;
    expectTypeOf(record_1).not.toEqualTypeOf<Correct>();
    const record_2 = {
        foo: values(["1"]),
        // @ts-expect-error correctly invalid tuple
        bar: values(["1", "2", "2"]),
        // @ts-expect-error correctly invalid tuple
        baz: values(["1", "2", ""]),
    } satisfies Record<Keys, unknown>;
    expectTypeOf(record_2).not.toEqualTypeOf<Correct>();
    const record_3 = {
        foo: values(["1"]),
        // @ts-expect-error correctly invalid tuple
        bar: values(["1", "2", "2"]),
        // @ts-expect-error correctly invalid tuple
        baz: values(["1", "2", ""]),
    } satisfies Record<Keys, unknown[]>;
    expectTypeOf(record_3).not.toEqualTypeOf<Correct>();
});

test(`inference doesn't break when using "tupleExhaustiveOf()" as props in "Record<Keys, any>", "Record<Keys, unknown>", but breaks with "Record<Keys, unknown[]>"`, () => {
    const values = tupleExhaustiveOf<Allowed>();

    const record_0_any = {
        foo: values(["1", "2", "3"]),
        bar: values(["1", "3", "2"]),
        baz: values(["3", "2", "1"]),
    } satisfies Record<Keys, any>;
    type Correct = {
        foo: ["1", "2", "3"],
        bar: ["1", "3", "2"],
        baz: ["3", "2", "1"],
    };
    expectTypeOf(record_0_any).toEqualTypeOf<Correct>();

    const record_0_unknown = {
        foo: values(["1", "2", "3"]),
        bar: values(["1", "3", "2"]),
        baz: values(["3", "2", "1"]),
    } satisfies Record<Keys, unknown>;
    expectTypeOf(record_0_unknown).toEqualTypeOf<Correct>();

    const record_1 = {
        foo: values(["1", "2", "3"]),
        // @ts-expect-error correctly invalid tuple
        bar: values(["1", "2", "2"]),
        // @ts-expect-error correctly invalid tuple
        baz: values(["1", "2", ""]),
    } satisfies Record<Keys, any>;
    expectTypeOf(record_1).not.toEqualTypeOf<Correct>();
    const record_2 = {
        foo: values(["1", "2", "3"]),
        // @ts-expect-error correctly invalid tuple
        bar: values(["1", "2", "2"]),
        // @ts-expect-error correctly invalid tuple
        baz: values(["1", "2", ""]),
    } satisfies Record<Keys, unknown>;
    expectTypeOf(record_2).not.toEqualTypeOf<Correct>();
    const record_3 = {
        // @ts-expect-error correctly invalid tuple
        foo: values(["1"]),
        // @ts-expect-error correctly invalid tuple
        bar: values(["1", "2", "2"]),
        // @ts-expect-error correctly invalid tuple
        baz: values(["1", "2", ""]),
    } satisfies Record<Keys, unknown[]>;
    expectTypeOf(record_3).not.toEqualTypeOf<Correct>();
});
