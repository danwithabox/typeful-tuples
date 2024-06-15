// TODO: allow NaN and symbols and whatever else such values which are distinct but lack a distinct type, to be used, maybe type-fest already has an util
// describe(`types that require a transformation into an opaque type to produce expected behaviour`, () => {
//     test(`unique symbols work`, () => {
//         const sym1 = Symbol("sym1");
//         const sym2 = Symbol("sym2");
//         const sym3 = Symbol("sym3");

//         const values = tupleUnique([sym1, sym2, sym3]);
//     });

//     test(`NaN can be exempted from uniqueness check manually`, () => {
//         /** Idk what to do about this, there is no `NaN` type it's just `number` so it screws things up */
//         const values_NOPE1 = tupleUnique([0, NaN,                   3, 4, 1, 2]);
//         const values_NOPE2 = tupleUnique([NaN, 0,                        3, 4, 1, 2]); // interestingly, no error
//         const values_YEP_1 = tupleUnique([0, NaN as any as symbol,  3, 4, 1, 2]); // workaround?
//         const values_NOPE4 = tupleUnique([NaN as any as symbol,        NaN as any as symbol]); // nope
//         const values_NOPE5 = tupleUnique([NaN as any as unique symbol, NaN as any as unique symbol]); // 'unique symbol' not allowed

//         const values_MAYBE = tupleUnique([NaN as unknown, NaN as unknown]);
//         // Maybe I should exclude `unknown`? Or turn these into an opaque type? because other things like Number.POSITIVE_INFINITY could be desired too
//     });
// });
