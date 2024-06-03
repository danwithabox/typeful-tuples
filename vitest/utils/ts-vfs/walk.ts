import ts from "typescript";

export function walkTransform<T extends ts.Node>(
    rootNode: ts.Node,
    context: ts.TransformationContext | undefined,
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    visitorCb: (node: ts.Node, abort: AbortController["abort"]) => (void | ts.VisitResult<ts.Node>),
): T {
    const ac = new AbortController();

    const visitor: ts.Visitor = (node) => {
        if (ac.signal.aborted) return node;

        const visitorResult = visitorCb(
            node,
            // Deliberately written out, because `.abort` is not bound to the `this` context
            (reason?: any) => ac.abort(reason),
        );
        if (visitorResult !== void 0) return visitorResult;

        return ts.visitEachChild(node, visitor, context);
    };
    return ts.visitNode(rootNode, visitor) as T;
}

export function walkFind<T extends ts.Node>(
    rootNode: ts.Node,
    context: ts.TransformationContext | undefined,
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    visitorCb: (node: ts.Node, abort: AbortController["abort"]) => (T | undefined | void),
): T | undefined {
    let found: T | undefined;
    const ac = new AbortController();

    const visitor: ts.Visitor = (node) => {
        if (ac.signal.aborted) return node;

        const visitorResult = visitorCb(
            node,
            // Deliberately written out, because `.abort` is not bound to the `this` context
            (reason?: any) => ac.abort(reason),
        );
        if (visitorResult !== void 0) {
            found = visitorResult;
            ac.abort();
        }

        return ts.visitEachChild(node, visitor, context);
    };
    ts.visitNode(rootNode, visitor) as ts.Node;
    return found;
}

/**
 * Creates a function, which, when given a start node, will walk the AST from that node, running the callback, until a node is returned from it.
 *
 * Accepts an undefined start node to ease the chainability of this function.
 *
 * E.g.
 *
 * ```ts
 * const nodeOf_ExportAssignment = walkMaybeToNodeOf(node => {
 *      if (ts.isExportAssignment(node)) return node;
 *  });
 *  const nodeOf_ArrayLiteralExpression = walkMaybeToNodeOf(node => {
 *      if (ts.isArrayLiteralExpression(node)) return node;
 *  });
 *
 *  const node1 = nodeOf_ExportAssignment(rootNode, context);
 *  const node2 = nodeOf_ArrayLiteralExpression(node1, context);
 * ```
 */
export function walkMaybeToNodeOf<T extends ts.Node>(walkFindFn: Parameters<typeof walkFind<T>>[2]) {
    return (
        nodeStart: ts.Node | undefined,
        /**
         * TODO: this is here to optionally appease `ts.visitEachChild()`, but research why is it useful
         */
        context?: ts.TransformationContext,
    ) => (nodeStart !== void 0) ? walkFind<T>(nodeStart, context, walkFindFn) : void 0;
}
