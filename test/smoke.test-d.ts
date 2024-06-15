import { test } from "vitest";
import { tuple, tupleOf, tupleUnique } from "../src/index";

test("usability demo for tuple()", () => {
    const values1_correct = tuple([1, 2, 3, 4]);
    const values2_correct = tuple([1, "a", true, ["a", "b"], { a: [false, false], }]);
});

test("usability demo for tupleOf()", () => {
    const values1_correct = tupleOf<number>()([1, 2, 3, 4]);
    const values2_correct = tupleOf<number | string | boolean>()([1, "a", "b", true, false, 2]);
    const values3_correct = tupleOf()([1, ["a", "b"], ["a", "x"], true, false, 2]);
    const values4_correct = tupleOf()([1, ["a", "b"], ["a", "x"], true, false, 2] as const);
    const values5_correct = tupleOf()([1, ["a", "b"], ["a", "x"], { a: [false, false], }, { a: [false, true], }, true, false, 2]);
});

test("usability demo for tupleUnique()", () => {
    const values1_correct1 = tupleUnique([1, 2, 3, 4]);
    // @ts-expect-error invalid
    const values1_invalid1 = tupleUnique([1, 2, 3, 2]);

    const values2_correct1 = tupleUnique([1, 2, 3, 4, 5]);
    // @ts-expect-error invalid
    const values2_invalid1 = tupleUnique([1, 2, 3, 1, 2]);

    const values3_correct1 = tupleUnique([1, "a", "b", true, false, 2]);
    // @ts-expect-error invalid
    const values3_invalid1 = tupleUnique([1, "a", "a", true, true,  1]);

    const values4_correct1 = tupleUnique([1, ["a", "b"], ["a", "x"], true, false, 2]);
    // @ts-expect-error invalid
    const values4_invalid1 = tupleUnique([1, ["a", "b"], ["a", "b"], true, true,  1]);

    const values5_correct1 = tupleUnique([1, ["a", "b"], ["a", "x"], { a: [false, false], }, { a: [false, true], }, true, false, 2]);
    const values5_correct2 = tupleUnique([1, ["a", "b"], ["a", "x"], { a: [false, true], },  { b: [false, true], }, true, false, 2]);
    // @ts-expect-error invalid
    const values5_invalid1 = tupleUnique([1, ["a", "b"], ["a", "b"], { a: [false, true], },  { a: [false, true], }, true, true,  1]);
});

test("usability demo for tupleUniqueOf()", () => {
// TODO
});

test("usability demo for tupleExhaustiveOf()", () => {
// TODO
});
