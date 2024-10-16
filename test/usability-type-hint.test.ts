import { expect, test } from "vitest";
import { virtualTs } from "../vitest/utils/vitest-virtual-typescript";

test("result type in hover text is a normal tuple, not an aliased type", () => {
    /**
     * TODO: make tooling for this? or figure out the same via the typeChecker?
     */
    function getHoverHintText() {
        const {
            vfs,
            sourceFiles: {
                sourceFiles,
                upsertSourceFile,
            },
        } = virtualTs;

        /** NOTE: DO NOT CHANGE INDENT OF SOURCE TEXT because getQuickInfoAtPosition() needs a specific manually found position number for now, and reformatting screws it up */
        upsertSourceFile(
            sourceFiles["../index.ts"].path,
/* ts */`
import { tupleUnique } from "${sourceFiles["../index.ts"].imports["./src/index"]}";
const result = tupleUnique(["foo", "bar"]);`,
        );

        const quickInfo = vfs.env.languageService.getQuickInfoAtPosition(
            sourceFiles["../index.ts"].path,
            56, // NOTE: had to manually find this by copy pasting the source text at the top of the file, and checking a text selection's length
        );
        const reduced = quickInfo?.displayParts?.reduce((acc, curr) => acc + curr.text, "");
        return reduced;
    }

    expect(getHoverHintText()).toEqual(`const result: ["foo", "bar"]`);
});
