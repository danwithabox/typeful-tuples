README:
- list all utils
- show with gifs the DX of using each util
- a word about reliability - covered by tests for various TS versions, no heavy type-system abuse

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
- ts-vitest-versioner
    - FLAG
        - shortcuts to updates?
    - MENU
        - list
            - latest (5.4.5)
            - rc (5.5.0-rc)
            - beta (5.5.0-beta)
            - next (5.5.0-dev.20240101)
            - 5.4.0
        - vitest
            - > update vitest (1.5.2 -> 1.5.3)
            - > ~~update vitest (already latest)~~
        - update
            - [ ] update pinned - latest (5.4.5 -> 5.4.6)
            - [ ] ~~update pinned - latest (5.4.5 - already latest)~~
            - [ ] update pinned - rc (5.5.0-rc -> 5.6.0-rc)
            - [ ] ~~update pinned - rc (5.5.0-rc - already latest)~~
            - [ ] update pinned - beta (5.5.0-beta -> 5.6.0-beta)
            - [ ] ~~update pinned - beta (5.5.0-beta - already latest)~~
            - [ ] update pinned - next (5.5.0-dev.20240101 -> 5.6.0-20240102)
        - generate
            - > Custom input
                - Slow-validate input
            - > ~~5.4.0~~
        - delete
            - > ~~latest (5.4.5)~~
            - > ~~beta (5.5.0-beta)~~
            - > 5.4.0

TODO:
- tested TS versions as peer dependency? check how type-fest and typebox does it
    - maybe don't, because it has no runtime effect? so failing an install on this would be unnecessary?
- npx npm-packlist
    - is .editorconfig and LICENSE supposed to be packed?
        - are they even packed?
            - what's the command for packing without publish to inspect it?
