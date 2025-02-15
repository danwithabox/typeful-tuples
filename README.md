# @danwithabox/typeful-tuples

[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TypeScript tuples are good, but they can be better 👉👉

## Install

```bash
$ npm install @danwithabox/typeful-tuples --save
```

> [!IMPORTANT]
> This package has a peer dependency of `typescript@>=5.4.2`, versions below are not supported as this depends on [inference improvements from TypeScript 5.4](https://devblogs.microsoft.com/typescript/announcing-typescript-5-4/)!

## Overview

Ever been annoyed by `as const` returning readonly arrays? It's a thing of the past!
```ts
const nay = ["foo", "bar"] as const;
const yay = tuple(["foo", "bar"]); // not readonly!
```
Great, but what if you'd like to narrow the allowed elements?
```ts
const yay = tupleOf<"foo" | "baz">()(["foo", "bar"]); // and realize that you meant `"baz"` instead of `"bar"`!
```
Or did you want to express well-known values, without the risk of duplicates?
```ts
const colorOptions = tupleUnique(["gray", "red", "blue", "light green", "gold", "red", "lime green"]); // a red squiggle will mark the embarrassing doubled option!
```
And again, narrowing the allowed elements:
```ts
const colorOptionsButBoring = tupleUniqueOf<"red" | "blue">()(["gray", "red", "blue", "light green", "gold", "red", "lime green"]); // lots more red squiggles now, enforcing a really boring color picker!
```
But what if you not only want to narrow, but enforce the provided elements?
```ts
const colorOptionsForSure = tupleExhaustiveOf<"red" | "green" | "blue">()(["red", "blue"]); // missing something!
```

In summary:

|                               | uniqueness?   | narrowed?     | exhaustive?   |
| ----------------------------- | ------------- | ------------- | ------------- |
| `tuple()`                     | ❌           | ❌            | ❌           |
| `tupleUnique()`               | ✅           | ❌            | ❌           |
| `tupleOf<T>()()`              | ❌           | ✅            | ❌           |
| `tupleUniqueOf<T>()()`        | ✅           | ✅            | ❌           |
| `tupleExhaustiveOf<T>()()`    | ✅           | ✅            | ✅           |

## Example

![output](https://github.com/danwithabox/typeful-tuples/assets/144792741/2e46bee7-e8f0-4d91-b80c-204a895e2261)

```ts
import { tuple, tupleOf, tupleUnique, tupleUniqueOf, tupleExhaustiveOf } from "@danwithabox/typeful-tuples";

type Allowed = "foo" | "bar" | 42 | "baz";

// Behaves like `[] as const`, except the result array is not `readonly`
tuple(["foo", "foo"]);

// Non-unique elements are rejected with a `never` type
tupleUnique(["foo", "bar", "baz"]);

// Same as `tuple()`, but only accepts the provided types
tupleOf<Allowed>()(["bar", "foo", "foo", "bar"]);

// Same as `tupleUnique()`, but only accepts the provided types
tupleUniqueOf<Allowed>()(["foo", "bar"]);

// Same as `tupleUniqueOf()`, but all provided types are required in the tuple
tupleExhaustiveOf<Allowed>()(["baz", 42, "bar", "foo"]);

```

## Assurances

### Performance
Typechecking speed is excellent and scales linearly - but way before that could become a problem, TS may throw `Type instantiation is excessively deep and possibly infinite.ts(2589)`. This [tends to happen with advanced types](https://github.com/sindresorhus/type-fest/pull/650), unfortunately. From what I've seen, unique tuples should not throw below ~40 elements. Meaningful hand-written tuples are rarely that large, but I'm not entriely happy with it anyway, and may improve it in the future.

### Reliability
While the type algebra I use for this package is non-trivial, it's also non-volatile - the TypeScript features exploited in here *are supposed to be stable*.

**However**, TypeScript is very lax with breaking changes: [TypeScript’s Versioning Policy - Semantic Versioning for TypeScript Types (semver-ts.org)](https://www.semver-ts.org/1-background.html)

As such, I have created robusts tests and embedded a CLI tool in this project:
- the tests cover multiple TypeScript versions, and also assert IDE and language server messages (autocompletes and "red squiggles")
- consumers of the package see nothing of this
- people who wish to mess with the source should check the `"bin"` property in `package.json`

> **TLDR**: not even wild TypeScript updates may break this package

## Limitations
Not a lot!

One limitation is the `Type instantiation is excessively deep and possibly infinite.ts(2589)` issue mentioned above.

`NaN`, `Symbol`s and other such special values that look distinct, but are actually not unique literals according to the type system, also cause issues. Do not use them as elements for now.

If you are wondering why `tupleOf<T>()()`, `tupleUniqueOf<T>()()`, and `tupleExhaustiveOf<>()()` are curried functions, it's because of the need for a user-defined generic type parameter. The upstream TypeScript issue that blocks them from becoming non-curried, or to even be merged with `tuple()` and `tupleUnique()`, is this: [Proposal: Partial Type Argument Inference #26242](https://github.com/microsoft/TypeScript/issues/26242)
<!-- Incorporating typeful tuples into function signatures as parameters, e.g. telling a function to expect a unique tuple, cannot be simplified much. -->

## Acknowledgements
Initial inspiration by: https://ja.nsommer.dk/articles/type-checked-unique-arrays.html

Grateful for this TypeScript feature finally landing: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#const-type-parameters

## Feedback & Contribution
I welcome feedback about use cases where this package may fall short, but within the scope of "tuple element uniqueness checks".

My motivation to create this was slowly built up over years of slight frustrations with tuples, if you have similar pet peeves, do tell.

As with any advanced TypeScript stuff, the types powering this are not for the faint of heart, and I do not wish to complicate them much further - post issues with this in mind.
