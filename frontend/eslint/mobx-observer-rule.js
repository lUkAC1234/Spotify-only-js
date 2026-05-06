/**
 * @fileoverview
 * Enforces correct usage of MobX `observer` with React components.
 *
 * This rule prevents invalid or redundant combinations such as:
 * - using `@observer` with `PureComponent`
 * - wrapping `memo`, `React.memo`, or `forwardRef` with `observer`
 *
 * These patterns either break MobX reactivity or provide no benefit
 * and often cause subtle rendering bugs.
 */

/** @type {import('eslint').Rule.RuleModule} */
export default {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow incorrect combinations of MobX observer with PureComponent, memo, and forwardRef",
        },
        schema: [],
    },

    create(context) {
        /**
         * Checks whether a callee represents the MobX `observer` function.
         *
         * Supported forms:
         * - `observer(...)`
         * - `mobxReact.observer(...)`
         *
         * @param {import('estree').Node} node
         * @returns {boolean}
         */
        function isObserver(node) {
            return (
                (node.type === "Identifier" && node.name === "observer") ||
                (node.type === "MemberExpression" &&
                    node.object?.name === "mobxReact" &&
                    node.property?.name === "observer")
            );
        }

        /**
         * Validates the argument passed into `observer(...)`.
         *
         * Disallowed patterns:
         * - `observer(memo(...))`
         * - `observer(React.memo(...))`
         * - `observer(forwardRef(...))`
         * - `observer(React.forwardRef(...))`
         *
         * MobX already performs fine-grained tracking, so memoization
         * wrappers either do nothing or interfere with updates.
         *
         * @param {import('estree').CallExpression} node
         */
        function checkObserverCall(node) {
            if (!node.arguments || node.arguments.length === 0) return;

            const firstArg = node.arguments[0];

            // Only care about observer(<call expression>)
            if (firstArg.type !== "CallExpression") return;

            const callee = firstArg.callee;

            // memo(...)
            if (callee.type === "Identifier" && callee.name === "memo") {
                context.report({
                    node,
                    message: "observer() should not wrap memo(). Remove memo() when using observer().",
                });
            }

            // React.memo(...)
            if (
                callee.type === "MemberExpression" &&
                callee.object?.name === "React" &&
                callee.property?.name === "memo"
            ) {
                context.report({
                    node,
                    message: "observer() should not wrap React.memo(). Remove React.memo() when using observer().",
                });
            }

            // forwardRef(...)
            if (callee.type === "Identifier" && callee.name === "forwardRef") {
                context.report({
                    node,
                    message: "observer() should not wrap forwardRef(). Apply observer() inside forwardRef instead.",
                });
            }

            // React.forwardRef(...)
            if (
                callee.type === "MemberExpression" &&
                callee.object?.name === "React" &&
                callee.property?.name === "forwardRef"
            ) {
                context.report({
                    node,
                    message:
                        "observer() should not wrap React.forwardRef(). Apply observer() inside forwardRef instead.",
                });
            }
        }

        return {
            /**
             * Class component validation.
             *
             * Disallows:
             * - `@observer` class X extends PureComponent
             * - `@observer` class X extends React.PureComponent
             *
             * Reason:
             * PureComponent uses shallow comparison, which conflicts
             * with MobX's reactive rendering model.
             */
            ClassDeclaration(node) {
                if (!Array.isArray(node.decorators) || node.decorators.length === 0) return;

                const hasObserver = node.decorators.some((decorator) => {
                    const expr = decorator.expression;

                    // @observer
                    if (expr?.type === "Identifier" && expr.name === "observer") {
                        return true;
                    }

                    // @observer()
                    if (
                        expr?.type === "CallExpression" &&
                        expr.callee?.type === "Identifier" &&
                        expr.callee.name === "observer"
                    ) {
                        return true;
                    }

                    return false;
                });

                if (!hasObserver || !node.superClass) return;

                // extends PureComponent
                if (node.superClass.type === "Identifier" && node.superClass.name === "PureComponent") {
                    context.report({
                        node,
                        message: "@observer should not be used with PureComponent. Use Component instead.",
                    });
                }

                // extends React.PureComponent
                if (
                    node.superClass.type === "MemberExpression" &&
                    node.superClass.object?.name === "React" &&
                    node.superClass.property?.name === "PureComponent"
                ) {
                    context.report({
                        node,
                        message: "@observer should not be used with React.PureComponent. Use React.Component instead.",
                    });
                }
            },

            /**
             * Function component validation.
             *
             * Detects invalid `observer(...)` wrapping patterns such as:
             * `observer(memo(...))` or `observer(forwardRef(...))`
             */
            CallExpression(node) {
                if (isObserver(node.callee)) {
                    checkObserverCall(node);
                }
            },
        };
    },
};
