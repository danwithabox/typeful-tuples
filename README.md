TODO:
- real life example
- disclaimer that this is for TS only, just a type-level thing, so it's lightweight
- credit inspiration
    - https://ja.nsommer.dk/articles/type-checked-unique-arrays.html
    - https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#const-type-parameters
- mention that tupleOf could probably be deprecated with partial generics
    - and make an open issue about it
    - and reference the upstream TS issue: [Proposal: Partial Type Argument Inference #26242](https://github.com/microsoft/TypeScript/issues/26242)
- type-only examples and tests
- decide if TS peer dependency is needed
    - check type-fest for guideline
    - list which versions of TS it works with, maybe run tests for other versions somehow?

TODO: seed on all found search results
- https://www.reddit.com/r/typescript/comments/182fkh1/how_do_i_ensure_array_members_are_unique/

TODO: testing multiple versions
- latest version workspace
- handlebars codegen
- run latest, 5.4.5, and 5.3.3 in sequence

FINDING:
- workspace file does NOT replace TS
